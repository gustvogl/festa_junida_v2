import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminPage } from './pages/AdminPage';
import { FoodPage } from './pages/FoodPage';
import { FortunePage } from './pages/FortunePage';
import { GamesPage } from './pages/GamesPage';
import { HomePage } from './pages/HomePage';
import { JailPage } from './pages/JailPage';
import { LoginPage } from './pages/LoginPage';
import { MailPage } from './pages/MailPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProfilePage } from './pages/ProfilePage';
import { RegisterPage } from './pages/RegisterPage';
import { ShowsPage } from './pages/ShowsPage';

export function App() {
  return (
    <Routes>
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/comidas" element={<FoodPage />} />
        <Route path="/correio" element={<MailPage />} />
        <Route path="/jogos" element={<GamesPage />} />
        <Route path="/shows" element={<ShowsPage />} />
        <Route path="/prisao" element={<JailPage />} />
        <Route path="/vidente" element={<FortunePage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>

      <Route path="/inicio" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
