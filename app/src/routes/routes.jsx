import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import PrivateRoute from '../components/PrivateRoute';

import RoleRoute from '../components/RoleRoute';

import DashboardLayout from '../components/DashboardLayout';

import Register from '../pages/RegisterPage';

import Login from '../pages/LoginPage';

import HomePage from '../pages/HomePage';

import InitialPage from '../pages/InitialPage';

import ProfilePage from '../pages/ProfilePage';

import AdminPage from '../pages/AdminPage';

import OfficeLicensesPage from '../pages/OfficeLicensesPage';

import CertificatesPage from '../pages/CertificatesPage';

import ChamadosPage from '../pages/ChamadosPage';

import AdminChamadosPage from '../pages/AdminChamadosPage';

import ActivateAccountPage from '../pages/ActivateAccountPage';

import EquipmentsPage from '../pages/EquipmentsPage';

import SoftwareLicensesPage from '../pages/SoftwareLicensesPage';

import SignedTermsPage from '../pages/SignedTermsPage';

import ReportsPage from '../pages/ReportsPage';

import FolhaFortesPage from '../pages/FolhaFortesPage';

import Layout from '../pages/Layout';



export default function AppRoutes() {

  return (
    <AuthProvider>
      <Router>

        <Layout>

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

        </Layout>

      </Router>
    </AuthProvider>
  );
}



