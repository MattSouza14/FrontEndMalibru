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
    none: { key: 'none', label: 'Sem data', value: 0, color: 'bg-gray-300' },
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
    roles: Object.entries(byRole)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value),
    setores: bySetor.slice(0, 8),
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
    bySoftware: bySoftware.slice(0, 8),
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
