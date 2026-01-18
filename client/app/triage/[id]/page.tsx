import { TriageJson, triageWithOpenAI } from '@/src/shared/lib/llm/openaiTriage';
import { prisma } from '@/src/shared/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function setStatus(id: string, status: 'OPEN' | 'ACK' | 'FIXED' | 'IGNORED') {
  'use server';
  await prisma.sentryIssue.update({ where: { id }, data: { status } });
}

async function retriage(id: string) {
  'use server';
  if (!process.env.OPENAI_API_KEY) return;

  const issue = await prisma.sentryIssue.findUnique({ where: { id } });
  if (!issue) return;

  const triage = await triageWithOpenAI({
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
    payload: { note: 'manual_retriage' },
  });

  const now = new Date();

  await prisma.$transaction([
    prisma.triageRun.create({
      data: { issueId: issue.id, provider: 'openai', model: 'gpt-5-mini', result: triage },
    }),
    prisma.sentryIssue.update({
      where: { id: issue.id },
      data: { triageJson: triage as unknown as TriageJson, triageUpdatedAt: now },
    }),
  ]);
}

type IssueStatus = 'OPEN' | 'ACK' | 'FIXED' | 'IGNORED';

const statusColors: Record<IssueStatus, string> = {
  OPEN: 'bg-red-100 text-red-700 border-red-200',
  ACK: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  FIXED: 'bg-green-100 text-green-700 border-green-200',
  IGNORED: 'bg-gray-100 text-gray-600 border-gray-200',
};

const levelColors = {
  error: 'bg-red-50 text-red-700 border-red-200',
  warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  debug: 'bg-gray-50 text-gray-700 border-gray-200',
};

export default async function TriageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const issue = await prisma.sentryIssue.findUnique({ where: { id } });
  if (!issue)
    return (
      <main className='flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50'>
        <div className='text-center'>
          <div className='text-6xl'>🔍</div>
          <h1 className='mt-4 text-2xl font-bold text-slate-900'>Issue Not Found</h1>
          <p className='mt-2 text-slate-600'>해당 이슈를 찾을 수 없습니다.</p>
          <Link
            href='/triage'
            className='mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-blue-700'
          >
            목록으로 돌아가기
          </Link>
        </div>
      </main>
    );

  const logs = await prisma.notificationLog.findMany({
    where: { issueId: issue.id },
    orderBy: { sentAt: 'desc' },
    take: 30,
  });

  return (
    <main className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
      <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        {/* Back Button */}
        <Link
          href='/triage'
          className='mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900'
        >
          <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M15 19l-7-7 7-7'
            />
          </svg>
          목록으로 돌아가기
        </Link>

        {/* Header */}
        <div className='mb-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50'>
          <div className='flex flex-wrap items-start justify-between gap-4'>
            <div className='min-w-0 flex-1'>
              <h1 className='text-2xl font-black text-slate-900'>
                {issue.title ?? 'Sentry Issue'}
              </h1>
              <div className='mt-4 flex flex-wrap items-center gap-2 text-sm'>
                <span
                  className={`rounded-md border px-3 py-1.5 font-semibold ${statusColors[issue.status as IssueStatus]}`}
                >
                  {issue.status}
                </span>
                {issue.level && (
                  <span
                    className={`rounded-md border px-3 py-1.5 font-medium ${levelColors[issue.level as keyof typeof levelColors] || 'border-gray-200 bg-gray-50 text-gray-700'}`}
                  >
                    {issue.level}
                  </span>
                )}
                <span className='text-slate-500'>·</span>
                <span className='font-medium text-slate-700'>
                  {issue.project ?? 'Unknown Project'}
                </span>
                <span className='text-slate-500'>·</span>
                <span className='font-medium text-slate-700'>
                  {issue.environment ?? 'Unknown Env'}
                </span>
              </div>
            </div>
            {issue.url && (
              <a
                href={issue.url}
                target='_blank'
                rel='noreferrer'
                className='inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700'
              >
                <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
                  />
                </svg>
                Open in Sentry
              </a>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className='mb-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50'>
          <h2 className='mb-4 text-lg font-bold text-slate-900'>Actions</h2>
          <div className='flex flex-wrap gap-3'>
            <form action={setStatus.bind(null, issue.id, 'OPEN')}>
              <button className='rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white transition-all hover:bg-red-700 hover:shadow-md'>
                Mark as OPEN
              </button>
            </form>
            <form action={setStatus.bind(null, issue.id, 'ACK')}>
              <button className='rounded-lg bg-yellow-600 px-5 py-2.5 font-semibold text-white transition-all hover:bg-yellow-700 hover:shadow-md'>
                Acknowledge
              </button>
            </form>
            <form action={setStatus.bind(null, issue.id, 'FIXED')}>
              <button className='rounded-lg bg-green-600 px-5 py-2.5 font-semibold text-white transition-all hover:bg-green-700 hover:shadow-md'>
                Mark as FIXED
              </button>
            </form>
            <form action={setStatus.bind(null, issue.id, 'IGNORED')}>
              <button className='rounded-lg bg-gray-600 px-5 py-2.5 font-semibold text-white transition-all hover:bg-gray-700 hover:shadow-md'>
                Ignore
              </button>
            </form>
            <form action={retriage.bind(null, issue.id)}>
              <button className='rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-md'>
                🤖 Re-triage with AI
              </button>
            </form>
          </div>
        </div>

        {/* LLM Triage Results */}
        <section className='mb-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50'>
          <h2 className='mb-4 text-lg font-bold text-slate-900'>🤖 AI Triage Analysis</h2>
          {issue.triageJson ? (
            <pre className='overflow-auto rounded-lg bg-slate-50 p-4 text-sm text-slate-800 ring-1 ring-slate-200'>
              {JSON.stringify(issue.triageJson, null, 2)}
            </pre>
          ) : (
            <div className='rounded-lg bg-slate-50 p-8 text-center text-slate-600'>
              No triage data available. Click &quot;Re-triage with AI&quot; to generate analysis.
            </div>
          )}
        </section>

        {/* Notification Logs */}
        <section className='rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50'>
          <h2 className='mb-4 text-lg font-bold text-slate-900'>📬 Slack Notification Logs</h2>
          {logs.length > 0 ? (
            <div className='overflow-hidden rounded-lg ring-1 ring-slate-200'>
              <table className='min-w-full divide-y divide-slate-200'>
                <thead className='bg-slate-50'>
                  <tr>
                    <th className='px-4 py-3 text-left text-xs font-semibold tracking-wider text-slate-600 uppercase'>
                      Timestamp
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-semibold tracking-wider text-slate-600 uppercase'>
                      Status
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-semibold tracking-wider text-slate-600 uppercase'>
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-200 bg-white'>
                  {logs.map(
                    (l: {
                      id: string;
                      sentAt: Date;
                      success: boolean;
                      errorMsg: string | null;
                    }) => (
                      <tr key={l.id} className='transition-colors hover:bg-slate-50'>
                        <td className='px-4 py-3 text-sm whitespace-nowrap text-slate-900'>
                          {new Date(l.sentAt).toLocaleString('ko-KR')}
                        </td>
                        <td className='px-4 py-3 text-sm whitespace-nowrap'>
                          {l.success ? (
                            <span className='inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700'>
                              <span className='h-1.5 w-1.5 rounded-full bg-green-600'></span>
                              Success
                            </span>
                          ) : (
                            <span className='inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700'>
                              <span className='h-1.5 w-1.5 rounded-full bg-red-600'></span>
                              Failed
                            </span>
                          )}
                        </td>
                        <td className='px-4 py-3 text-sm text-slate-600'>
                          {l.success
                            ? 'Notification sent successfully'
                            : l.errorMsg || 'Unknown error'}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className='rounded-lg bg-slate-50 p-8 text-center text-slate-600'>
              No notification logs available.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
