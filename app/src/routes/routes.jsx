import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import PrivateRoute from '../components/PrivateRoute';
import AdminRoute from '../components/AdminRoute';
import DashboardLayout from '../components/DashboardLayout';
import Register from '../pages/RegisterPage';
import Login from '../pages/LoginPage';
import HomePage from '../pages/HomePage';
import InitialPage from '../pages/InitialPage';
import ProfilePage from '../pages/ProfilePage';
import AdminPage from '../pages/AdminPage';
import OfficeLicensesPage from '../pages/OfficeLicensesPage';
import EquipmentsPage from '../pages/EquipmentsPage';
import Layout from '../pages/Layout';

function AppRoutes() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/" element={<InitialPage />} />
            <Route path="/Register" element={<Register />} />
            <Route path="/Login" element={<Login />} />

            {/* Rotas privadas — exige login */}
            <Route element={<PrivateRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/HomePage" element={<HomePage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/admin/office-licenses" element={<OfficeLicensesPage />} />
                  <Route path="/admin/equipamentos" element={<EquipmentsPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default AppRoutes;