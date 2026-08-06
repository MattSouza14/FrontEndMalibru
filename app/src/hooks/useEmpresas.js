import { useEffect, useState } from 'react';
import { listEmpresas } from '../services/empresaService';

export default function useEmpresas() {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await listEmpresas();
        if (!cancelled) {
          setEmpresas(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setEmpresas([]);
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { empresas, loading, error };
}
