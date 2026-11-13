import {
  DamageTicket,
  SlaComplianceState,
  SlaConfig,
  SlaEvaluation,
  TicketUrgency
} from '../types';

export const DEFAULT_SLA_CONFIG: SlaConfig = {
  Kritis: { frtTargetMinutes: 15, rtTargetHours: 4 },
  Tinggi: { frtTargetMinutes: 30, rtTargetHours: 12 },
  Sedang: { frtTargetMinutes: 60, rtTargetHours: 24 },
  Rendah: { frtTargetMinutes: 120, rtTargetHours: 48 }
};

export const isResolvedTicketStatus = (status: string): boolean =>
  status === 'Resolved' ||
  status === 'Selesai' ||
  status === 'Closed – Auto' ||
  status === 'Closed – Manual' ||
  status === 'Closed';

/**
 * Parses ISO timestamps, YYYY-MM-DD HH:mm, and Indonesian locale dates ("DD/MM/YYYY, HH.MM.SS" or "DD/MM/YYYY HH:MM").
 */
export function parseFlexibleDate(input?: string): Date | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. ISO date/datetime (e.g. 2026-11-07T08:30:00.000Z or 2026-11-07 08:30)
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  // 2. Indonesian format: DD/MM/YYYY with optional time (HH.MM.SS or HH:MM:SS or HH:MM)
  const idMatch = trimmed.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[,\s]+(\d{1,2})[.:](\d{2})(?:[.:](\d{2}))?)?/
  );
  if (idMatch) {
    const day = Number(idMatch[1]);
    const month = Number(idMatch[2]);
    const year = Number(idMatch[3]);
    const hour = Number(idMatch[4] || 0);
    const minute = Number(idMatch[5] || 0);
    const second = Number(idMatch[6] || 0);
    const d = new Date(year, month - 1, day, hour, minute, second);
    if (!Number.isNaN(d.getTime())) return d;
  }

  // 3. Fallback standard Date parsing
  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export function formatMinutesLabel(minutes: number): string {
  const rounded = Math.max(0, Math.round(minutes));
  if (rounded < 60) return `${rounded} mnt`;
  const hrs = Math.floor(rounded / 60);
  const mins = rounded % 60;
  return mins > 0 ? `${hrs} j ${mins} mnt` : `${hrs} jam`;
}

export function formatHoursLabel(hours: number): string {
  if (hours < 1) {
    return `${Math.max(0, Math.round(hours * 60))} mnt`;
  }
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded} jam`;
}

export function getFirstResponseTimestamp(ticket: DamageTicket): Date | null {
  if (ticket.firstResponseAtIso) {
    const parsed = parseFlexibleDate(ticket.firstResponseAtIso);
    if (parsed) return parsed;
  }
  if (ticket.tanggalDitugaskan) {
    const parsed = parseFlexibleDate(ticket.tanggalDitugaskan);
    if (parsed) return parsed;
  }
  if (ticket.riwayatStatus && ticket.riwayatStatus.length > 0) {
    const firstTechnicalEntry = ticket.riwayatStatus.find(
      r =>
        r.status === 'Assigned' ||
        r.status === 'In Progress' ||
        r.status === 'Pending – Menunggu Suku Cadang' ||
        r.status === 'Resolved' ||
        r.status === 'Closed – Manual'
    );
    if (firstTechnicalEntry) {
      const parsed = parseFlexibleDate(firstTechnicalEntry.timestamp);
      if (parsed) return parsed;
    }
  }
  return null;
}

export function getResolvedTimestamp(ticket: DamageTicket): Date | null {
  if (ticket.resolvedAtIso) {
    const parsed = parseFlexibleDate(ticket.resolvedAtIso);
    if (parsed) return parsed;
  }
  if (ticket.resolvedAt) {
    const parsed = parseFlexibleDate(ticket.resolvedAt);
    if (parsed) return parsed;
  }
  if (ticket.waktuSelesai) {
    const parsed = parseFlexibleDate(ticket.waktuSelesai);
    if (parsed) return parsed;
  }
  if (isResolvedTicketStatus(ticket.status) && ticket.riwayatStatus) {
    const resolvedEntry = [...ticket.riwayatStatus]
      .reverse()
      .find(r => isResolvedTicketStatus(r.status));
    if (resolvedEntry) {
      const parsed = parseFlexibleDate(resolvedEntry.timestamp);
      if (parsed) return parsed;
    }
  }
  return null;
}

export function computeSlaEvaluation(
  ticket: DamageTicket,
  config: SlaConfig = DEFAULT_SLA_CONFIG,
  nowMs: number = Date.now()
): SlaEvaluation {
  const urgency: TicketUrgency = (ticket.urgensi || ticket.prioritas || 'Sedang') as TicketUrgency;
  const rule = config[urgency] || DEFAULT_SLA_CONFIG.Sedang;

  const frtTargetMinutes = ticket.frtTargetMinutes ?? rule.frtTargetMinutes;
  const rtTargetHours = ticket.rtTargetHours ?? ticket.slaTargetHours ?? rule.rtTargetHours;

  const createdDate = parseFlexibleDate(ticket.createdAtIso || ticket.tanggalLapor);
  const createdMs = createdDate ? createdDate.getTime() : nowMs;

  const firstRespDate = getFirstResponseTimestamp(ticket);
  const resolvedDate = getResolvedTimestamp(ticket);
  const isResolved = isResolvedTicketStatus(ticket.status);

  // If a ticket is resolved without an explicit intermediate triage timestamp, count first response at resolution time
  const effectiveFirstRespDate = firstRespDate || (isResolved ? resolvedDate : null);
  const hasFirstResponse = Boolean(effectiveFirstRespDate);

  const frtEndMs = effectiveFirstRespDate ? effectiveFirstRespDate.getTime() : nowMs;
  const frtElapsedMinutes = Math.max(0, (frtEndMs - createdMs) / 60000);

  let frtStatus: SlaComplianceState;
  if (hasFirstResponse) {
    frtStatus = frtElapsedMinutes <= frtTargetMinutes ? 'Memenuhi SLA' : 'Melewati SLA';
  } else if (frtElapsedMinutes > frtTargetMinutes) {
    frtStatus = 'Melewati SLA';
  } else if (frtElapsedMinutes >= frtTargetMinutes * 0.75) {
    frtStatus = 'Mendekati Batas';
  } else {
    frtStatus = 'Dalam Batas';
  }

  const deadlineDate = parseFlexibleDate(ticket.slaDeadline);
  const deadlineMs = deadlineDate ? deadlineDate.getTime() : createdMs + rtTargetHours * 3600000;
  const rtEndMs = isResolved && resolvedDate ? resolvedDate.getTime() : nowMs;
  const rtElapsedHours = Math.max(0, (rtEndMs - createdMs) / 3600000);
  const effectiveTargetHours = Math.max(0.1, (deadlineMs - createdMs) / 3600000 || rtTargetHours);

  let rtStatus: SlaComplianceState;
  if (isResolved) {
    rtStatus = rtEndMs <= deadlineMs ? 'Memenuhi SLA' : 'Melewati SLA';
  } else if (nowMs > deadlineMs) {
    rtStatus = 'Melewati SLA';
  } else if ((deadlineMs - nowMs) / 3600000 <= Math.min(4, effectiveTargetHours * 0.25)) {
    rtStatus = 'Mendekati Batas';
  } else {
    rtStatus = 'Dalam Batas';
  }

  let overallSlaStatus: 'On Track' | 'Mendekati Batas' | 'Overdue' = 'On Track';
  if (rtStatus === 'Melewati SLA' || (!hasFirstResponse && frtStatus === 'Melewati SLA')) {
    overallSlaStatus = 'Overdue';
  } else if (rtStatus === 'Mendekati Batas' || frtStatus === 'Mendekati Batas') {
    overallSlaStatus = 'Mendekati Batas';
  }

  const frtLabel = hasFirstResponse
    ? `${formatMinutesLabel(frtElapsedMinutes)} / target ${frtTargetMinutes} mnt`
    : `Berjalan ${formatMinutesLabel(frtElapsedMinutes)} (target ${frtTargetMinutes} mnt)`;

  const rtLabel = isResolved
    ? `${formatHoursLabel(rtElapsedHours)} / target ${rtTargetHours} jam`
    : `Berjalan ${formatHoursLabel(rtElapsedHours)} (target ${rtTargetHours} jam)`;

  return {
    frtTargetMinutes,
    rtTargetHours,
    hasFirstResponse,
    isResolved,
    frtElapsedMinutes,
    rtElapsedHours,
    frtStatus,
    rtStatus,
    overallSlaStatus,
    frtLabel,
    rtLabel
  };
}

export interface AggregateSlaStats {
  totalTickets: number;
  frtComplianceRate: number;
  rtComplianceRate: number;
  avgFrtMinutes: number;
  avgRtHours: number;
  frtOverdueCount: number;
  rtOverdueCount: number;
}

export function computeAggregateSlaStats(
  tickets: DamageTicket[],
  config: SlaConfig = DEFAULT_SLA_CONFIG,
  nowMs: number = Date.now()
): AggregateSlaStats {
  if (tickets.length === 0) {
    return {
      totalTickets: 0,
      frtComplianceRate: 100,
      rtComplianceRate: 100,
      avgFrtMinutes: 0,
      avgRtHours: 0,
      frtOverdueCount: 0,
      rtOverdueCount: 0
    };
  }

  const evals = tickets.map(t => computeSlaEvaluation(t, config, nowMs));

  const responded = evals.filter(e => e.hasFirstResponse);
  const frtMet = responded.filter(e => e.frtStatus === 'Memenuhi SLA');
  const frtComplianceRate =
    responded.length > 0 ? Math.round((frtMet.length / responded.length) * 100) : 100;

  const resolved = evals.filter(e => e.isResolved);
  const rtMet = resolved.filter(e => e.rtStatus === 'Memenuhi SLA');
  const rtComplianceRate =
    resolved.length > 0 ? Math.round((rtMet.length / resolved.length) * 100) : 100;

  const avgFrtMinutes =
    responded.length > 0
      ? Math.round(responded.reduce((sum, e) => sum + e.frtElapsedMinutes, 0) / responded.length)
      : 0;

  const avgRtHours =
    resolved.length > 0
      ? Math.round((resolved.reduce((sum, e) => sum + e.rtElapsedHours, 0) / resolved.length) * 10) / 10
      : 0;

  const frtOverdueCount = evals.filter(e => e.frtStatus === 'Melewati SLA').length;
  const rtOverdueCount = evals.filter(e => e.rtStatus === 'Melewati SLA').length;

  return {
    totalTickets: tickets.length,
    frtComplianceRate,
    rtComplianceRate,
    avgFrtMinutes,
    avgRtHours,
    frtOverdueCount,
    rtOverdueCount
  };
}
