import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TablePagination from '../components/TablePagination';
import { listUsers } from '../services/adminService';
import {
  deleteSignedTerm,
  fetchSignedTermFileBlob,
  listSignedTerms,
  updateSignedTerm,
  uploadSignedTerm,
} from '../services/signedTermService';
import { getApiErrorMessage, isUnauthorized } from '../utils/apiErrors';
import { formatDate } from '../utils/expiry';
import { clampPageAfterChange, paginateItems } from '../utils/pagination';

const PAGE_SIZE = 5;

const EMPTY_UPLOAD_FORM = {
  titulo: '',
  usuarioId: '',
  dataAssinatura: '',
};

const EMPTY_EDIT_FORM = {
  titulo: '',
  usuarioId: '',
  dataAssinatura: '',
};

const ACCEPTED_FILE_TYPES =
  '.jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

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

function handleAuthFailure(logout, navigate) {
  logout();
  navigate('/Login', { replace: true });
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageMime(mime) {
  return String(mime ?? '').startsWith('image/');
}

function isPdfMime(mime) {
  return mime === 'application/pdf';
}

function isWordMime(mime) {
  const value = String(mime ?? '').toLowerCase();
  return (
    value === 'application/msword' ||
    value === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
}

function getPreviewLabel(mime) {
  if (isPdfMime(mime)) return 'PDF';
  if (isWordMime(mime)) return 'DOC';
  return 'Ver';
}

function TermPreviewCell({ termo, token, onOpenPreview }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl = null;

    async function loadPreview() {
      if (!token || !termo?.previewUrl || !isImageMime(termo.tipoMime)) {
        return;
      }

      setLoading(true);
      try {
        const blob = await fetchSignedTermFileBlob(token, termo.previewUrl);
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      } catch {
        if (active) setPreviewUrl(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPreview();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [termo?.id, termo?.previewUrl, termo?.tipoMime, token]);

  if (loading) {
    return (
      <div className="size-14 bg-gray-100 border border-gray-200 flex items-center justify-center">
        <Loader2 />
      </div>
    );
  }

  if (previewUrl) {
    return (
      <button type="button" onClick={() => onOpenPreview(termo)} className="block">
        <img
          src={previewUrl}
          alt={termo.titulo}
          className="size-14 object-cover border border-gray-200 hover:border-green-700"
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpenPreview(termo)}
      className="size-14 bg-gray-50 border border-gray-200 flex flex-col items-center justify-center text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:border-green-700 hover:text-green-700"
    >
      {getPreviewLabel(termo.tipoMime)}
    </button>
  );
}

export default function SignedTermsPage() {
  const navigate = useNavigate();
  const { getToken, logout } = useAuth();
  const [termos, setTermos] = useState([]);
  const [users, setUsers] = useState([]);
  const [filterUsuarioId, setFilterUsuarioId] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadForm, setUploadForm] = useState(EMPTY_UPLOAD_FORM);
  const [uploadFile, setUploadFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [tablePage, setTablePage] = useState(1);
  const [previewTermo, setPreviewTermo] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const usersById = useMemo(
    () => Object.fromEntries(users.map((user) => [user.id, user])),
    [users],
  );

  const tablePagination = useMemo(
    () => paginateItems(termos, tablePage, PAGE_SIZE),
    [termos, tablePage],
  );

  useEffect(() => {
    setTablePage((current) => clampPageAfterChange(termos.length, current, PAGE_SIZE));
  }, [termos.length]);

  useEffect(() => {
    return () => {
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    };
  }, [previewBlobUrl]);

  async function loadUsers(token) {
    try {
      const usersData = await listUsers(token);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      if (err.code !== 'ACESSO_NEGADO') throw err;
      setUsers([]);
    }
  }

  async function loadTermos(token, usuarioId = filterUsuarioId) {
    const data = await listSignedTerms(token, usuarioId || undefined);
    setTermos(Array.isArray(data) ? data : []);
  }

  async function loadData() {
    const token = getToken();
    if (!token) return;

    setPageLoading(true);
    setError(null);

    try {
      await Promise.all([loadTermos(token), loadUsers(token)]);
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      if (err.code === 'ACESSO_NEGADO') {
        navigate('/HomePage', { replace: true });
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível carregar os termos assinados.'));
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleFilterChange(usuarioId) {
    setFilterUsuarioId(usuarioId);
    setTablePage(1);

    const token = getToken();
    if (!token) return;

    setError(null);
    try {
      await loadTermos(token, usuarioId);
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível filtrar os termos.'));
    }
  }

  function openUploadForm() {
    setUploadForm(EMPTY_UPLOAD_FORM);
    setUploadFile(null);
    setShowUploadForm(true);
    setEditingId(null);
    setError(null);
    setSuccess(null);
  }

  function closeUploadForm() {
    setShowUploadForm(false);
    setUploadForm(EMPTY_UPLOAD_FORM);
    setUploadFile(null);
  }

  function openEditForm(termo) {
    setEditingId(termo.id);
    setEditForm({
      titulo: termo.titulo ?? '',
      usuarioId: termo.usuarioId != null ? String(termo.usuarioId) : '',
      dataAssinatura: termo.dataAssinatura ?? '',
    });
    setShowUploadForm(false);
    setError(null);
    setSuccess(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(EMPTY_EDIT_FORM);
  }

  async function handleUploadSubmit(event) {
    event.preventDefault();
    const token = getToken();
    if (!token) return;

    const titulo = uploadForm.titulo.trim();
    if (!titulo) {
      setError('Informe o título do termo.');
      return;
    }

    if (!uploadFile) {
      setError('Selecione um arquivo (JPEG, PNG, WebP, PDF, DOC ou DOCX).');
      return;
    }

    if (uploadFile.size > MAX_FILE_SIZE_BYTES) {
      setError('O arquivo excede o limite de 50 MB.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const created = await uploadSignedTerm(token, {
        file: uploadFile,
        titulo,
        usuarioId: uploadForm.usuarioId || undefined,
        dataAssinatura: uploadForm.dataAssinatura || undefined,
      });
      setTermos((prev) => [created, ...prev]);
      closeUploadForm();
      setSuccess('Termo assinado enviado com sucesso!');
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível enviar o termo.'));
    } finally {
      setUploading(false);
    }
  }

  async function handleEditSubmit(event) {
    event.preventDefault();
    const token = getToken();
    if (!token || !editingId) return;

    const titulo = editForm.titulo.trim();
    if (!titulo) {
      setError('Informe o título do termo.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        titulo,
        usuarioId: editForm.usuarioId ? Number(editForm.usuarioId) : null,
        dataAssinatura: editForm.dataAssinatura || null,
      };
      const updated = await updateSignedTerm(token, editingId, payload);
      setTermos((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      cancelEdit();
      setSuccess('Termo atualizado com sucesso!');
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível atualizar o termo.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(termo) {
    const token = getToken();
    if (!token) return;

    if (!window.confirm(`Excluir o termo "${termo.titulo}"?`)) return;

    setDeletingId(termo.id);
    setError(null);
    setSuccess(null);

    try {
      await deleteSignedTerm(token, termo.id);
      setTermos((prev) => prev.filter((item) => item.id !== termo.id));
      if (editingId === termo.id) cancelEdit();
      setSuccess('Termo excluído com sucesso!');
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível excluir o termo.'));
    } finally {
      setDeletingId(null);
    }
  }

  async function openPreview(termo) {
    const token = getToken();
    if (!token || !termo?.previewUrl) return;

    setPreviewTermo(termo);
    setPreviewLoading(true);
    setPreviewBlobUrl(null);

    try {
      const blob = await fetchSignedTermFileBlob(token, termo.previewUrl);
      const url = URL.createObjectURL(blob);
      setPreviewBlobUrl(url);
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure(logout, navigate);
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível carregar o preview.'));
      setPreviewTermo(null);
    } finally {
      setPreviewLoading(false);
    }
  }

  function closePreview() {
    setPreviewTermo(null);
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
  }

  if (pageLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <p className="text-sm text-gray-500">Carregando termos assinados...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-gray-500 mb-2">
            Administração
          </p>
          <h1 className="font-serif italic text-4xl text-green-700">Termos Assinados</h1>
          <p className="text-sm text-gray-600 mt-2">
            Envie e gerencie termos assinados (JPEG, PNG, WebP, PDF, DOC ou DOCX, máx. 50 MB).
          </p>
        </div>
        <button
          type="button"
          onClick={openUploadForm}
          className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors self-start sm:self-auto"
        >
          Novo termo
        </button>
      </header>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm">
          {success}
        </div>
      )}

      {showUploadForm && (
        <form
          onSubmit={handleUploadSubmit}
          className="bg-white border border-gray-200 p-6 space-y-4"
        >
          <h2 className="font-serif text-xl text-green-700">Enviar termo assinado</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Título
              </span>
              <input
                type="text"
                required
                value={uploadForm.titulo}
                onChange={(e) => setUploadForm((prev) => ({ ...prev, titulo: e.target.value }))}
                className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-green-700 focus:outline-none text-sm"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Data de assinatura
              </span>
              <input
                type="date"
                value={uploadForm.dataAssinatura}
                onChange={(e) =>
                  setUploadForm((prev) => ({ ...prev, dataAssinatura: e.target.value }))
                }
                className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-green-700 focus:outline-none text-sm"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Usuário (opcional)
              </span>
              <select
                value={uploadForm.usuarioId}
                onChange={(e) =>
                  setUploadForm((prev) => ({ ...prev, usuarioId: e.target.value }))
                }
                className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-green-700 focus:outline-none text-sm"
              >
                <option value="">Nenhum</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.nome} ({user.email})
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Arquivo
              </span>
              <input
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-widest file:bg-green-700 file:text-white hover:file:bg-green-800"
              />
            </label>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={closeUploadForm}
              className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-600 hover:text-gray-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 disabled:opacity-50"
            >
              {uploading && <Loader2 />}
              Enviar
            </button>
          </div>
        </form>
      )}

      {editingId && (
        <form
          onSubmit={handleEditSubmit}
          className="bg-white border border-gray-200 p-6 space-y-4"
        >
          <h2 className="font-serif text-xl text-green-700">Editar termo</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Título
              </span>
              <input
                type="text"
                required
                value={editForm.titulo}
                onChange={(e) => setEditForm((prev) => ({ ...prev, titulo: e.target.value }))}
                className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-green-700 focus:outline-none text-sm"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Data de assinatura
              </span>
              <input
                type="date"
                value={editForm.dataAssinatura}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, dataAssinatura: e.target.value }))
                }
                className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-green-700 focus:outline-none text-sm"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Usuário
              </span>
              <select
                value={editForm.usuarioId}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, usuarioId: e.target.value }))
                }
                className="w-full px-4 py-3 bg-white border border-gray-300 focus:border-green-700 focus:outline-none text-sm"
              >
                <option value="">Nenhum</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.nome} ({user.email})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={cancelEdit}
              className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-600 hover:text-gray-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 disabled:opacity-50"
            >
              {saving && <Loader2 />}
              Salvar
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-gray-600">{termos.length} termo(s) encontrado(s)</p>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
              Filtrar por usuário
            </span>
            <select
              value={filterUsuarioId}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 focus:border-green-700 focus:outline-none text-xs min-w-[200px]"
            >
              <option value="">Todos</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.nome}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-[10px] uppercase tracking-widest text-gray-500">
                <th className="px-6 py-3 font-bold">Preview</th>
                <th className="px-6 py-3 font-bold">Título</th>
                <th className="px-6 py-3 font-bold">Usuário</th>
                <th className="px-6 py-3 font-bold">Assinatura</th>
                <th className="px-6 py-3 font-bold">Arquivo</th>
                <th className="px-6 py-3 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {termos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    Nenhum termo assinado encontrado.
                  </td>
                </tr>
              ) : (
                tablePagination.items.map((termo) => {
                  const linkedUser = termo.usuarioId ? usersById[termo.usuarioId] : null;

                  return (
                    <tr key={termo.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <TermPreviewCell
                          termo={termo}
                          token={getToken()}
                          onOpenPreview={openPreview}
                        />
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{termo.titulo}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {linkedUser ? linkedUser.nome : '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {termo.dataAssinatura ? formatDate(termo.dataAssinatura) : '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <p className="truncate max-w-[180px]" title={termo.nomeArquivo}>
                          {termo.nomeArquivo}
                        </p>
                        <p className="text-xs text-gray-400">{formatBytes(termo.tamanhoBytes)}</p>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openPreview(termo)}
                          className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-gray-100 hover:bg-gray-200 text-gray-700"
                        >
                          Abrir
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditForm(termo)}
                          className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-gray-100 hover:bg-gray-200 text-gray-700"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === termo.id}
                          onClick={() => handleDelete(termo)}
                          className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 inline-flex items-center gap-2"
                        >
                          {deletingId === termo.id && <Loader2 />}
                          Excluir
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={tablePagination.page}
          totalPages={tablePagination.totalPages}
          total={tablePagination.total}
          pageSize={PAGE_SIZE}
          onPrev={() => setTablePage((p) => Math.max(1, p - 1))}
          onNext={() => setTablePage((p) => Math.min(tablePagination.totalPages, p + 1))}
        />
      </div>

      {previewTermo && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-lg text-green-700">{previewTermo.titulo}</h3>
                <p className="text-xs text-gray-500">{previewTermo.nomeArquivo}</p>
              </div>
              <button
                type="button"
                onClick={closePreview}
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-600 hover:text-gray-900"
              >
                Fechar
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-gray-50 min-h-[320px]">
              {previewLoading ? (
                <Loader2 />
              ) : previewBlobUrl && isImageMime(previewTermo.tipoMime) ? (
                <img
                  src={previewBlobUrl}
                  alt={previewTermo.titulo}
                  className="max-w-full max-h-[70vh] object-contain border border-gray-200"
                />
              ) : previewBlobUrl && isPdfMime(previewTermo.tipoMime) ? (
                <iframe
                  src={previewBlobUrl}
                  title={previewTermo.titulo}
                  className="w-full h-[70vh] border border-gray-200 bg-white"
                />
              ) : previewBlobUrl && isWordMime(previewTermo.tipoMime) ? (
                <div className="text-center space-y-4 max-w-md">
                  <p className="text-sm text-gray-600">
                    Arquivos Word não têm preview no navegador. Faça o download para abrir.
                  </p>
                  <a
                    href={previewBlobUrl}
                    download={previewTermo.nomeArquivo || 'termo.docx'}
                    className="inline-block bg-green-700 hover:bg-green-800 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest"
                  >
                    Baixar arquivo
                  </a>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Preview indisponível.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
