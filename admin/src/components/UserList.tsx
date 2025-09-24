import { useEffect, useState } from 'react';
import { getUserList } from '../api/userApi';
import type { User, UserListResponse } from '../types/user';

export const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const fetchUsers = async (page: number = 0, size: number = 20) => {
    setLoading(true);
    setError(null);

    try {
      const response: UserListResponse = await getUserList({ page, size });
      setUsers(response.data.content);
      setCurrentPage(response.data.page);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (err) {
      setError(err instanceof Error ? err.message : '사용자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(0); // 페이지 크기 변경 시 첫 페이지로 리셋
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const getProviderBadge = (provider: string) => {
    return provider === 'GOOGLE' ? (
      <span className='px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full'>Google</span>
    ) : (
      <span className='px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full'>Local</span>
    );
  };

  const getRoleBadge = (role: string) => {
    return role === 'ADMIN' ? (
      <span className='px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-semibold'>Admin</span>
    ) : (
      <span className='px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full'>User</span>
    );
  };

  if (loading && users.length === 0) {
    return (
      <div className='flex justify-center items-center py-8'>
        <div className='text-lg'>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className='p-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-900 mb-2'>사용자 관리</h1>
        <p className='text-gray-600'>전체 사용자: {totalElements}명</p>
      </div>

      {error && <div className='mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded'>{error}</div>}

      {/* 페이지 크기 선택 */}
      <div className='mb-4 flex items-center gap-4'>
        <label className='text-sm font-medium text-gray-700'>페이지 크기:</label>
        <select
          value={pageSize}
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          className='border border-gray-300 rounded px-3 py-1 text-sm'
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      {/* 사용자 테이블 */}
      <div className='bg-white shadow-md rounded-lg overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>ID</th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  이메일
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>이름</th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  생년월일
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>국가</th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  전화번호
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  제공자
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>역할</th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  가입일
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {users.map((user) => (
                <tr key={user.id} className='hover:bg-gray-50'>
                  <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>{user.id}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>{user.email}</td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center'>
                      {user.profileImageUrl && (
                        <img className='h-8 w-8 rounded-full mr-3' src={user.profileImageUrl} alt={user.name} />
                      )}
                      <div className='text-sm font-medium text-gray-900'>{user.name}</div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>{user.birthDate}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>{user.countryCode}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>{user.phoneNumber}</td>
                  <td className='px-6 py-4 whitespace-nowrap'>{getProviderBadge(user.provider)}</td>
                  <td className='px-6 py-4 whitespace-nowrap'>{getRoleBadge(user.role)}</td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && !loading && (
          <div className='text-center py-8 text-gray-500'>등록된 사용자가 없습니다.</div>
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className='mt-6 flex items-center justify-between'>
          <div className='text-sm text-gray-700'>
            페이지 {currentPage + 1} / {totalPages} (총 {totalElements}명)
          </div>

          <div className='flex items-center gap-2'>
            <button
              onClick={() => handlePageChange(0)}
              disabled={currentPage === 0}
              className='px-3 py-1 bg-white border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
            >
              처음
            </button>

            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className='px-3 py-1 bg-white border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
            >
              이전
            </button>

            {/* 페이지 번호 표시 */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const startPage = Math.max(0, Math.min(currentPage - 2, totalPages - 5));
              const pageNum = startPage + i;

              if (pageNum >= totalPages) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1 border rounded text-sm ${
                    pageNum === currentPage
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum + 1}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className='px-3 py-1 bg-white border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
            >
              다음
            </button>

            <button
              onClick={() => handlePageChange(totalPages - 1)}
              disabled={currentPage >= totalPages - 1}
              className='px-3 py-1 bg-white border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
            >
              마지막
            </button>
          </div>
        </div>
      )}

      {loading && users.length > 0 && (
        <div className='mt-4 text-center'>
          <div className='text-sm text-gray-600'>업데이트 중...</div>
        </div>
      )}
    </div>
  );
};
