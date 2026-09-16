import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../../features/auth/context/AuthContext.jsx';
import PrivateRoute from '../../features/auth/components/PrivateRoute.jsx';
import RoleRoute from '../../features/auth/components/RoleRoute.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
const Register = lazy(() => import('../../features/auth/pages/RegisterPage.jsx'));
const Login = lazy(() => import('../../features/auth/pages/LoginPage.jsx'));
const HomePage = lazy(() => import('../../features/home/pages/HomePage.jsx'));
const InitialPage = lazy(() => import('../../features/home/pages/InitialPage.jsx'));
const ProfilePage = lazy(() => import('../../features/users/pages/ProfilePage.jsx'));
const AdminPage = lazy(() => import('../../features/users/pages/AdminPage.jsx'));
const OfficeLicensesPage = lazy(() => import('../../features/licenses/pages/OfficeLicensesPage.jsx'));
const CertificatesPage = lazy(() => import('../../features/licenses/pages/CertificatesPage.jsx'));
const ChamadosPage = lazy(() => import('../../features/support/pages/ChamadosPage.jsx'));
const AdminChamadosPage = lazy(() => import('../../features/support/pages/AdminChamadosPage.jsx'));
const ActivateAccountPage = lazy(() => import('../../features/auth/pages/ActivateAccountPage.jsx'));
const EquipmentsPage = lazy(() => import('../../features/inventory/pages/EquipmentsPage.jsx'));
const SoftwareLicensesPage = lazy(() => import('../../features/licenses/pages/SoftwareLicensesPage.jsx'));
const SignedTermsPage = lazy(() => import('../../features/inventory/pages/SignedTermsPage.jsx'));
const ReportsPage = lazy(() => import('../../features/reports/pages/ReportsPage.jsx'));
const FolhaFortesPage = lazy(() => import('../../features/hr/pages/FolhaFortesPage.jsx'));
const PrintersPage = lazy(() => import('../../features/inventory/pages/PrintersPage.jsx'));
import Layout from '../layouts/Layout.jsx';
export default function AppRoutes() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Suspense fallback={<p role="status" className="p-8 text-center text-ws-muted">Carregando página...</p>}>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/" element={<InitialPage />} />
            <Route path="/Register" element={<Register />} />
            <Route path="/Login" element={<Login />} />
            <Route path="/ativar-conta" element={<ActivateAccountPage />} />
            {/* Rotas privadas — exige login */}
            <Route element={<PrivateRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/HomePage" element={<HomePage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/chamados" element={<ChamadosPage />} />
                <Route path="/relatorios" element={<ReportsPage />} />
                <Route element={<RoleRoute roles={['ADMIN', 'SUPORTE', 'TI']} />}>
                  <Route path="/admin/chamados" element={<AdminChamadosPage />} />
                </Route>
                <Route element={<RoleRoute roles={['ADMIN', 'TI']} />}>
                  <Route path="/admin/office-licenses" element={<OfficeLicensesPage />} />
                  <Route path="/admin/software-licenses" element={<SoftwareLicensesPage />} />
                  <Route path="/admin/certificates" element={<CertificatesPage />} />
                  <Route path="/admin/equipamentos" element={<EquipmentsPage />} />
                  <Route path="/admin/termos-assinados" element={<SignedTermsPage />} />
                  <Route path="/admin/impressoras" element={<PrintersPage />} />
                </Route>
                <Route element={<RoleRoute roles={['ADMIN']} />}>
                  <Route path="/admin" element={<AdminPage />} />
                </Route>
                <Route element={<RoleRoute roles={['ADMIN', 'RH']} />}>
                  <Route path="/rh/folha" element={<FolhaFortesPage />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </Layout>
      </Router>
    </AuthProvider>
  );
}
