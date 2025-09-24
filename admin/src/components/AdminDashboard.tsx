import { UserList } from './UserList';
import { httpClient } from '../utils/httpClient';

export function AdminDashboard() {
  const handleLogout = async () => {
    try {
      await httpClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">VitalTrip Admin</h1>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                관리자 대시보드
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <UserList />
      </main>
    </div>
  );
}