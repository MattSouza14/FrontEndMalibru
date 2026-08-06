import { daysUntil } from './expiry';
import { getStatusLabel } from './chamadoStatus';
import { formatEmpresaLabel } from './equipment';

export function countByField(items, field, fallback = '—') {
  const counts = {};
  items.forEach((item) => {
    const key = item[field]?.trim?.() || item[field] || fallback;
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export function countByStatus(items, statusField = 'status') {
  const counts = {};
  items.forEach((item) => {
    const status = item[statusField] || 'DESCONHECIDO';
    counts[status] = (counts[status] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([status, value]) => ({
      key: status,
      label: getStatusLabel(status),
      value,
    }))
    .sort((a, b) => b.value - a.value);
}

export function bucketByExpiry(items, dateField) {
  const buckets = {
    overdue: { key: 'overdue', label: 'Vencidos', value: 0, color: 'bg-red-500' },
    urgent: { key: 'urgent', label: 'Até 7 dias', value: 0, color: 'bg-amber-500' },
    warn: { key: 'warn', label: '8–30 dias', value: 0, color: 'bg-yellow-400' },
    ok: { key: 'ok', label: 'Acima de 30 dias', value: 0, color: 'bg-emerald-500' },
    none: { key: 'none', label: 'Sem data', value: 0, color: 'bg-ws-border-strong' },
  };

  items.forEach((item) => {
    const date = item[dateField];
    if (!date) {
      buckets.none.value += 1;
      return;
    }
    const days = daysUntil(date);
    if (days < 0) buckets.overdue.value += 1;
    else if (days <= 7) buckets.urgent.value += 1;
    else if (days <= 30) buckets.warn.value += 1;
    else buckets.ok.value += 1;
  });

  return Object.values(buckets).filter((b) => b.value > 0);
}

export function buildUserStats(users) {
  const list = Array.isArray(users) ? users : [];
  const active = list.filter((u) => u.enabled).length;
  const pending = list.length - active;

  const byRole = {};
  list.forEach((u) => {
    (u.roles || ['USER']).forEach((role) => {
      byRole[role] = (byRole[role] || 0) + 1;
    });
  });

  const bySetor = countByField(list, 'setor', 'Sem setor');

  return {
    total: list.length,
    active,
    pending,
    status: [
      { key: 'active', label: 'Ativos', value: active, color: 'bg-emerald-500' },
      { key: 'pending', label: 'Pendentes', value: pending, color: 'bg-amber-500' },
    ].filter((item) => item.value > 0),
    roles: Object.entries(byRole)
      .map(([label, value]) => ({ key: label, label, value }))
      .sort((a, b) => b.value - a.value),
    setores: bySetor.slice(0, 8).map(({ label, value }) => ({ key: label, label, value })),
  };
}

export function buildOfficeLicenseStats(licenses) {
  const list = Array.isArray(licenses) ? licenses : [];
  const totalSlots = list.length * 5;
  const usedSlots = list.reduce((sum, l) => sum + (l.usuariosVinculados ?? 0), 0);
  const full = list.filter((l) => (l.vagasRestantes ?? 0) <= 0).length;
  const withSlots = list.filter((l) => (l.vagasRestantes ?? 0) > 0).length;

  return {
    total: list.length,
    usedSlots,
    totalSlots,
    availableSlots: totalSlots - usedSlots,
    full,
    withSlots,
    expiry: bucketByExpiry(list, 'vencimento'),
    topExpiring: [...list]
      .filter((l) => l.vencimento)
      .sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento))
      .slice(0, 5),
  };
}

export function buildSoftwareLicenseStats(licenses) {
  const list = Array.isArray(licenses) ? licenses : [];
  const bySoftware = countByField(list, 'nome');
  const totalSeats = list.reduce((sum, l) => sum + (l.qtdLicencas ?? 1), 0);

  return {
    total: list.length,
    totalSeats,
    bySoftware: bySoftware.slice(0, 8).map(({ label, value }) => ({ key: label, label, value })),
    expiry: bucketByExpiry(list, 'dataVencimento'),
    topExpiring: [...list]
      .filter((l) => l.dataVencimento)
      .sort((a, b) => new Date(a.dataVencimento) - new Date(b.dataVencimento))
      .slice(0, 5),
  };
}

export function buildCertificateStats(certificates) {
  const list = Array.isArray(certificates) ? certificates : [];
  const byEmpresa = countByField(list, 'empresa', 'Sem empresa');

  return {
    total: list.length,
    byEmpresa: byEmpresa.slice(0, 8),
    expiry: bucketByExpiry(list, 'dataVencimento'),
    topExpiring: [...list]
      .filter((c) => c.dataVencimento)
      .sort((a, b) => new Date(a.dataVencimento) - new Date(b.dataVencimento))
      .slice(0, 5),
  };
}

export function buildEquipmentStats(equipments) {
  const list = Array.isArray(equipments) ? equipments : [];
  const linked = list.filter((e) => e.usuarioId).length;
  const available = list.length - linked;
  const byEmpresa = countByField(list, 'empresa', 'Sem empresa').map(({ label, value }) => ({
    key: label,
    label: label === 'Sem empresa' ? label : formatEmpresaLabel(label),
    value,
  }));

  return {
    total: list.length,
    linked,
    available,
    linkRate: list.length ? Math.round((linked / list.length) * 100) : 0,
    byEmpresa: byEmpresa.slice(0, 12),
  };
}

export function buildSignedTermStats(termos) {
  const list = Array.isArray(termos) ? termos : [];
  const withUser = list.filter((t) => t.usuarioId).length;
  const withoutUser = list.length - withUser;
  const totalBytes = list.reduce((sum, t) => sum + (t.tamanhoBytes ?? 0), 0);

  return {
    total: list.length,
    withUser,
    withoutUser,
    totalBytes,
  };
}

export function buildPrinterStats(printers) {
  const list = Array.isArray(printers) ? printers : [];
  let full = 0;
  let partial = 0;
  let empty = 0;

  list.forEach((printer) => {
    const linked = printer.tonersVinculados ?? 0;
    const capacity = printer.qtdToners ?? 1;
    if (linked >= capacity) full += 1;
    else if (linked > 0) partial += 1;
    else empty += 1;
  });

  const byEmpresa = countByField(list, 'empresa', 'Sem empresa').map(({ label, value }) => ({
    key: label,
    label: label === 'Sem empresa' ? label : formatEmpresaLabel(label),
    value,
  }));

  const totalTonerSlots = list.reduce((sum, printer) => sum + (printer.qtdToners ?? 0), 0);
  const usedTonerSlots = list.reduce((sum, printer) => sum + (printer.tonersVinculados ?? 0), 0);

  const slotUsage = [
    { key: 'full', label: 'Slots lotados', value: full, color: 'bg-red-500' },
    { key: 'partial', label: 'Parcialmente vinculadas', value: partial, color: 'bg-amber-500' },
    { key: 'empty', label: 'Sem toners', value: empty, color: 'bg-ws-border-strong' },
  ].filter((item) => item.value > 0);

  return {
    total: list.length,
    full,
    partial,
    empty,
    byEmpresa: byEmpresa.slice(0, 12),
    slotUsage,
    totalTonerSlots,
    usedTonerSlots,
    fillRate: totalTonerSlots ? Math.round((usedTonerSlots / totalTonerSlots) * 100) : 0,
  };
}

export function buildTonerStats(toners) {
  const list = Array.isArray(toners) ? toners : [];
  const colorLabels = {
    preto: 'Preto',
    ciano: 'Ciano',
    magenta: 'Magenta',
    amarelo: 'Amarelo',
    outro: 'Outro',
  };

  const byCor = countByField(list, 'cor', 'Sem cor').map(({ label, value }) => ({
    key: label,
    label: colorLabels[label] ?? label,
    value,
  }));

  return {
    total: list.length,
    byCor: byCor.slice(0, 8),
  };
}

export function buildChamadoStats(chamados) {
  const list = Array.isArray(chamados) ? chamados : [];
  const openStatuses = ['ABERTO', 'EM_ATENDIMENTO', 'AGUARDANDO_USUARIO'];
  const open = list.filter((c) => openStatuses.includes(c.status)).length;
  const closed = list.length - open;

  return {
    total: list.length,
    open,
    closed,
    byStatus: countByStatus(list),
    byTool: countByField(list, 'ferramentaRemota').map(({ label, value }) => ({
      label: label === 'ANYDESK' ? 'AnyDesk' : label === 'TEAMVIEWER' ? 'TeamViewer' : label === 'RUSTDESK' ? 'RustDesk' : label,
      value,
    })),
    recent: [...list]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5),
  };
}

export function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}
