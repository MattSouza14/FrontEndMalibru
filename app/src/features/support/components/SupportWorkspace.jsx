import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext.js';
import { listAdminChamados, listMyChamados, getAdminChamado, getMyChamado, openChamado, updateChamadoStatus } from '../services/chamadoService.js';
import { getApiErrorMessage, isUnauthorized } from '../../../shared/lib/apiErrors.js';
import { CHAMADO_STATUS, formatDateTime, getStatusLabel } from '../utils/chamadoStatus.js';
import { slaLabel, prioridadeLabel } from '../utils/chamadoSla.js';
import { markChamadoRead } from '../../notifications/utils/notificationStorage.js';
import PageContainer from '../../../shared/ui/PageContainer.jsx';
import PageHeader from '../../../shared/ui/PageHeader.jsx';
import KpiCard from '../../../shared/ui/KpiCard.jsx';
import AlertBanner from '../../../shared/ui/AlertBanner.jsx';
import OpenChamadoForm from './OpenChamadoForm.jsx';
import ChamadoStatusBadge from './ChamadoStatusBadge.jsx';
import ChamadoMessagesPanel from './ChamadoMessagesPanel.jsx';
import ChamadoManual from './ChamadoManual.jsx';
import ChamadoAttachments from './ChamadoAttachments.jsx';
export default function SupportWorkspace({ admin = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const selected = items.find(c => String(c.id) === params.get('chamado'));
  const showForm = params.get('novo') === '1';
  useEffect(() => {
    let active = true;
    (admin ? listAdminChamados() : listMyChamados()).then(data => { if (active) setItems(Array.isArray(data) ? data : []); })
      .catch(e => { if (active) { setError(getApiErrorMessage(e, 'Não foi possível carregar os chamados.')); if (isUnauthorized(e)) { logout(); navigate('/Login', { replace: true }); } } })
      .finally(() => { if (active) setLoading(false); });
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => { active = false; clearInterval(timer); };
  }, [admin, logout, navigate]);
  function select(c) { setParams({ chamado: String(c.id) }); if (user?.id) markChamadoRead(user.id, c.id); }
  async function refresh(id) {
    try { const c = await (admin ? getAdminChamado(id) : getMyChamado(id)); setItems(prev => prev.map(item => item.id === id ? c : item)); }
    catch(e) { setError(getApiErrorMessage(e, 'Erro ao atualizar chamado.')); }
  }
  async function create(payload) {
    setBusy(true); setError(''); setSuccess('');
    try { const c = await openChamado(payload); setItems(prev => [c, ...prev]); select(c); setSuccess('Chamado criado: ' + c.ticket); return true; }
    catch(e) { setError(getApiErrorMessage(e, 'Não foi possível abrir o chamado.')); return false; }
    finally { setBusy(false); }
  }
  async function changeStatus(value) {
    setBusy(true); setError('');
    try { const c = await updateChamadoStatus(selected.id, value); setItems(prev => prev.map(item => item.id === c.id ? c : item)); }
    catch(e) { setError(getApiErrorMessage(e, 'Não foi possível atualizar o status.')); }
    finally { setBusy(false); }
  }
  const filtered = items.filter(c => (!status || c.status === status) && (!empresa || (c.empresa || 'Não informada') === empresa) && [c.ticket, c.assunto, c.solicitanteNome, c.empresa, c.atendenteNome].join(' ').toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
  const overdue = items.filter(c => slaLabel(c, now) === 'SLA vencido').length;
  return <PageContainer className="space-y-5">
    <PageHeader breadcrumbs={['Malibru Portal', 'Suporte']} title={admin ? 'Central de atendimento' : 'Central do colaborador'} subtitle="Acompanhe seus chamados e encontre ajuda rapidamente." actions={<button type="button" className="btn-primary" onClick={() => { setParams({ novo: '1' }); setError(''); }}>+ Novo chamado</button>} />
    {error && <AlertBanner type="error">{error}</AlertBanner>}{success && <AlertBanner type="success">{success}</AlertBanner>}
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <KpiCard label="Total de chamados" value={items.length} />
      <KpiCard label="Em atendimento" value={items.filter(c => c.status === 'EM_ATENDIMENTO').length} accent="amber" />
      <KpiCard label="Resolvidos" value={items.filter(c => ['RESOLVIDO', 'FECHADO'].includes(c.status)).length} accent="green" />
      <KpiCard label="SLA vencido" value={overdue} subtext="Aguardando primeiro atendimento" accent={overdue ? 'red' : 'blue'} />
    </div>
    {showForm && <OpenChamadoForm onSubmit={create} onCancel={() => setParams({})} loading={busy} />}
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-5 items-start">
      <section className="rounded-xl border border-ws-border bg-ws-panel overflow-hidden">
        <div className="p-5 border-b border-ws-border space-y-3"><h2 className="font-semibold text-ws-bright">{admin ? 'Fila de chamados' : 'Meus chamados'}</h2>
          <input type="search" aria-label="Buscar chamado" placeholder="Buscar ticket, assunto ou pessoa..." className="form-input" value={search} onChange={e => setSearch(e.target.value)} />
          <div className="grid sm:grid-cols-2 gap-2"><select aria-label="Filtrar status" className="form-input" value={status} onChange={e => setStatus(e.target.value)}><option value="">Todos os status</option>{CHAMADO_STATUS.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}</select>
            {admin && <select aria-label="Filtrar empresa" className="form-input" value={empresa} onChange={e => setEmpresa(e.target.value)}><option value="">Todas as empresas</option>{[...new Set(items.map(c => c.empresa || 'Não informada'))].sort().map(e => <option key={e}>{e}</option>)}</select>}
          </div>
        </div>
        {loading ? <p className="p-6 text-ws-muted">Carregando chamados...</p> : !filtered.length ? <p className="p-6 text-ws-muted">Nenhum chamado encontrado.</p> : <ul className="divide-y divide-ws-border max-h-[760px] overflow-y-auto">{filtered.map(c => <li key={c.id}><button type="button" onClick={() => select(c)} aria-pressed={selected?.id === c.id} className={'w-full p-4 text-left hover:bg-ws-canvas ' + (selected?.id === c.id ? 'bg-primary/10' : '')}>
          <div className="flex justify-between gap-3"><span className="text-xs font-mono text-primary break-all">{c.ticket || '#' + c.id}</span><ChamadoStatusBadge status={c.status} /></div>
          <p className="font-medium text-ws-bright mt-2">{c.assunto}</p>
          <p className="text-xs text-ws-muted mt-1">{c.empresa || 'Empresa não informada'} · {c.categoria || 'Outros'} · {prioridadeLabel[c.prioridade] || 'Sem prioridade'}</p>
          <div className="flex justify-between flex-wrap gap-2 text-xs mt-2"><span className="text-ws-secondary">{slaLabel(c, now)}</span><span className="text-ws-muted">{formatDateTime(c.createdAt)}</span></div>
        </button></li>)}</ul>}
      </section>
      <section className="rounded-xl border border-ws-border bg-ws-panel p-5 space-y-5 min-w-0">
        {!selected ? <div className="py-16 text-center text-ws-muted">Selecione um chamado para ver os detalhes e a conversa.</div> : <>
          <div><p className="font-mono text-xs text-primary">{selected.ticket}</p><h2 className="text-lg font-semibold text-ws-bright mt-1">{selected.assunto}</h2><p className="text-xs text-ws-muted mt-1">{selected.solicitanteNome} · {selected.empresa || 'Empresa não informada'}</p></div>
          <div className="rounded-lg bg-ws-canvas p-3 text-sm space-y-1"><p className="font-semibold">{slaLabel(selected, now)}</p><p>Prazo de primeiro atendimento: {formatDateTime(selected.prazoAtendimento)}</p><p>Atendente: {selected.atendenteNome || 'Ainda não atendido'}</p><p>Prioridade: {prioridadeLabel[selected.prioridade] || 'Não definida'}</p></div>
          <p className="text-sm whitespace-pre-wrap break-words text-ws-secondary">{selected.descricao}</p>
          <details className="text-sm"><summary className="cursor-pointer text-ws-muted">Contato e acesso remoto</summary><p className="mt-2">{selected.email} · {selected.telefoneContato}</p><p>{selected.ferramentaRemota}: {selected.codigoAcessoRemoto}</p></details>
          <ChamadoAttachments key={selected.id} chamadoId={selected.id} />
          {admin && <label className="block space-y-2"><span className="form-label">Atualizar status</span><select className="form-input" value={selected.status} disabled={busy} onChange={e => changeStatus(e.target.value)}>{CHAMADO_STATUS.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}</select></label>}
          <ChamadoMessagesPanel key={'chat-' + selected.id} chamado={selected} mode={admin ? 'admin' : 'user'} onMessageSent={() => refresh(selected.id)} />
        </>}
      </section>
    </div>
    <ChamadoManual />
  </PageContainer>;
}
