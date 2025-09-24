import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router';
import DashboardPage from './pages/DashboardPage';
import Layout from './pages/Layout';
import LoginPage from './pages/LoginPage';
import { ProtectedRoute } from './pages/ProtectedRoute';

const ROUTES = {
  ROOT: '/',
  LOGIN: '/login',
};

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path={ROUTES.ROOT} element={<DashboardPage />} />
        </Route>
      </Route>
    </>
  )
);
