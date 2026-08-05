import { useEffect, useMemo, useState } from 'react';
import AlertBanner from './ui/AlertBanner';
import {
  listAdminChamadoMessages,
  listMyChamadoMessages,
  postAdminChamadoMessage,
  postMyChamadoMessage,
} from '../services/chamadoService';
import { getApiErrorMessage } from '../utils/apiErrors';
import { formatDateTime, isChamadoEncerrado } from '../utils/chamadoStatus';

function Loader2() {
  return (
    <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function MessageBubble({ author, message, createdAt, isAttendant }) {
  return (
    <div className={`flex ${isAttendant ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-xl px-3.5 py-2.5 ${
          isAttendant
            ? 'bg-primary text-white rounded-br-sm'
            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
        }`}
      >
        <p className={`text-[11px] font-medium mb-1 ${isAttendant ? 'text-primary-light/90' : 'text-gray-500'}`}>
          {author}
        </p>
        <p className="text-sm whitespace-pre-wrap break-words">{message}</p>
        <p className={`text-[10px] mt-1.5 tabular-nums ${isAttendant ? 'text-primary-light/80' : 'text-gray-400'}`}>
          {formatDateTime(createdAt)}
        </p>
      </div>
    </div>
  );
}

export default function ChamadoMessagesPanel({
  chamado,
  mode = 'user',
  getToken,
  onMessageSent,
}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState(null);

  const encerrado = isChamadoEncerrado(chamado.status);

  const timeline = useMemo(() => {
    const initial = {
      id: `initial-${chamado.id}`,
      autorNome: chamado.solicitanteNome || 'Solicitante',
      tipoAutor: 'SOLICITANTE',
      mensagem: chamado.descricao,
      createdAt: chamado.createdAt,
    };
    const list = Array.isArray(messages) ? messages : [];
    return [initial, ...list].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    );
  }, [chamado, messages]);

  useEffect(() => {
    let cancelled = false;

    async function loadMessages() {
      const token = getToken();
      if (!token) return;

      setLoading(true);
      setError(null);

      try {
        const data =
          mode === 'admin'
            ? await listAdminChamadoMessages(token, chamado.id)
            : await listMyChamadoMessages(token, chamado.id);

        if (!cancelled) {
          setMessages(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Não foi possível carregar as mensagens.'));
          setMessages([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [chamado.id, getToken, mode]);

  async function handleSubmit(event) {
    event.preventDefault();

    const text = draft.trim();
    if (!text || sending || encerrado) return;

    const token = getToken();
    if (!token) return;

    setSending(true);
    setError(null);

    try {
      const created =
        mode === 'admin'
          ? await postAdminChamadoMessage(token, chamado.id, text)
          : await postMyChamadoMessage(token, chamado.id, text);

      setMessages((prev) => [...prev, created]);
      setDraft('');
      onMessageSent?.(created);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível enviar a mensagem.'));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="form-label mb-3">Conversa</p>
        {loading ? (
          <p className="text-sm text-gray-500 inline-flex items-center gap-2">
            <Loader2 />
            Carregando mensagens...
          </p>
        ) : (
          <div className="rounded-lg bg-gray-50 border border-gray-100 p-4 max-h-80 overflow-y-auto space-y-3">
            {timeline.map((item) => (
              <MessageBubble
                key={item.id}
                author={item.autorNome}
                message={item.mensagem}
                createdAt={item.createdAt}
                isAttendant={item.tipoAutor === 'ATENDENTE'}
              />
            ))}
          </div>
        )}
      </div>

      {error && <AlertBanner type="error">{error}</AlertBanner>}

      {encerrado ? (
        <p className="text-sm text-gray-500">
          Este chamado está {chamado.status === 'FECHADO' ? 'fechado' : 'cancelado'} e não aceita novas
          mensagens.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block space-y-1.5">
            <span className="form-label">
              {mode === 'admin' ? 'Responder ao solicitante' : 'Enviar resposta'}
            </span>
            <textarea
              rows={3}
              maxLength={5000}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="form-input resize-y"
              placeholder="Digite sua mensagem..."
              disabled={sending || loading}
            />
          </label>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending || loading || !draft.trim()}
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
            >
              {sending && <Loader2 />}
              Enviar mensagem
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
