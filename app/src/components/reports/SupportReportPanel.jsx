import { useState } from 'react';
import { formatDateTime, getStatusLabel } from '../../utils/chamadoStatus';
import { slaLabel, prioridadeLabel } from '../../utils/chamadoSla';
export default function SupportReportPanel({ chamados }) {
  const [empresa, setEmpresa] = useState('');
  const [search, setSearch] = useState('');
  const empresas = [...new Set(chamados.map(c => c.empresa || 'Não informada'))].sort();
  const items = chamados.filter(c => (!empresa || (c.empresa || 'Não informada') === empresa) && [c.ticket, c.assunto, c.solicitanteNome, c.atendenteNome].join(' ').toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
  return <div className="space-y-4 mt-5 pt-4 border-t border-ws-border">
    <h3 className="form-label">Indicadores por empresa</h3>
    {!empresas.length && <p className="text-sm text-ws-muted">Nenhum chamado registrado.</p>}
    <div className="grid sm:grid-cols-2 gap-2">{empresas.map(e => {
      const group = chamados.filter(c => (c.empresa || 'Não informada') === e);
      return <button type="button" key={e} aria-pressed={empresa === e} onClick={() => setEmpresa(empresa === e ? '' : e)} className={'rounded-lg border p-3 text-left ' + (empresa === e ? 'border-primary bg-primary/10' : 'border-ws-border bg-ws-canvas')}>
        <p className="font-semibold capitalize text-ws-bright">{e}</p><p className="text-xs text-ws-secondary mt-1">{group.length} chamados · {group.filter(c => ['RESOLVIDO', 'FECHADO'].includes(c.status)).length} resolvidos</p>
        <p className="text-xs text-ws-muted">{group.filter(c => slaLabel(c) === 'SLA vencido').length} aguardando fora do SLA · {group.filter(c => slaLabel(c) === 'Atendido no prazo').length} atendidos no prazo</p>
      </button>;
    })}</div>
    <div className="grid sm:grid-cols-2 gap-2"><select className="form-input" aria-label="Empresa no relatório" value={empresa} onChange={e => setEmpresa(e.target.value)}><option value="">Todas as empresas</option>{empresas.map(e => <option key={e}>{e}</option>)}</select><input className="form-input" type="search" aria-label="Buscar ticket no relatório" placeholder="Ticket, assunto ou atendente" value={search} onChange={e => setSearch(e.target.value)} /></div>
    <p className="text-xs text-ws-muted">{items.length} chamados. Expanda para ver o resumo.</p>
    <div className="space-y-2 max-h-[600px] overflow-y-auto">{items.map(c => <details key={c.id} className="rounded-lg border border-ws-border p-3">
      <summary className="cursor-pointer text-sm text-ws-bright"><span className="font-mono text-primary">{c.ticket || '#' + c.id}</span> · {c.assunto}<span className="block text-xs text-ws-muted mt-1">{c.empresa || 'Empresa não informada'} · {getStatusLabel(c.status)} · Atendente: {c.atendenteNome || 'Ainda não atendido'}</span></summary>
      <div className="mt-3 text-sm space-y-2 text-ws-secondary"><p className="whitespace-pre-wrap break-words">{c.descricao}</p><p>Solicitante: {c.solicitanteNome || c.email}</p><p>Categoria: {c.categoria || 'Não informada'} · Prioridade: {prioridadeLabel[c.prioridade] || 'Não definida'}</p><p>Abertura: {formatDateTime(c.createdAt)}</p><p>SLA: {slaLabel(c)} · Prazo: {formatDateTime(c.prazoAtendimento)}</p><p>Primeiro atendimento: {formatDateTime(c.primeiroAtendimento)}</p><p>Resolução: {formatDateTime(c.resolvidoEm)}</p><p>Última atualização: {formatDateTime(c.updatedAt)}</p></div>
    </details>)}</div>
  </div>;
}
