import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { activateAccount } from '../services/authService';
import { getApiErrorMessage } from '../utils/apiErrors';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-[440px] bg-white border border-gray-200 shadow-sm p-10 md:p-14">
        <div className="text-center mb-8">
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-gray-500 mb-3">
            Ativação de conta
          </p>
          <h1 className="font-serif italic text-4xl text-green-700">Malibru Portal</h1>
        </div>

        {loading && (
          <p className="text-sm text-gray-600 text-center">Ativando sua conta...</p>
        )}

        {!loading && error && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
            {isExpired && (
              <p className="text-sm text-gray-600">
                Entre em contato com um administrador para solicitar uma nova ativação.
              </p>
            )}
            <Link
              to="/Login"
              className="block text-center text-sm text-green-700 hover:underline font-medium"
            >
              Ir para o login
            </Link>
          </div>
        )}

        {!loading && successMessage && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm">
              {successMessage}
            </div>
            <Link
              to="/Login"
              className="block text-center text-sm text-green-700 hover:underline font-medium"
            >
              Acessar agora
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
