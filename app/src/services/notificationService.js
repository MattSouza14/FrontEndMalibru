import { listCertificates } from './certificateService';
import {
  listAdminChamadoMessages,
  listAdminChamados,
  listMyChamadoMessages,
  listMyChamados,
} from './chamadoService';
import { listOfficeLicenses } from './officeLicenseService';
import { listSoftwareLicenses } from './softwareLicenseService';
import {
  getMyOfficeLicense,
  getMySoftwareLicenses,
} from './userResourcesService';
import { daysUntil, expiryLabel, getExpiringWithinDays } from '../utils/expiry';
import { getChamadoReadAt, isNotificationRead } from '../utils/notificationStorage';
import { isChamadoEncerrado } from '../utils/chamadoStatus';
import { canAccessChamadosAdmin, canAccessTiModules } from '../utils/roles';

const EXPIRY_WINDOW_DAYS = 30;
const MAX_CHAMADOS_TO_CHECK = 12;

function buildLicenseNotification({ id, title, message, href, dateValue, priority }) {
  return {
    id,
    type: 'LICENSE_EXPIRING',
    title,
    message,
    href,
    createdAt: `${dateValue}T12:00:00`,
    priority,
    persistent: true,
  };
}

function appendMyLicenseNotifications(notifications, officeLicense, softwareLicenses) {
  if (officeLicense?.vencimento) {
    const days = daysUntil(officeLicense.vencimento);
    if (days <= EXPIRY_WINDOW_DAYS) {
      notifications.push(
        buildLicenseNotification({
          id: `license-office-mine-${officeLicense.id ?? 'me'}`,
          title: 'Sua licença Office vence em breve',
          message: `${officeLicense.nome || officeLicense.email || 'Licença Office'} · ${expiryLabel(days)}`,
          href: '/HomePage',
          dateValue: officeLicense.vencimento,
          priority: days <= 7 ? 'high' : 'normal',
        }),
      );
    }
  }

  (Array.isArray(softwareLicenses) ? softwareLicenses : []).forEach((license) => {
    if (!license.dataVencimento) return;
    const days = daysUntil(license.dataVencimento);
    if (days > EXPIRY_WINDOW_DAYS) return;

    notifications.push(
      buildLicenseNotification({
        id: `license-software-mine-${license.id}`,
        title: 'Licença de software vencendo',
        message: `${license.nome || license.software || 'Software'} · ${expiryLabel(days)}`,
        href: '/HomePage',
        dateValue: license.dataVencimento,
        priority: days <= 7 ? 'high' : 'normal',
      }),
    );
  });
}

function appendTiLicenseNotifications(notifications, licenses, softwareLicenses, certificates) {
  getExpiringWithinDays(licenses, 'vencimento', EXPIRY_WINDOW_DAYS).forEach((license) => {
    const days = daysUntil(license.vencimento);
    notifications.push(
      buildLicenseNotification({
        id: `license-office-${license.id}`,
        title: 'Licença Office vencendo',
        message: `${license.nome || license.email || `Licença #${license.id}`} · ${expiryLabel(days)}`,
        href: '/admin/office-licenses',
        dateValue: license.vencimento,
        priority: days <= 7 ? 'high' : 'normal',
      }),
    );
  });

  getExpiringWithinDays(softwareLicenses, 'dataVencimento', EXPIRY_WINDOW_DAYS).forEach((license) => {
    const days = daysUntil(license.dataVencimento);
    notifications.push(
      buildLicenseNotification({
        id: `license-software-${license.id}`,
        title: 'Licença de software vencendo',
        message: `${license.nome || license.software || `Licença #${license.id}`} · ${expiryLabel(days)}`,
        href: '/admin/software-licenses',
        dateValue: license.dataVencimento,
        priority: days <= 7 ? 'high' : 'normal',
      }),
    );
  });

  getExpiringWithinDays(certificates, 'dataVencimento', EXPIRY_WINDOW_DAYS).forEach((certificate) => {
    const days = daysUntil(certificate.dataVencimento);
    notifications.push(
      buildLicenseNotification({
        id: `certificate-${certificate.id}`,
        title: 'Certificado digital vencendo',
        message: `${certificate.nome || certificate.titular || `Certificado #${certificate.id}`} · ${expiryLabel(days)}`,
        href: '/admin/certificates',
        dateValue: certificate.dataVencimento,
        priority: days <= 7 ? 'high' : 'normal',
      }),
    );
  });
}

function truncateMessage(text, max = 90) {
  const value = String(text ?? '').trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max).trim()}…`;
}

async function appendChamadoReplyNotifications(token, userId, chamados, mode, notifications) {
  const active = (Array.isArray(chamados) ? chamados : [])
    .filter((chamado) => !isChamadoEncerrado(chamado.status))
    .slice(0, MAX_CHAMADOS_TO_CHECK);

  await Promise.all(
    active.map(async (chamado) => {
      try {
        const messages =
          mode === 'admin'
            ? await listAdminChamadoMessages(token, chamado.id)
            : await listMyChamadoMessages(token, chamado.id);

        const list = Array.isArray(messages) ? messages : [];
        if (list.length === 0) return;

        const latest = [...list].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        )[0];

        const readAt = getChamadoReadAt(userId, chamado.id);
        const latestTime = new Date(latest.createdAt).getTime();
        const readTime = readAt ? new Date(readAt).getTime() : 0;

        const fromOther =
          mode === 'admin'
            ? latest.tipoAutor === 'SOLICITANTE'
            : latest.tipoAutor === 'ATENDENTE';

        const notificationId = `chamado-resposta-${chamado.id}-${latest.id}`;

        if (
          fromOther &&
          latestTime > readTime &&
          !isNotificationRead(userId, notificationId)
        ) {
          notifications.push({
            id: notificationId,
            type: 'CHAMADO_RESPOSTA',
            title: mode === 'admin' ? 'Usuário respondeu no chamado' : 'Nova resposta do suporte',
            message: `${chamado.assunto}: ${truncateMessage(latest.mensagem)}`,
            href:
              mode === 'admin'
                ? `/admin/chamados?chamado=${chamado.id}`
                : `/chamados?chamado=${chamado.id}`,
            createdAt: latest.createdAt,
            priority: 'high',
            chamadoId: chamado.id,
          });
        }
      } catch {
        // Ignora falhas individuais para não bloquear o sininho.
      }
    }),
  );
}

export async function fetchNotifications(token, user) {
  if (!token || !user?.id) return [];

  const notifications = [];
  const userId = user.id;
  const showTiAlerts = canAccessTiModules(user);
  const showChamadosAdmin = canAccessChamadosAdmin(user);

  const [officeResult, softwareResult] = await Promise.allSettled([
    getMyOfficeLicense(token),
    getMySoftwareLicenses(token),
  ]);

  appendMyLicenseNotifications(
    notifications,
    officeResult.status === 'fulfilled' ? officeResult.value : null,
    softwareResult.status === 'fulfilled' ? softwareResult.value : [],
  );

  if (showTiAlerts) {
    try {
      const [licensesData, softwareLicensesData, certificatesData] = await Promise.all([
        listOfficeLicenses(token),
        listSoftwareLicenses(token),
        listCertificates(token),
      ]);

      appendTiLicenseNotifications(
        notifications,
        Array.isArray(licensesData) ? licensesData : [],
        Array.isArray(softwareLicensesData) ? softwareLicensesData : [],
        Array.isArray(certificatesData) ? certificatesData : [],
      );
    } catch {
      // Mantém notificações já coletadas do usuário.
    }
  }

  if (showChamadosAdmin) {
    try {
      const chamadosData = await listAdminChamados(token);
      const chamados = Array.isArray(chamadosData) ? chamadosData : [];

      chamados
        .filter((chamado) => chamado.status === 'ABERTO')
        .forEach((chamado) => {
          const notificationId = `chamado-novo-${chamado.id}`;
          if (isNotificationRead(userId, notificationId)) return;

          notifications.push({
            id: notificationId,
            type: 'CHAMADO_NOVO',
            title: 'Novo chamado aberto',
            message: `${chamado.assunto} · ${chamado.email || chamado.solicitanteNome || 'Solicitante'}`,
            href: `/admin/chamados?chamado=${chamado.id}`,
            createdAt: chamado.createdAt,
            priority: 'high',
            chamadoId: chamado.id,
          });
        });

      await appendChamadoReplyNotifications(token, userId, chamados, 'admin', notifications);
    } catch {
      // Ignora falha no módulo admin de chamados.
    }
  }

  try {
    const myChamadosData = await listMyChamados(token);
    await appendChamadoReplyNotifications(
      token,
      userId,
      Array.isArray(myChamadosData) ? myChamadosData : [],
      'user',
      notifications,
    );
  } catch {
    // Ignora falha nos chamados do usuário.
  }

  return notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
