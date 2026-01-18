import { prisma } from '@/src/shared/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type IssueStatus = 'OPEN' | 'ACK' | 'FIXED' | 'IGNORED';

const statusColors: Record<IssueStatus, string> = {
  OPEN: 'bg-red-100 text-red-700 border-red-200',
  ACK: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  FIXED: 'bg-green-100 text-green-700 border-green-200',
  IGNORED: 'bg-gray-100 text-gray-600 border-gray-200',
};

const levelColors = {
  error: 'text-red-600',
  warning: 'text-yellow-600',
  info: 'text-blue-600',
  debug: 'text-gray-600',
};

export default async function TriageListPage() {
  const issues = await prisma.sentryIssue.findMany({
    orderBy: { lastSeenAt: 'desc' },
    take: 50,
  });

  return (
    <main className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
      <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-4xl font-black text-transparent'>
            Sentry Triage
          </h1>
          <p className='mt-2 text-sm text-slate-600'>최근 50개 이슈 모니터링</p>
        </div>

        {/* Stats Overview */}
        <div className='mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <div className='rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50'>
            <div className='text-sm font-medium text-slate-600'>Total Issues</div>
            <div className='mt-1 text-2xl font-bold text-slate-900'>{issues.length}</div>
          </div>
          <div className='rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50'>
            <div className='text-sm font-medium text-slate-600'>Open</div>
            <div className='mt-1 text-2xl font-bold text-red-600'>
              {issues.filter((i: { status: IssueStatus }) => i.status === 'OPEN').length}
            </div>
          </div>
          <div className='rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50'>
            <div className='text-sm font-medium text-slate-600'>Acknowledged</div>
            <div className='mt-1 text-2xl font-bold text-yellow-600'>
              {issues.filter((i: { status: IssueStatus }) => i.status === 'ACK').length}
            </div>
          </div>
          <div className='rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50'>
            <div className='text-sm font-medium text-slate-600'>Fixed</div>
            <div className='mt-1 text-2xl font-bold text-green-600'>
              {issues.filter((i: { status: IssueStatus }) => i.status === 'FIXED').length}
            </div>
          </div>
        </div>

        {/* Issues List */}
        <div className='space-y-3'>
          {issues.map(
            (i: {
              id: string;
              title: string | null;
              status: IssueStatus;
              level: string | null;
              project: string | null;
              environment: string | null;
              windowCount: number;
              totalCount: number;
            }) => (
              <Link
                key={i.id}
                href={`/triage/${i.id}`}
                className='group block rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/50 transition-all duration-200 hover:shadow-lg hover:ring-slate-300'
              >
                <div className='flex items-start justify-between gap-4'>
                  <div className='min-w-0 flex-1'>
                    <h3 className='truncate text-lg font-bold text-slate-900 group-hover:text-blue-600'>
                      {i.title ?? '(no title)'}
                    </h3>
                    <div className='mt-3 flex flex-wrap items-center gap-2 text-sm'>
                      <span
                        className={`rounded-md border px-2.5 py-1 font-medium ${statusColors[i.status as IssueStatus]}`}
                      >
                        {i.status}
                      </span>
                      {i.level && (
                        <span
                          className={`font-semibold ${levelColors[i.level as keyof typeof levelColors] || 'text-gray-600'}`}
                        >
                          {i.level}
                        </span>
                      )}
                      <span className='text-slate-500'>·</span>
                      <span className='text-slate-600'>{i.project ?? 'Unknown Project'}</span>
                      <span className='text-slate-500'>·</span>
                      <span className='text-slate-600'>{i.environment ?? 'Unknown Env'}</span>
                    </div>
                  </div>
                  <div className='flex shrink-0 flex-col items-end gap-2 text-right'>
                    <div className='rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700'>
                      최근 {i.windowCount}회
                    </div>
                    <div className='text-xs text-slate-500'>누적 {i.totalCount}회</div>
                  </div>
                </div>
              </Link>
            ),
          )}
        </div>

        {issues.length === 0 && (
          <div className='rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200/50'>
            <div className='text-6xl'>🎉</div>
            <h3 className='mt-4 text-lg font-semibold text-slate-900'>No issues found</h3>
            <p className='mt-2 text-sm text-slate-600'>모든 이슈가 해결되었습니다!</p>
          </div>
        )}
      </div>
    </main>
  );
}
