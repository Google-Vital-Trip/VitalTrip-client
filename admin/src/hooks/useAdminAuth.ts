import { useEffect, useState } from 'react';
import { checkIfAdmin } from '../api/checkIfAdmin';

export const useAdminAuth = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const response = await checkIfAdmin();
        const adminStatus = response.data.isAdmin;
        setIsAdmin(adminStatus);
      } catch {
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAuth();
  }, []);

  return { isAdmin, isLoading };
};
