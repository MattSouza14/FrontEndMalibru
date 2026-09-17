import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PageContainer from '../../../shared/ui/PageContainer.jsx';
import PageHeader from '../../../shared/ui/PageHeader.jsx';
import SectionCard from '../../../shared/ui/SectionCard.jsx';
import AlertBanner from '../../../shared/ui/AlertBanner.jsx';
import TablePagination from '../../../shared/components/TablePagination.jsx';
import { getApiErrorMessage } from '../../../shared/lib/apiErrors.js';
import { loadMaintenanceData, saveMaintenance, maintenancePdf, maintenanceReportPdf } from '../services/maintenanceService.js';
import { maintenancePayload, maintenanceStatus, todayInSaoPaulo, validateMaintenance } from '../utils/maintenance.js';

const inputClass = 'w-full px-3 py-2.5 rounded-lg bg-ws-panel border border-ws-border text-sm text-ws-bright focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60';
const money = (value) => value == null ? 'Não informado' : Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const date = (value) => value ? value.slice(0, 10).split('-').reverse().join('/') : '—';
const emptyForm = () => ({ equipamentoId: '', descricaoProblema: '', dataEnvio: todayInSaoPaulo(), contatoFornecedor: '', valor: '', dataRetorno: '', encerrada: false, versao: null });

export default function MaintenancePage() {
  const [items, setItems] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recordsError, setRecordsError] = useState('');
  const [equipmentsError, setEquipmentsError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pdfId, setPdfId] = useState(null);
  const [reportStatus, setReportStatus] = useState('todos');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('todos');
  const [page, setPage] = useState(1);
  const formRef = useRef(null);
  const isFormOpen = form !== null;

  const applyData = useCallback(({ records, equipments: options }) => {
    if (records.status === 'fulfilled') setItems(records.value);
    if (options.status === 'fulfilled') setEquipments(options.value);
    setRecordsError(records.status === 'rejected' ? `Não foi possível carregar o histórico. ${getApiErrorMessage(records.reason, 'Tente atualizar a página.')}` : '');
    setEquipmentsError(options.status === 'rejected' ? `Não foi possível carregar os equipamentos. ${getApiErrorMessage(options.reason, 'Tente atualizar a página.')}` : '');
    setLoading(false);
  }, []);
  async function load() { applyData(await loadMaintenanceData()); }
  useEffect(() => {
    let active = true;
    loadMaintenanceData().then((data) => { if (active) applyData(data); });
    return () => { active = false; };
  }, [applyData]);
  useEffect(() => {
    if (isFormOpen) { formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); formRef.current?.focus(); }
  }, [editingId, isFormOpen]);

  const filtered = useMemo(() => items.filter((item) => {
    const matchesStatus = status === 'todos' || (status === 'encerradas' ? item.encerrada : status === 'retornados' ? !item.encerrada && item.dataRetorno : !item.encerrada && !item.dataRetorno);
    return matchesStatus && `${item.id} ${item.equipamentoNome} ${item.patrimonio || ''} ${item.empresa} ${item.descricaoProblema}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'));
  }), [items, status, search]);
  const pages = Math.max(1, Math.ceil(filtered.length / 8));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * 8, currentPage * 8);
  function field(key, value) { setForm((current) => ({ ...current, [key]: value })); }
  function edit(item) {
    setEditingId(item.id); setError(''); setSuccess('');
    setForm({ equipamentoId: String(item.equipamentoId), descricaoProblema: item.descricaoProblema, dataEnvio: item.dataEnvio, contatoFornecedor: item.contatoFornecedor || '', valor: item.valor == null ? '' : String(item.valor), dataRetorno: item.dataRetorno || '', encerrada: item.encerrada, versao: item.versao });
  }
  async function submit(event) {
    event.preventDefault();
    const invalid = validateMaintenance(form);
    if (invalid) { setError(invalid); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const saved = await saveMaintenance(editingId, maintenancePayload(form));
      setItems((current) => [saved, ...current.filter((item) => item.id !== saved.id)].sort((a, b) => b.dataEnvio.localeCompare(a.dataEnvio) || b.id - a.id));
      setForm(null); setEditingId(null); setSuccess('Manutenção salva com sucesso.');
    } catch (err) { setError(getApiErrorMessage(err, 'Não foi possível salvar a manutenção.')); }
    finally { setSaving(false); }
  }
  async function pdf(item, download) {
    const viewer = download ? null : window.open('', '_blank');
    if (!download && !viewer) { setError('Permita abrir uma nova aba para visualizar e imprimir o PDF.'); return; }
    if (viewer) { viewer.opener = null; viewer.document.title = 'Gerando PDF...'; }
    setPdfId(item ? item.id : 'relatorio'); setError('');
    try {
      const url = URL.createObjectURL(await (item ? maintenancePdf(item.id) : maintenanceReportPdf(reportStatus)));
      if (download) {
        const link = document.createElement('a'); link.href = url; link.download = item ? `manutencao-${item.id}.pdf` : `relatorio-manutencoes-${reportStatus}.pdf`;
        document.body.appendChild(link); link.click(); link.remove();
      } else { viewer.location.replace(url); }
      window.setTimeout(() => URL.revokeObjectURL(url), 120000);
    } catch (err) { viewer?.close(); setError(getApiErrorMessage(err, 'Não foi possível gerar o PDF.')); }
    finally { setPdfId(null); }
  }

  return (
    <PageContainer>
      <PageHeader breadcrumbs={['Malibru Portal', 'Equipamentos', 'Compras']} title="Manutenção de equipamentos"
        subtitle="Acompanhe o envio, o retorno e o encerramento das manutenções."
        actions={<><button className="btn-secondary" disabled={loading || saving} onClick={() => { setLoading(true); setError(''); void load(); }}>Atualizar</button><button className="btn-primary" disabled={loading || saving} onClick={() => { setForm(emptyForm()); setEditingId(null); setError(''); setSuccess(''); }}>Nova manutenção</button></>} />
      {error && <div role="alert"><AlertBanner>{error}</AlertBanner></div>}
      {recordsError && <div role="alert"><AlertBanner>{recordsError}</AlertBanner></div>}
      {equipmentsError && <div role="alert"><AlertBanner>{equipmentsError} Use Atualizar para tentar novamente.</AlertBanner></div>}
      {success && <div role="status"><AlertBanner type="success">{success}</AlertBanner></div>}
      <div className="grid gap-4 sm:grid-cols-3">
        {[['Em manutenção', items.filter((i) => !i.encerrada && !i.dataRetorno).length], ['Aguardando encerramento', items.filter((i) => !i.encerrada && i.dataRetorno).length], ['Fluxos encerrados', items.filter((i) => i.encerrada).length]].map(([label, count]) => (
          <div key={label} className="panel-card p-5"><p className="text-xs text-ws-muted uppercase tracking-wider">{label}</p><p className="mt-2 text-3xl font-bold text-ws-bright tabular-nums">{count}</p></div>
        ))}
      </div>
      <SectionCard title="Relatório de manutenções" subtitle="Inclui todos os registros da situação escolhida, independentemente da busca e da paginação do histórico.">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 space-y-1.5"><span className="text-sm text-ws-secondary">Equipamentos do relatório</span>
            <select className={inputClass} value={reportStatus} disabled={pdfId !== null} onChange={(e) => setReportStatus(e.target.value)}>
              <option value="todos">Ambos: em manutenção e já retornados</option>
              <option value="em_manutencao">Em manutenção (sem retorno)</option>
              <option value="retornados">Já retornaram da manutenção</option>
            </select>
          </label>
          <button className="btn-secondary" disabled={pdfId !== null} onClick={() => pdf(null, true)}>Baixar relatório PDF</button>
          <button className="btn-primary" disabled={pdfId !== null} onClick={() => pdf(null, false)}>{pdfId === 'relatorio' ? 'Gerando relatório...' : 'Visualizar / imprimir PDF'}</button>
        </div>
        <p className="mt-3 text-xs text-ws-muted">Já retornados inclui os fluxos encerrados e os que aguardam encerramento. Cada envio do equipamento aparece como um registro.</p>
      </SectionCard>
      {form && <div ref={formRef} tabIndex={-1} className="outline-none">
        <SectionCard title={editingId ? `Editar manutenção #${editingId}` : 'Registrar envio para manutenção'} subtitle="Equipamento, descrição e envio são obrigatórios. Contato e valor são opcionais.">
          <form onSubmit={submit} className="space-y-5">
            <fieldset disabled={saving} className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5 md:col-span-2"><span className="text-sm text-ws-secondary">Equipamento *</span>
                <select className={inputClass} required disabled={Boolean(editingId)} value={form.equipamentoId} onChange={(e) => field('equipamentoId', e.target.value)}>
                  <option value="">Selecione um equipamento cadastrado</option>
                  {equipments.map((e) => <option key={e.id} value={e.id}>{e.nome} · {e.patrimonio || 'Sem patrimônio'} · {e.empresa}</option>)}
                </select>
                {!loading && !equipmentsError && !equipments.length && <p className="text-xs text-ws-muted">Solicite à TI o cadastro do equipamento antes de registrar a manutenção.</p>}
              </label>
              <label className="space-y-1.5 md:col-span-2"><span className="text-sm text-ws-secondary">Descrição do problema *</span><textarea required maxLength={4000} rows={4} className={inputClass} value={form.descricaoProblema} onChange={(e) => field('descricaoProblema', e.target.value)} placeholder="Descreva o defeito, os sintomas e as informações para o fornecedor." /></label>
              <label className="space-y-1.5"><span className="text-sm text-ws-secondary">Data de envio *</span><input required type="date" max={todayInSaoPaulo()} className={inputClass} value={form.dataEnvio} onChange={(e) => field('dataEnvio', e.target.value)} /></label>
              <label className="space-y-1.5"><span className="text-sm text-ws-secondary">Data de retorno</span><input type="date" min={form.dataEnvio} max={todayInSaoPaulo()} className={inputClass} value={form.dataRetorno} onChange={(e) => field('dataRetorno', e.target.value)} /></label>
              <label className="space-y-1.5"><span className="text-sm text-ws-secondary">Contato do fornecedor (opcional)</span><input maxLength={255} className={inputClass} value={form.contatoFornecedor} onChange={(e) => field('contatoFornecedor', e.target.value)} placeholder="Nome, telefone ou e-mail" /></label>
              <label className="space-y-1.5"><span className="text-sm text-ws-secondary">Valor em R$ (opcional)</span><input type="number" min="0" max="9999999999.99" step="0.01" className={inputClass} value={form.valor} onChange={(e) => field('valor', e.target.value)} placeholder="0,00" /></label>
              <label className="md:col-span-2 flex items-start gap-3 rounded-lg border border-ws-border bg-ws-panel p-4"><input type="checkbox" className="mt-1 accent-primary" checked={form.encerrada} onChange={(e) => field('encerrada', e.target.checked)} /><span><span className="block text-sm font-semibold text-ws-bright">Encerrar fluxo de manutenção</span><span className="text-xs text-ws-muted">Marque após registrar o retorno e finalizar o acompanhamento de Compras.</span></span></label>
            </fieldset>
            <p className="text-xs text-ws-muted">Dias corridos: retorno − envio. Sem retorno, a contagem vai até hoje. Envio e retorno no mesmo dia: 0 dias.</p>
            <div className="flex justify-end gap-3"><button type="button" className="btn-secondary" disabled={saving} onClick={() => { setForm(null); setEditingId(null); }}>Cancelar</button><button className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar manutenção'}</button></div>
          </form>
        </SectionCard>
      </div>}
      <SectionCard title="Histórico de manutenção" subtitle="O PDF pode ser baixado ou aberto para impressão." noPadding>
        <div className="flex flex-col gap-3 p-5 sm:flex-row">
          <label className="flex-1"><span className="sr-only">Buscar manutenção</span><input className={inputClass} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar equipamento, patrimônio, empresa ou problema..." /></label>
          <label><span className="sr-only">Filtrar situação</span><select className={inputClass} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="todos">Todas as situações</option><option value="manutencao">Em manutenção</option><option value="retornados">Aguardando encerramento</option><option value="encerradas">Encerradas</option></select></label>
        </div>
        <div className="overflow-x-auto"><table className="data-table w-full"><thead><tr><th>Equipamento / problema</th><th>Envio</th><th>Retorno</th><th>Dias</th><th>Valor</th><th>Situação</th><th>Ações</th></tr></thead>
          <tbody>{loading ? <tr><td colSpan={7} className="p-8 text-center text-ws-muted" role="status">Carregando manutenções...</td></tr> : visible.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-ws-muted">{recordsError ? 'Histórico indisponível. Clique em Atualizar para tentar novamente.' : items.length ? 'Nenhuma manutenção corresponde aos filtros.' : 'Nenhuma manutenção registrada. Clique em Nova manutenção para começar.'}</td></tr> : visible.map((item) => (
            <tr key={item.id}><td className="min-w-64 max-w-md"><p className="font-semibold text-ws-bright">#{item.id} · {item.equipamentoNome}</p><p className="text-xs text-ws-muted">{item.patrimonio || 'Sem patrimônio'} · {item.empresa}</p><details className="mt-2 text-xs"><summary className="cursor-pointer text-ws-sky">Ver problema e fornecedor</summary><p className="mt-2 whitespace-pre-wrap break-words text-ws-secondary">{item.descricaoProblema}</p><p className="mt-2 break-words text-ws-muted">Contato: {item.contatoFornecedor || 'Não informado'}</p></details></td>
              <td className="whitespace-nowrap">{date(item.dataEnvio)}</td><td className="whitespace-nowrap">{date(item.dataRetorno)}</td><td className="tabular-nums font-semibold">{item.diasManutencao}<span className="block text-[10px] font-normal text-ws-muted">{item.dataRetorno ? 'dias corridos' : 'dias até hoje'}</span></td><td className="whitespace-nowrap">{money(item.valor)}</td>
              <td><span className={`inline-block rounded px-2 py-1 text-xs ${item.encerrada ? 'bg-emerald-950/40 text-emerald-400' : item.dataRetorno ? 'bg-primary/10 text-ws-sky' : 'bg-amber-950/40 text-amber-400'}`}>{maintenanceStatus(item)}</span></td>
              <td><div className="flex flex-col items-start gap-2"><button className="text-xs font-semibold text-ws-sky hover:underline" disabled={saving} onClick={() => edit(item)}>{item.encerrada ? 'Consultar / editar' : 'Atualizar / encerrar'}</button><button className="text-xs text-ws-secondary hover:underline disabled:opacity-50" disabled={pdfId !== null} onClick={() => pdf(item, true)}>{pdfId === item.id ? 'Gerando PDF...' : 'Baixar PDF'}</button><button className="text-xs text-ws-secondary hover:underline disabled:opacity-50" disabled={pdfId !== null} onClick={() => pdf(item, false)}>Abrir PDF / imprimir</button></div></td>
            </tr>
          ))}</tbody></table></div>
        <TablePagination page={currentPage} totalPages={pages} total={filtered.length} pageSize={8} onPrev={() => setPage(currentPage - 1)} onNext={() => setPage(currentPage + 1)} />
      </SectionCard>
    </PageContainer>
  );
}
