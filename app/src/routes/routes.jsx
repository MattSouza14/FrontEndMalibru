import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from '../pages/RegisterPage';
import Login from '../pages/LoginPage';
import HomePage from '../pages/HomePage';
// import NotFound from './pages/NotFoundPage';
import Layout from '../pages/Layout';
// import PrivateRoute from './components/PrivateRoute';

function AppRoutes() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/" element={<HomePage />} />
          {/* <Route path="/sobre" element={<Sobre />} /> */}
          <Route path="/Register" element={<Register />} />
          <Route path="/Login" element={<Login />} />

          {/* Rota privada (requer autenticação) */}
          {/* <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route> */}

          {/* Redirecionamento para rotas inexistentes */}
          {/* <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} /> */}
        </Routes>
      </Layout>
    </Router>
  );
}

export default AppRoutes;

// Exemplo de componente PrivateRoute para proteger rotas
// import { Navigate, Outlet } from 'react-router-dom';
// function PrivateRoute() {
//   const isAuthenticated = localStorage.getItem('token') ? true : false;
//   return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
// }
