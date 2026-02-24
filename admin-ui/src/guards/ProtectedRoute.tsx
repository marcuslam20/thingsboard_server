import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/store/store';
import { selectIsAuthenticated, selectAuthority } from '@/store/auth.slice';
import { Authority } from '@/models/authority.model';

interface ProtectedRouteProps {
  allowedAuthorities?: Authority[];
}

export default function ProtectedRoute({ allowedAuthorities }: ProtectedRouteProps) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const authority = useAppSelector(selectAuthority);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedAuthorities && authority && !allowedAuthorities.includes(authority)) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
