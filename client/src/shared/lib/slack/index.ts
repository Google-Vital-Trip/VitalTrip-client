type SlackTextObject = { type: 'mrkdwn'; text: string } | { type: 'plain_text'; text: string };

type SlackBlock =
  | { type: 'header'; text: { type: 'plain_text'; text: string } }
  | { type: 'section'; text: SlackTextObject }
  | { type: 'context'; elements: SlackTextObject[] }
  | { type: 'divider' };

export async function sendSlackWebhook(
  webhookUrl: string,
  payload: { text: string; blocks?: SlackBlock[] },
) {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Slack webhook failed: ${res.status} ${text}`);
  }
}

export function buildSlackBlocks(input: {
  title: string;
  project?: string | null;
  environment?: string | null;
  level?: string | null;
  url?: string | null;
  windowMin: number;
  windowCount: number;
  totalCount: number;
  triage?: {
    severity?: string;
    summary?: string;
    likely_causes?: string[];
    next_actions?: string[];
  } | null;
}) {
  const severity = input.triage?.severity ?? 'P?';
  const header = `🚨 ${severity} | ${input.project ?? '-'} | ${input.environment ?? '-'} | level=${input.level ?? '-'}`;

  const blocks: SlackBlock[] = [
    { type: 'header', text: { type: 'plain_text', text: header } },
    { type: 'section', text: { type: 'mrkdwn', text: `*${input.title}*` } },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `최근 ${input.windowMin}분: *${input.windowCount}* / 누적: *${input.totalCount}*`,
        },
      ],
    },
  ];

  if (input.url) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `🔗 <${input.url}|Open in Sentry>` },
    });
  }

  if (input.triage?.summary) {
    blocks.push({ type: 'divider' });
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*🧠 요약*\n${input.triage.summary}` },
    });
  }

  const causes = input.triage?.likely_causes ?? [];
  if (causes.length) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*🔎 원인 후보*\n• ${causes.join('\n• ')}` },
    });
  }

  const actions = input.triage?.next_actions ?? [];
  if (actions.length) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*✅ 다음 액션*\n• ${actions.join('\n• ')}` },
    });
  }

  // blocks는 최대 50개 제한이 있으니(우린 훨씬 아래) 안전 :contentReference[oaicite:5]{index=5}
  return blocks;
}
