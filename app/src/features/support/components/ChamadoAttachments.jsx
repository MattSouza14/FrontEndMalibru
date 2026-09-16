import { useEffect, useState } from 'react';
import { apiRequest, authHeaders, authFetch } from '../../../shared/api/client.js';
import { getApiErrorMessage } from '../../../shared/lib/apiErrors.js';
export default function ChamadoAttachments({ chamadoId }) {
  const [items, setItems] = useState([]);
  const [preview, setPreview] = useState(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    apiRequest('/api/chamados/' + chamadoId + '/anexos', { headers: authHeaders() })
      .then(data => { if (active) setItems(data); })
      .catch(e => { if (active) setError(getApiErrorMessage(e, 'Erro ao carregar anexos.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [chamadoId]);
  async function download(item, view = false) {
    try {
      setError('');
      const response = await authFetch('/api/chamados/' + chamadoId + '/anexos/' + item.id, { headers: authHeaders() });
      if (!response.ok) throw new Error('Não foi possível baixar a imagem.');
      const url = URL.createObjectURL(await response.blob());
      if (view) { setPreview({ url, nome: item.nome }); return; }
      const a = document.createElement('a'); a.href = url; a.download = item.nome; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { setError(e.message); }
  }
  return <div className="space-y-2"><p className="form-label">Imagens anexadas</p>
    {loading && <p className="text-xs text-ws-muted">Carregando imagens...</p>}
    {error && <p role="alert" className="text-xs text-ws-red">{error}</p>}
    {!loading && !error && !items.length && <p className="text-xs text-ws-muted">Sem imagens anexadas.</p>}
    {items.map(item => <div key={item.id} className="flex flex-wrap gap-3 text-sm"><button type="button" onClick={() => download(item, true)} className="text-left text-primary underline break-all">{item.nome} · {(item.tamanho / 1024).toFixed(0)} KB</button><button type="button" onClick={() => download(item)} className="text-ws-muted">Baixar ↓</button></div>)}
    {preview && <div className="space-y-2"><button type="button" onClick={() => setPreview(null)} className="text-xs text-ws-muted">Fechar imagem</button><img src={preview.url} alt={preview.nome} className="max-h-96 max-w-full rounded-lg object-contain" /></div>}
  </div>;
}
