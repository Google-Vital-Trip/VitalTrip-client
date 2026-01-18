import { TriageJson, triageWithOpenAI } from '@/src/shared/lib/llm/openaiTriage';
import { prisma } from '@/src/shared/lib/prisma';
import { verifySentrySignature } from '@/src/shared/lib/sentry/verifySignature';
import { buildSlackBlocks, sendSlackWebhook } from '@/src/shared/lib/slack';
import { NextResponse } from 'next/server';

const WINDOW_MIN = Number(process.env.ALERT_WINDOW_MINUTES ?? '10');
const TRIAGE_TTL_HOURS = Number(process.env.TRIAGE_TTL_HOURS ?? '24');
const WINDOW_MS = WINDOW_MIN * 60 * 1000;
const TRIAGE_TTL_MS = TRIAGE_TTL_HOURS * 60 * 60 * 1000;

function header(req: Request, name: string) {
  return req.headers.get(name) ?? req.headers.get(name.toLowerCase());
}

import { Prisma } from '@prisma/client';

interface SentryIssue {
  id?: string;
  title?: string;
  level?: string;
  project?: { slug?: string };
  url?: string;
  culprit?: string;
}

interface SentryEvent {
  title?: string;
  message?: string;
  level?: string;
  environment?: string;
}

interface SentryPayload {
  data?: {
    issue?: SentryIssue;
    event?: SentryEvent;
  };
  issue?: SentryIssue;
  event?: SentryEvent;
  issueId?: string;
  title?: string;
  level?: string;
  project?: string | { slug?: string };
  environment?: string;
  url?: string;
  culprit?: string;
}

// Sentry payload 구조가 케이스별로 달라서 "유연 추출"
function extractSentryFields(body: unknown) {
  const b = body as SentryPayload;
  const issue = b?.data?.issue ?? b?.issue ?? {};
  const event = b?.data?.event ?? b?.event ?? {};

  const issueId = String(issue?.id ?? b?.issueId ?? '');
  const title = issue?.title ?? b?.title ?? event?.title ?? event?.message ?? null;
  const level = event?.level ?? b?.level ?? issue?.level ?? 'error';

  const projectSlug =
    typeof b?.project === 'string' ? b.project : (b?.project?.slug ?? issue?.project?.slug ?? null);
  const environment = event?.environment ?? b?.environment ?? null;
  const url = issue?.url ?? b?.url ?? null;
  const culprit = issue?.culprit ?? null;

  return { issueId, title, level, project: projectSlug, environment, url, culprit };
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  // 1) 서명 검증 (Internal Integration일 때 signature 헤더가 온다) :contentReference[oaicite:6]{index=6}
  const secret = process.env.SENTRY_CLIENT_SECRET;
  const sig = header(req, 'Sentry-Hook-Signature');
  if (secret) {
    const ok = verifySentrySignature(rawBody, sig, secret);
    if (!ok) return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
  }

  // 2) JSON parse
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  const { issueId, title, level, project, environment, url, culprit } = extractSentryFields(body);
  if (!issueId) return NextResponse.json({ message: 'Missing issue id' }, { status: 400 });

  const now = new Date();

  // 3) DB upsert + 10분 윈도우 집계
  const issue = await prisma.$transaction(
    async (
      tx: Omit<
        typeof prisma,
        '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
      >,
    ) => {
      const existing = await tx.sentryIssue.findUnique({ where: { id: issueId } });

      if (!existing) {
        return tx.sentryIssue.create({
          data: {
            id: issueId,
            title,
            level,
            project,
            environment,
            url,
            culprit,
            firstSeenAt: now,
            lastSeenAt: now,
            totalCount: 1,
            windowStartAt: now,
            windowCount: 1,
          },
        });
      }

      const windowExpired = now.getTime() - existing.windowStartAt.getTime() > WINDOW_MS;

      return tx.sentryIssue.update({
        where: { id: issueId },
        data: {
          title,
          level,
          project,
          environment,
          url,
          culprit,
          lastSeenAt: now,
          totalCount: { increment: 1 },
          windowStartAt: windowExpired ? now : existing.windowStartAt,
          windowCount: windowExpired ? 1 : { increment: 1 },
        },
      });
    },
  );

  // 4) 도배 방지: 같은 이슈는 10분에 1번만 알림
  const shouldNotify =
    !issue.lastNotifiedAt || now.getTime() - issue.lastNotifiedAt.getTime() > WINDOW_MS;

  if (!shouldNotify) {
    return NextResponse.json({ ok: true, skipped: 'rate_limited' });
  }

  // 5) 조건부 LLM + TTL 캐시
  let triage: TriageJson | null = (issue.triageJson as TriageJson) ?? null;

  const triageExpired =
    !issue.triageUpdatedAt || now.getTime() - issue.triageUpdatedAt.getTime() > TRIAGE_TTL_MS;

  const isNew = issue.totalCount === 1;
  const isSpike = issue.windowCount >= 5;
  const isError = ['error', 'fatal'].includes(String(issue.level).toLowerCase());

  if (process.env.OPENAI_API_KEY && (!triage || triageExpired) && (isNew || isSpike || isError)) {
    triage = await triageWithOpenAI({
      issue: {
        id: issue.id,
        title: issue.title,
        level: issue.level,
        project: issue.project,
        environment: issue.environment,
        url: issue.url,
        windowCount: issue.windowCount,
        totalCount: issue.totalCount,
      },
      payload: body,
    });

    await prisma.$transaction([
      prisma.triageRun.create({
        data: { issueId: issue.id, provider: 'openai', model: 'gpt-5-mini', result: triage },
      }),
      prisma.sentryIssue.update({
        where: { id: issue.id },
        data: { triageJson: triage as unknown as Prisma.InputJsonValue, triageUpdatedAt: now },
      }),
    ]);
  }

  // 6) Slack 알림 전송 (Incoming Webhook)
  const slackUrl = process.env.SLACK_WEBHOOK_URL;
  if (!slackUrl)
    return NextResponse.json({ message: 'Missing SLACK_WEBHOOK_URL' }, { status: 500 });

  const blocks = buildSlackBlocks({
    title: issue.title ?? 'Sentry Issue',
    project: issue.project,
    environment: issue.environment,
    level: issue.level,
    url: issue.url,
    windowMin: WINDOW_MIN,
    windowCount: issue.windowCount,
    totalCount: issue.totalCount,
    triage: triage
      ? {
          severity: triage.severity,
          summary: triage.summary,
          likely_causes: triage.likely_causes,
          next_actions: triage.next_actions,
        }
      : null,
  });

  // Slack은 text를 fallback으로 넣는 게 좋다 (알림/미리보기용)
  const fallbackText = `[${issue.project ?? '-'}|${issue.environment ?? '-'}] ${issue.title ?? 'Sentry Issue'} (${issue.level ?? '-'})`;

  try {
    await sendSlackWebhook(slackUrl, { text: fallbackText, blocks });

    await prisma.$transaction([
      prisma.notificationLog.create({
        data: { issueId: issue.id, channel: 'slack', success: true },
      }),
      prisma.sentryIssue.update({
        where: { id: issue.id },
        data: { lastNotifiedAt: now },
      }),
    ]);
  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    await prisma.notificationLog.create({
      data: {
        issueId: issue.id,
        channel: 'slack',
        success: false,
        errorMsg,
      },
    });

    return NextResponse.json({ ok: false, error: 'notify_failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
