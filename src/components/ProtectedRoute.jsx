import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { loading, user } = useAuth();

  if (loading) {
    return <div className="screen-center">Carregando o arraial...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
