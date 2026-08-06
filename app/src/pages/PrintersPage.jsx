import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmpresaSelect from '../components/EmpresaSelect';
import AlertBanner from '../components/ui/AlertBanner';
import PageContainer from '../components/ui/PageContainer';
import PageHeader from '../components/ui/PageHeader';
import { useAuth } from '../context/AuthContext';
import {
  createPrinter,
  deletePrinter,
  getPrinter,
  linkTonerToPrinter,
  listPrinters,
  unlinkTonerFromPrinter,
  updatePrinter,
} from '../services/printerService';
import {
  createToner,
  deleteToner,
  getToner,
  listToners,
  updateToner,
} from '../services/tonerService';
import { getApiErrorMessage, isUnauthorized } from '../utils/apiErrors';
import { formatEmpresaLabel } from '../utils/equipment';
import {
  TONER_COLORS,
  formatTonerColor,
  getPrinterFillClass,
  getPrinterFillLabel,
  getPrinterFillState,
  getTonerColorBadge,
} from '../utils/printer';

const EMPTY_PRINTER_FORM = {
  nome: '',
  empresa: '',
  ip: '',
  qtdToners: '1',
  localizacao: '',
  descricao: '',
};

const EMPTY_TONER_FORM = {
  codigo: '',
  cor: 'preto',
  descricao: '',
};

function Loader2({ className = 'size-4' }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function DetailRow({ label, value, mono = false }) {
  return (
    <div className="grid grid-cols-[minmax(0,7rem)_1fr] gap-x-3 gap-y-0.5 py-1.5 border-b border-ws-border last:border-0">
      <span className="text-[11px] uppercase tracking-wider text-ws-muted">{label}</span>
      <span className={`text-sm text-ws-bright break-words min-w-0 ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
      </span>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-ws-panel rounded border border-ws-border shadow-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ws-border bg-ws-elevated">
          <h3 className="text-base font-semibold text-ws-bright">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-ws-muted hover:text-ws-bright text-xl leading-none"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function matchesFilter(text, filter) {
  if (!filter.trim()) return true;
  return text.toLowerCase().includes(filter.trim().toLowerCase());
}

export default function PrintersPage() {
  const navigate = useNavigate();
  const { getToken, logout } = useAuth();

  const [tab, setTab] = useState('printers');
  const [printers, setPrinters] = useState([]);
  const [toners, setToners] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [displayFilter, setDisplayFilter] = useState('');
  const [empresaFilter, setEmpresaFilter] = useState('');

  const [selectedPrinterId, setSelectedPrinterId] = useState(null);
  const [selectedTonerId, setSelectedTonerId] = useState(null);
  const [printerDetail, setPrinterDetail] = useState(null);
  const [tonerDetail, setTonerDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [showTonerModal, setShowTonerModal] = useState(false);
  const [editingPrinterId, setEditingPrinterId] = useState(null);
  const [editingTonerId, setEditingTonerId] = useState(null);
  const [printerForm, setPrinterForm] = useState(EMPTY_PRINTER_FORM);
  const [tonerForm, setTonerForm] = useState(EMPTY_TONER_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [linkTonerId, setLinkTonerId] = useState('');
  const [linking, setLinking] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState(null);

  function handleAuthFailure() {
    logout();
    navigate('/Login', { replace: true });
  }

  const loadLists = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setPageLoading(true);
    setError(null);

    try {
      const [printersData, tonersData] = await Promise.all([
        listPrinters(token, empresaFilter || undefined),
        listToners(token),
      ]);
      setPrinters(Array.isArray(printersData) ? printersData : []);
      setToners(Array.isArray(tonersData) ? tonersData : []);
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure();
        return;
      }
      if (err.code === 'ACESSO_NEGADO') {
        navigate('/HomePage', { replace: true });
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível carregar impressoras e toners.'));
    } finally {
      setPageLoading(false);
    }
  }, [empresaFilter, getToken, logout, navigate]);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => setSuccess(null), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  const filteredPrinters = useMemo(() => {
    return printers.filter((printer) => {
      const blob = [
        printer.ip,
        printer.nome,
        printer.empresa,
        printer.localizacao,
        printer.descricao,
        formatEmpresaLabel(printer.empresa),
      ]
        .filter(Boolean)
        .join(' ');
      return matchesFilter(blob, displayFilter);
    });
  }, [displayFilter, printers]);

  const filteredToners = useMemo(() => {
    return toners.filter((toner) => {
      const blob = [toner.codigo, toner.cor, toner.descricao, formatTonerColor(toner.cor)]
        .filter(Boolean)
        .join(' ');
      return matchesFilter(blob, displayFilter);
    });
  }, [displayFilter, toners]);

  const linkedTonerIds = useMemo(() => {
    if (!printerDetail?.toners) return new Set();
    return new Set(printerDetail.toners.map((t) => t.id));
  }, [printerDetail]);

  const availableTonersForLink = useMemo(
    () => toners.filter((t) => !linkedTonerIds.has(t.id)),
    [linkedTonerIds, toners],
  );

  async function loadPrinterDetail(id) {
    const token = getToken();
    if (!token || !id) return;

    setDetailLoading(true);
    try {
      const data = await getPrinter(token, id);
      setPrinterDetail(data);
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure();
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível carregar detalhes da impressora.'));
      setPrinterDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function loadTonerDetail(id) {
    const token = getToken();
    if (!token || !id) return;

    setDetailLoading(true);
    try {
      const data = await getToner(token, id);
      setTonerDetail(data);
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure();
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível carregar detalhes do toner.'));
      setTonerDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  function selectPrinter(id) {
    setTab('printers');
    setSelectedPrinterId(id);
    setSelectedTonerId(null);
    setTonerDetail(null);
    loadPrinterDetail(id);
  }

  function selectToner(id) {
    setTab('toners');
    setSelectedTonerId(id);
    setSelectedPrinterId(null);
    setPrinterDetail(null);
    loadTonerDetail(id);
  }

  function openCreatePrinter() {
    setEditingPrinterId(null);
    setPrinterForm(EMPTY_PRINTER_FORM);
    setShowPrinterModal(true);
  }

  function openEditPrinter(printer) {
    setEditingPrinterId(printer.id);
    setPrinterForm({
      nome: printer.nome ?? '',
      empresa: printer.empresa ?? '',
      ip: printer.ip ?? '',
      qtdToners: String(printer.qtdToners ?? 1),
      localizacao: printer.localizacao ?? '',
      descricao: printer.descricao ?? '',
    });
    setShowPrinterModal(true);
  }

  function openCreateToner() {
    setEditingTonerId(null);
    setTonerForm(EMPTY_TONER_FORM);
    setShowTonerModal(true);
  }

  function openEditToner(toner) {
    setEditingTonerId(toner.id);
    setTonerForm({
      codigo: toner.codigo ?? '',
      cor: toner.cor ?? 'preto',
      descricao: toner.descricao ?? '',
    });
    setShowTonerModal(true);
  }

  async function handleSavePrinter(event) {
    event.preventDefault();
    const token = getToken();
    if (!token) return;

    setSaving(true);
    setError(null);

    const payload = {
      nome: printerForm.nome.trim() || null,
      empresa: printerForm.empresa,
      ip: printerForm.ip.trim(),
      qtdToners: Number(printerForm.qtdToners),
      localizacao: printerForm.localizacao.trim() || null,
      descricao: printerForm.descricao.trim() || null,
    };

    try {
      if (editingPrinterId) {
        await updatePrinter(token, editingPrinterId, payload);
        setSuccess('Impressora atualizada.');
        if (selectedPrinterId === editingPrinterId) {
          await loadPrinterDetail(editingPrinterId);
        }
      } else {
        const created = await createPrinter(token, payload);
        setSuccess('Impressora cadastrada.');
        if (created?.id) selectPrinter(created.id);
      }
      setShowPrinterModal(false);
      await loadLists();
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure();
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível salvar a impressora.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveToner(event) {
    event.preventDefault();
    const token = getToken();
    if (!token) return;

    setSaving(true);
    setError(null);

    const payload = {
      codigo: tonerForm.codigo.trim(),
      cor: tonerForm.cor || null,
      descricao: tonerForm.descricao.trim() || null,
    };

    try {
      if (editingTonerId) {
        await updateToner(token, editingTonerId, payload);
        setSuccess('Toner atualizado.');
        if (selectedTonerId === editingTonerId) {
          await loadTonerDetail(editingTonerId);
        }
      } else {
        const created = await createToner(token, payload);
        setSuccess('Toner cadastrado.');
        if (created?.id) selectToner(created.id);
      }
      setShowTonerModal(false);
      await loadLists();
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure();
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível salvar o toner.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePrinter(id) {
    if (!window.confirm('Excluir esta impressora? Os vínculos com toners serão removidos.')) return;

    const token = getToken();
    if (!token) return;

    setDeletingId(id);
    setError(null);

    try {
      await deletePrinter(token, id);
      setSuccess('Impressora excluída.');
      if (selectedPrinterId === id) {
        setSelectedPrinterId(null);
        setPrinterDetail(null);
      }
      await loadLists();
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure();
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível excluir a impressora.'));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteToner(id) {
    if (!window.confirm('Excluir este toner?')) return;

    const token = getToken();
    if (!token) return;

    setDeletingId(id);
    setError(null);

    try {
      await deleteToner(token, id);
      setSuccess('Toner excluído.');
      if (selectedTonerId === id) {
        setSelectedTonerId(null);
        setTonerDetail(null);
      }
      await loadLists();
      if (selectedPrinterId) await loadPrinterDetail(selectedPrinterId);
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure();
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível excluir o toner.'));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleLinkToner() {
    if (!selectedPrinterId || !linkTonerId) return;

    const token = getToken();
    if (!token) return;

    setLinking(true);
    setError(null);

    try {
      await linkTonerToPrinter(token, selectedPrinterId, Number(linkTonerId));
      setSuccess('Toner vinculado.');
      setLinkTonerId('');
      await loadLists();
      await loadPrinterDetail(selectedPrinterId);
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure();
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível vincular o toner.'));
    } finally {
      setLinking(false);
    }
  }

  async function handleUnlinkToner(tonerId) {
    if (!selectedPrinterId) return;

    const token = getToken();
    if (!token) return;

    setUnlinkingId(tonerId);
    setError(null);

    try {
      await unlinkTonerFromPrinter(token, selectedPrinterId, tonerId);
      setSuccess('Toner desvinculado.');
      await loadLists();
      await loadPrinterDetail(selectedPrinterId);
    } catch (err) {
      if (isUnauthorized(err)) {
        handleAuthFailure();
        return;
      }
      setError(getApiErrorMessage(err, 'Não foi possível desvincular o toner.'));
    } finally {
      setUnlinkingId(null);
    }
  }

  const captureStats = useMemo(() => {
    const full = printers.filter((p) => getPrinterFillState(p) === 'full').length;
    return {
      printers: filteredPrinters.length,
      toners: filteredToners.length,
      full,
    };
  }, [filteredPrinters.length, filteredToners.length, printers]);

  return (
    <PageContainer className="!space-y-4 max-w-none xl:max-w-[1600px]">
      <PageHeader
        breadcrumbs={['Malibru Portal', 'TI', 'Impressoras']}
        title="Impressoras e toners"
        subtitle="Inventário de impressoras por IP e empresa, com vínculo de toners"
      />

      {error && <AlertBanner type="error">{error}</AlertBanner>}
      {success && <AlertBanner type="success">{success}</AlertBanner>}

      <div className="rounded border border-ws-border overflow-hidden shadow-card bg-ws-canvas flex flex-col min-h-0">
        {/* Toolbar estilo Wireshark */}
        <div className="bg-ws-elevated border-b border-ws-border shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
            <div className="flex rounded-md overflow-hidden border border-ws-border-strong shrink-0">
              <button
                type="button"
                onClick={() => setTab('printers')}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tab === 'printers'
                    ? 'bg-primary text-white'
                    : 'bg-ws-panel text-ws-secondary hover:bg-ws-hover-strong'
                }`}
              >
                Impressoras ({printers.length})
              </button>
              <button
                type="button"
                onClick={() => setTab('toners')}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tab === 'toners'
                    ? 'bg-primary text-white'
                    : 'bg-ws-panel text-ws-secondary hover:bg-ws-hover-strong'
                }`}
              >
                Toners ({toners.length})
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={loadLists}
                disabled={pageLoading}
                className="px-2.5 py-1.5 text-xs font-semibold bg-ws-panel text-ws-secondary border border-ws-border-strong rounded hover:bg-ws-hover-strong disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {pageLoading ? <Loader2 className="size-3.5" /> : null}
                Atualizar
              </button>

              <button
                type="button"
                onClick={tab === 'printers' ? openCreatePrinter : openCreateToner}
                className="px-2.5 py-1.5 text-xs font-semibold bg-accent hover:bg-accent-light text-[#1a1a1a] rounded whitespace-nowrap"
              >
                + {tab === 'printers' ? 'Impressora' : 'Toner'}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 px-3 pb-2">
            <div className="flex flex-1 min-w-0 items-center gap-2">
              <label
                htmlFor="display-filter"
                className="text-[10px] font-bold uppercase tracking-widest text-[#7cb342] shrink-0"
              >
                Filtro
              </label>
              <input
                id="display-filter"
                type="text"
                value={displayFilter}
                onChange={(e) => setDisplayFilter(e.target.value)}
                placeholder="ip · nome · empresa · código..."
                className="flex-1 min-w-0 bg-ws-panel border border-ws-border-strong rounded px-2.5 py-1.5 text-xs font-mono text-ws-ink placeholder:text-ws-muted focus:outline-none focus:border-accent"
              />
              {displayFilter && (
                <button
                  type="button"
                  onClick={() => setDisplayFilter('')}
                  className="text-[10px] text-ws-muted hover:text-white px-2 shrink-0"
                >
                  Limpar
                </button>
              )}
            </div>

            {tab === 'printers' && (
              <select
                value={empresaFilter}
                onChange={(e) => {
                  setEmpresaFilter(e.target.value);
                  setSelectedPrinterId(null);
                  setPrinterDetail(null);
                }}
                className="bg-ws-panel border border-ws-border-strong rounded px-2 py-1.5 text-xs text-ws-ink w-full sm:w-auto sm:min-w-[180px] sm:max-w-[220px] shrink-0"
              >
                <option value="">Todas empresas</option>
                {[...new Set(printers.map((p) => p.empresa).filter(Boolean))].sort().map((empresa) => (
                  <option key={empresa} value={empresa}>
                    {formatEmpresaLabel(empresa)}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="px-3 py-1 bg-primary/10 border-b border-ws-border text-[10px] font-mono text-ws-sky">
          Capturados: {tab === 'printers' ? captureStats.printers : captureStats.toners} exibidos
          {tab === 'printers' && captureStats.full > 0 && (
            <span className="text-ws-red ml-3">· {captureStats.full} impressora(s) com slots lotados</span>
          )}
        </div>

        <div className="flex flex-col lg:flex-row lg:items-stretch lg:min-h-[min(560px,calc(100dvh-17rem))] min-h-0">
          <div className="flex-1 min-h-[220px] max-h-[45vh] lg:max-h-none lg:min-h-0 overflow-auto border-b lg:border-b-0 lg:border-r border-ws-border">
            {pageLoading ? (
              <p className="text-sm text-ws-muted text-center py-12">Carregando captura...</p>
            ) : tab === 'printers' ? (
              filteredPrinters.length === 0 ? (
                <p className="text-sm text-ws-muted text-center py-12">Nenhuma impressora na captura.</p>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-xs font-mono">
                  <thead className="sticky top-0 bg-ws-elevated text-ws-muted uppercase tracking-wider">
                    <tr>
                      <th className="px-2 py-2 text-left w-10">No.</th>
                      <th className="px-2 py-2 text-left">IP</th>
                      <th className="px-2 py-2 text-left">Nome</th>
                      <th className="px-2 py-2 text-left hidden md:table-cell">Empresa</th>
                      <th className="px-2 py-2 text-left w-20">Toners</th>
                      <th className="px-2 py-2 text-left hidden sm:table-cell">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPrinters.map((printer, index) => {
                      const fillState = getPrinterFillState(printer);
                      const isSelected = selectedPrinterId === printer.id;
                      return (
                        <tr
                          key={printer.id}
                          onClick={() => selectPrinter(printer.id)}
                          className={`cursor-pointer border-b border-ws-border/80 ${
                            isSelected ? 'bg-ws-selected' : index % 2 === 0 ? 'bg-ws-panel' : 'bg-ws-elevated/50'
                          } hover:bg-ws-hover`}
                        >
                          <td className="px-2 py-1.5 text-ws-muted">{index + 1}</td>
                          <td className="px-2 py-1.5 text-ws-cyan">{printer.ip}</td>
                          <td className="px-2 py-1.5 text-ws-yellow truncate max-w-[140px]">
                            {printer.nome || '—'}
                          </td>
                          <td className="px-2 py-1.5 text-ws-orange hidden md:table-cell truncate max-w-[120px]">
                            {formatEmpresaLabel(printer.empresa)}
                          </td>
                          <td className="px-2 py-1.5 text-ws-green">
                            {printer.tonersVinculados ?? 0}/{printer.qtdToners ?? 0}
                          </td>
                          <td className={`px-2 py-1.5 hidden sm:table-cell ${getPrinterFillClass(fillState)}`}>
                            {getPrinterFillLabel(fillState)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              )
            ) : filteredToners.length === 0 ? (
              <p className="text-sm text-ws-muted text-center py-12">Nenhum toner na captura.</p>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full min-w-[400px] text-xs font-mono">
                <thead className="sticky top-0 bg-ws-elevated text-ws-muted uppercase tracking-wider">
                  <tr>
                    <th className="px-2 py-2 text-left w-10">No.</th>
                    <th className="px-2 py-2 text-left">Código</th>
                    <th className="px-2 py-2 text-left">Cor</th>
                    <th className="px-2 py-2 text-left">Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredToners.map((toner, index) => {
                    const isSelected = selectedTonerId === toner.id;
                    return (
                      <tr
                        key={toner.id}
                        onClick={() => selectToner(toner.id)}
                        className={`cursor-pointer border-b border-ws-border/80 ${
                          isSelected ? 'bg-ws-selected' : index % 2 === 0 ? 'bg-ws-panel' : 'bg-ws-elevated/50'
                        } hover:bg-ws-hover`}
                      >
                        <td className="px-2 py-1.5 text-ws-muted">{index + 1}</td>
                        <td className="px-2 py-1.5 text-ws-cyan">{toner.codigo}</td>
                        <td className="px-2 py-1.5">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${getTonerColorBadge(toner.cor)}`}>
                            {formatTonerColor(toner.cor)}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-ws-ink truncate max-w-[200px]">
                          {toner.descricao || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )}
          </div>

          <div className="w-full lg:w-[min(380px,35%)] xl:w-[400px] shrink-0 bg-ws-panel flex flex-col min-h-[240px] lg:min-h-0">
            <div className="px-3 py-2 bg-ws-elevated border-b border-ws-border text-[10px] font-bold uppercase tracking-widest text-ws-muted shrink-0">
              Detalhes do frame
            </div>
            <div className="flex-1 overflow-y-auto p-3 min-h-0">
              {detailLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="size-5 text-ws-muted" />
                </div>
              ) : tab === 'printers' && printerDetail ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-ws-blue mb-2">
                      Impressora #{printerDetail.id}
                    </p>
                    <DetailRow label="IP" value={printerDetail.ip} mono />
                    <DetailRow label="Nome" value={printerDetail.nome} />
                    <DetailRow label="Empresa" value={formatEmpresaLabel(printerDetail.empresa)} />
                    <DetailRow label="Local" value={printerDetail.localizacao} />
                    <DetailRow label="Slots" value={`${printerDetail.tonersVinculados}/${printerDetail.qtdToners}`} />
                    <DetailRow label="Status" value={getPrinterFillLabel(getPrinterFillState(printerDetail))} />
                    <DetailRow label="Descrição" value={printerDetail.descricao} />
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-ws-blue mb-2">
                      Toners vinculados
                    </p>
                    {(printerDetail.toners ?? []).length === 0 ? (
                      <p className="text-xs text-ws-muted">Nenhum toner vinculado.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {(printerDetail.toners ?? []).map((toner) => (
                          <li
                            key={toner.id}
                            className="flex items-center justify-between gap-2 rounded border border-ws-border px-2 py-1.5 bg-ws-elevated"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-mono text-ws-cyan">{toner.codigo}</p>
                              <p className="text-[10px] text-ws-muted">{formatTonerColor(toner.cor)}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleUnlinkToner(toner.id)}
                              disabled={unlinkingId === toner.id}
                              className="text-[10px] text-ws-red hover:text-red-400 disabled:opacity-50 shrink-0"
                            >
                              {unlinkingId === toner.id ? '...' : 'Desvincular'}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {(printerDetail.tonersVinculados ?? 0) < (printerDetail.qtdToners ?? 1) && (
                      <div className="mt-3 flex gap-2">
                        <select
                          value={linkTonerId}
                          onChange={(e) => setLinkTonerId(e.target.value)}
                          className="flex-1 bg-ws-elevated border border-ws-border-strong rounded px-2 py-1 text-xs text-ws-ink"
                        >
                          <option value="">Vincular toner...</option>
                          {availableTonersForLink.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.codigo} — {formatTonerColor(t.cor)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleLinkToner}
                          disabled={!linkTonerId || linking}
                          className="px-2 py-1 text-xs font-semibold bg-primary text-white rounded disabled:opacity-50"
                        >
                          {linking ? '...' : 'OK'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-ws-border">
                    <button
                      type="button"
                      onClick={() => openEditPrinter(printerDetail)}
                      className="px-2.5 py-1 text-xs bg-ws-panel text-ws-secondary border border-ws-border-strong rounded hover:bg-ws-hover-strong"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePrinter(printerDetail.id)}
                      disabled={deletingId === printerDetail.id}
                      className="px-2.5 py-1 text-xs text-ws-red border border-red-900/50 rounded hover:bg-red-950/30 disabled:opacity-50"
                    >
                      {deletingId === printerDetail.id ? 'Excluindo...' : 'Excluir'}
                    </button>
                  </div>
                </div>
              ) : tab === 'toners' && tonerDetail ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-ws-blue mb-2">
                      Toner #{tonerDetail.id}
                    </p>
                    <DetailRow label="Código" value={tonerDetail.codigo} mono />
                    <DetailRow label="Cor" value={formatTonerColor(tonerDetail.cor)} />
                    <DetailRow label="Descrição" value={tonerDetail.descricao} />
                    <DetailRow
                      label="Impressoras"
                      value={String(tonerDetail.impressorasVinculadas ?? tonerDetail.impressoras?.length ?? 0)}
                    />
                  </div>

                  {(tonerDetail.impressoras ?? []).length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-ws-blue mb-2">
                        Vinculado em
                      </p>
                      <ul className="space-y-1.5">
                        {tonerDetail.impressoras.map((printer) => (
                          <li key={printer.id}>
                            <button
                              type="button"
                              onClick={() => selectPrinter(printer.id)}
                              className="w-full text-left rounded border border-ws-border px-2 py-1.5 bg-ws-elevated hover:bg-ws-hover"
                            >
                              <p className="text-xs font-mono text-ws-cyan">{printer.ip}</p>
                              <p className="text-[10px] text-ws-muted truncate">
                                {printer.nome || formatEmpresaLabel(printer.empresa)}
                              </p>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-ws-border">
                    <button
                      type="button"
                      onClick={() => openEditToner(tonerDetail)}
                      className="px-2.5 py-1 text-xs bg-ws-panel text-ws-secondary border border-ws-border-strong rounded hover:bg-ws-hover-strong"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteToner(tonerDetail.id)}
                      disabled={deletingId === tonerDetail.id}
                      className="px-2.5 py-1 text-xs text-ws-red border border-red-900/50 rounded hover:bg-red-950/30 disabled:opacity-50"
                    >
                      {deletingId === tonerDetail.id ? 'Excluindo...' : 'Excluir'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-ws-muted text-center py-8">
                  Selecione uma linha na lista para inspecionar os detalhes.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPrinterModal && (
        <Modal
          title={editingPrinterId ? 'Editar impressora' : 'Nova impressora'}
          onClose={() => setShowPrinterModal(false)}
        >
          <form onSubmit={handleSavePrinter} className="space-y-4">
            <div>
              <label className="form-label">Empresa *</label>
              <EmpresaSelect
                value={printerForm.empresa}
                onChange={(value) => setPrinterForm((f) => ({ ...f, empresa: value }))}
                required
              />
            </div>
            <div>
              <label className="form-label">IP *</label>
              <input
                type="text"
                required
                value={printerForm.ip}
                onChange={(e) => setPrinterForm((f) => ({ ...f, ip: e.target.value }))}
                className="form-input font-mono"
                placeholder="192.168.1.50"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Nome</label>
                <input
                  type="text"
                  value={printerForm.nome}
                  onChange={(e) => setPrinterForm((f) => ({ ...f, nome: e.target.value }))}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Qtd. toners *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={printerForm.qtdToners}
                  onChange={(e) => setPrinterForm((f) => ({ ...f, qtdToners: e.target.value }))}
                  className="form-input"
                />
              </div>
            </div>
            <div>
              <label className="form-label">Localização</label>
              <input
                type="text"
                value={printerForm.localizacao}
                onChange={(e) => setPrinterForm((f) => ({ ...f, localizacao: e.target.value }))}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Descrição</label>
              <textarea
                value={printerForm.descricao}
                onChange={(e) => setPrinterForm((f) => ({ ...f, descricao: e.target.value }))}
                className="form-input min-h-[80px]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowPrinterModal(false)} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showTonerModal && (
        <Modal
          title={editingTonerId ? 'Editar toner' : 'Novo toner'}
          onClose={() => setShowTonerModal(false)}
        >
          <form onSubmit={handleSaveToner} className="space-y-4">
            <div>
              <label className="form-label">Código *</label>
              <input
                type="text"
                required
                maxLength={50}
                value={tonerForm.codigo}
                onChange={(e) => setTonerForm((f) => ({ ...f, codigo: e.target.value }))}
                className="form-input font-mono uppercase"
                placeholder="CF410A"
              />
            </div>
            <div>
              <label className="form-label">Cor</label>
              <select
                value={tonerForm.cor}
                onChange={(e) => setTonerForm((f) => ({ ...f, cor: e.target.value }))}
                className="form-input"
              >
                {TONER_COLORS.map((color) => (
                  <option key={color.value} value={color.value}>
                    {color.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Descrição</label>
              <input
                type="text"
                maxLength={255}
                value={tonerForm.descricao}
                onChange={(e) => setTonerForm((f) => ({ ...f, descricao: e.target.value }))}
                className="form-input"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowTonerModal(false)} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </PageContainer>
  );
}
