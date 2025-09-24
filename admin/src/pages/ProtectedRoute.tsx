import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { useAdminAuth } from '../hooks/useAdminAuth';

export const ProtectedRoute = () => {
  const { isAdmin, isLoading } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      alert('Admin 로그인을 해주세요.');
      navigate('/login');
    }
  }, [isAdmin, isLoading, navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return <Outlet />;
};
