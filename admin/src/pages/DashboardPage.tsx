import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { getUserList } from '../api/userApi';
import type { UserListResponse } from '../types/user';

export default function DashboardPage() {
  const [users, setUsers] = useState<UserListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await getUserList({ page: 0, size: 10 });
        setUsers(response);
      } catch (err: unknown) {
        console.error('사용자 목록 에러: ', err);

        // 권한 오류 시 로그인 페이지로 리다이렉트
        if (err && typeof err === 'object' && 'status' in err && (err.status === 401 || err.status === 403)) {
          navigate('/login', { replace: true });
          return;
        }

        setError('사용자 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [navigate]);

  return (
    <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
      <div className='px-4 py-6 sm:px-0'>
        <div className='border-4 border-dashed border-gray-200 rounded-lg p-8'>
          <h1 className='text-2xl font-bold text-gray-900 mb-6'>관리자 대시보드</h1>

          <div className='bg-white shadow rounded-lg p-6'>
            <h2 className='text-lg font-medium text-gray-900 mb-4'>사용자 목록</h2>

            {loading && <p className='text-gray-500'>로딩 중...</p>}

            {error && <p className='text-red-600'>{error}</p>}

            {users && (
              <div>
                <p className='text-sm text-gray-600 mb-4'>
                  총 {users.data.totalElements}명의 사용자 (페이지 {users.data.page + 1}/{users.data.totalPages})
                </p>
                <div className='space-y-2'>
                  {users.data.content.map((user) => (
                    <div key={user.id} className='border border-gray-200 rounded p-3'>
                      <p className='font-medium'>{user.name}</p>
                      <p className='text-sm text-gray-600'>{user.email}</p>
                      <p className='text-xs text-gray-500'>역할: {user.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
