export type TriageJson = {
  summary: string;
  likely_causes: string[];
  next_actions: string[];
  severity: 'P0' | 'P1' | 'P2' | 'P3';
  tags: string[];
};

function extractJson(text: string) {
  const s = text.trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start < 0 || end < 0) throw new Error(`LLM did not return JSON: ${s}`);
  return JSON.parse(s.slice(start, end + 1));
}

export async function triageWithOpenAI(input: {
  issue: {
    id: string;
    title?: string | null;
    level?: string | null;
    project?: string | null;
    environment?: string | null;
    url?: string | null;
    windowCount: number;
    totalCount: number;
  };
  payload: unknown;
}): Promise<TriageJson> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY');

  const prompt = `
너는 시니어 프론트엔드 엔지니어다.
Sentry 이슈를 보고 팀이 바로 움직일 수 있도록 트리아지 JSON만 출력해라.

규칙:
- JSON만 출력(설명/마크다운 금지)
- likely_causes 최대 3개
- next_actions 3~7개
- severity P0~P3

입력:
project=${input.issue.project ?? ''}
env=${input.issue.environment ?? ''}
level=${input.issue.level ?? ''}
title=${input.issue.title ?? ''}
url=${input.issue.url ?? ''}
recent_10m_count=${input.issue.windowCount}
total_count=${input.issue.totalCount}

payload(일부):
${JSON.stringify(input.payload).slice(0, 8000)}
`.trim();

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-mini',
      input: prompt,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenAI failed: ${res.status} ${text}`);
  }

  const data: unknown = await res.json();
  const d = data as { output?: { content?: { text?: string }[] }[]; output_text?: string }; // minimal shape
  const text = d?.output?.[0]?.content?.[0]?.text ?? d?.output_text ?? '';

  return extractJson(String(text));
}
