import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { activateAccount } from '../services/authService';
import { getApiErrorMessage } from '../utils/apiErrors';
import AlertBanner from '../components/ui/AlertBanner';

export default function ActivateAccountPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    async function runActivation() {
      if (!token) {
        setError('Link de ativação inválido. Verifique o e-mail recebido.');
        setLoading(false);
        return;
      }

      try {
        await activateAccount(token);
        setSuccessMessage('Conta ativada com sucesso! Redirecionando para o login...');
        setTimeout(() => navigate('/Login', { replace: true }), 3000);
      } catch (err) {
        if (err.code === 'CONTA_JA_ATIVADA') {
          setSuccessMessage('Sua conta já estava ativa. Redirecionando para o login...');
          setTimeout(() => navigate('/Login', { replace: true }), 2500);
          return;
        }
        setError(getApiErrorMessage(err, 'Não foi possível ativar a conta.'));
      } finally {
        setLoading(false);
      }
    }

    runActivation();
  }, [token, navigate]);

  const isExpired = error?.includes('expirado');

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-muted p-6">
      <div className="w-full max-w-[440px] bg-white rounded-2xl border border-gray-100 shadow-card p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="size-12 bg-primary rounded-xl flex items-center justify-center font-bold text-white text-xl mx-auto mb-4">
            M
          </div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-2">
            Ativação de conta
          </p>
          <h1 className="text-2xl font-bold text-slate-900">Malibru Portal</h1>
        </div>

        {loading && (
          <p className="text-sm text-gray-600 text-center">Ativando sua conta...</p>
        )}

        {!loading && error && (
          <div className="space-y-4">
            <AlertBanner type="error">{error}</AlertBanner>
            {isExpired && (
              <p className="text-sm text-gray-600">
                Entre em contato com um administrador para solicitar uma nova ativação.
              </p>
            )}
            <Link
              to="/Login"
              className="block text-center text-sm text-primary hover:underline font-medium"
            >
              Ir para o login
            </Link>
          </div>
        )}

        {!loading && successMessage && (
          <div className="space-y-4">
            <AlertBanner type="success">{successMessage}</AlertBanner>
            <Link
              to="/Login"
              className="block text-center text-sm text-primary hover:underline font-medium"
            >
              Acessar agora
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
