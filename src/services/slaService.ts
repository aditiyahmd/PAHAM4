import {
  AppUser,
  DamageTicket,
  LoanSlaEvaluation,
  LoanTicket,
  ProposalSlaEvaluation,
  ServiceSlaConfig,
  SlaComplianceState,
  SlaConfig,
  SlaEvaluation,
  SlaUrgencyRule,
  SystemProposal,
  TechnicianSlaBreakdown,
  TicketUrgency
} from '../types';

export const NEED_MORE_INFO_AUTO_CLOSE_HOURS = 72; // 3 x 24 jam
export const REOPEN_WINDOW_HOURS = 24; // 1 x 24 jam

export const DEFAULT_SLA_CONFIG: SlaConfig = {
  Kritis: { frtTargetMinutes: 15, rtTargetHours: 4 },
  Tinggi: { frtTargetMinutes: 30, rtTargetHours: 12 },
  Sedang: { frtTargetMinutes: 60, rtTargetHours: 24 },
  Rendah: { frtTargetMinutes: 120, rtTargetHours: 48 },
  Problem: { frtTargetMinutes: 240, rtTargetHours: 336 }, // 14 hari (2 minggu)
  RFC: { frtTargetMinutes: 480, rtTargetHours: 720 } // 30 hari (1 bulan)
};

export const DEFAULT_SERVICE_SLA_CONFIG: ServiceSlaConfig = {
  loan: {
    approvalTargetMinutes: 120, // Target Waktu Persetujuan (Approval Time): 2 jam (120 menit)
    fulfillmentTargetHours: 4 // Target Waktu Penyiapan Barang (Fulfillment Time): 4 jam
  },
  proposal: {
    feasibilityTargetHours: 24, // Target Waktu Tinjauan Kelayakan (Feasibility Study): 24 jam
    brdTargetHours: 72 // Target Waktu Penentuan Spesifikasi Kebutuhan (BRD): 72 jam
  }
};

export const isResolvedTicketStatus = (status: string): boolean =>
  status === 'Resolved' ||
  status === 'Selesai' ||
  status === 'Closed – Auto' ||
  status === 'Closed – Manual' ||
  status === 'Closed';

export const isPausedTicketStatus = (status: string): boolean =>
  status === 'Pending – Menunggu Suku Cadang' ||
  status === 'Pending – Menunggu Vendor Eksternal' ||
  status === 'Need More Info' ||
  status === 'Pending Procurement' ||
  status === 'Menunggu Suku Cadang';

export function getRuleForTicket(
  ticket: Pick<DamageTicket, 'ticketType' | 'urgensi' | 'prioritas'>,
  config: SlaConfig = DEFAULT_SLA_CONFIG
): SlaUrgencyRule {
  if (ticket.ticketType === 'Problem') {
    return config.Problem || DEFAULT_SLA_CONFIG.Problem!;
  }
  if (ticket.ticketType === 'RFC') {
    return config.RFC || DEFAULT_SLA_CONFIG.RFC!;
  }
  const urgency: TicketUrgency = (ticket.urgensi || ticket.prioritas || 'Sedang') as TicketUrgency;
  return config[urgency] || DEFAULT_SLA_CONFIG.Sedang;
}

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
  if (hours >= 72) {
    const days = Math.round((hours / 24) * 10) / 10;
    const roundedHrs = Math.round(hours);
    return `${roundedHrs} jam (${days} hr)`;
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
        r.status === 'Need More Info' ||
        r.status === 'In Progress' ||
        r.status === 'Pending – Menunggu Suku Cadang' ||
        r.status === 'Pending – Menunggu Vendor Eksternal' ||
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

/**
 * 3a: Perhitungan SLA Penyelesaian (RT) hanya dimulai saat Admin memproses tiket baru ke Tahap 2 (Assigned & Urgensi),
 * atau saat tiket sudah berstatus Resolved (fallback untuk data historis/test resolved).
 */
export function getSlaStartTimestamp(ticket: DamageTicket): Date | null {
  if (ticket.slaStartedAtIso) {
    const parsed = parseFlexibleDate(ticket.slaStartedAtIso);
    if (parsed) return parsed;
  }
  if (ticket.tanggalDitugaskan) {
    const parsed = parseFlexibleDate(ticket.tanggalDitugaskan);
    if (parsed) return parsed;
  }
  if (ticket.riwayatStatus && ticket.riwayatStatus.length > 0) {
    const stage2Entry = ticket.riwayatStatus.find(
      r =>
        r.status === 'Assigned' ||
        r.status === 'In Progress' ||
        r.status === 'Pending – Menunggu Suku Cadang' ||
        r.status === 'Pending – Menunggu Vendor Eksternal'
    );
    if (stage2Entry) {
      const parsed = parseFlexibleDate(stage2Entry.timestamp);
      if (parsed) return parsed;
    }
  }
  // Jika belum Tahap 2 tetapi status sudah Assigned/In Progress/Pending/Re-opened/Resolved (data legacy)
  if (
    ticket.status !== 'Open/Unassigned' &&
    ticket.status !== 'Open' &&
    ticket.status !== 'Baru' &&
    ticket.status !== 'Need More Info'
  ) {
    return parseFlexibleDate(ticket.createdAtIso || ticket.tanggalLapor);
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

/**
 * 3e: Cek apakah tiket Need More Info sudah melewati batas 3x24 jam (72 jam) sejak dikembalikan ke pelapor.
 */
export function isNeedMoreInfoExpired(ticket: DamageTicket, nowMs: number = Date.now()): boolean {
  if (ticket.status !== 'Need More Info') return false;
  const startDate = parseFlexibleDate(ticket.needMoreInfoAtIso);
  if (!startDate) return false;
  return nowMs - startDate.getTime() >= NEED_MORE_INFO_AUTO_CLOSE_HOURS * 3600000;
}

/**
 * 3f: Cek apakah pelapor masih berada dalam jendela 1x24 jam (24 jam) untuk membuka kembali tiket berstatus Resolved.
 */
export function canReopenResolvedTicket(ticket: DamageTicket, nowMs: number = Date.now()): boolean {
  if (ticket.status !== 'Resolved') return false;
  const resolvedDate = getResolvedTimestamp(ticket);
  if (!resolvedDate) return true;
  return nowMs - resolvedDate.getTime() <= REOPEN_WINDOW_HOURS * 3600000;
}

export function computeSlaEvaluation(
  ticket: DamageTicket,
  config: SlaConfig = DEFAULT_SLA_CONFIG,
  nowMs: number = Date.now()
): SlaEvaluation {
  const rule = getRuleForTicket(ticket, config);

  const frtTargetMinutes = ticket.frtTargetMinutes ?? rule.frtTargetMinutes;
  const rtTargetHours = ticket.rtTargetHours ?? ticket.slaTargetHours ?? rule.rtTargetHours;

  const createdDate = parseFlexibleDate(ticket.createdAtIso || ticket.tanggalLapor);
  const createdMs = createdDate ? createdDate.getTime() : nowMs;

  const firstRespDate = getFirstResponseTimestamp(ticket);
  const resolvedDate = getResolvedTimestamp(ticket);
  const isResolved = isResolvedTicketStatus(ticket.status);

  // FRT evaluation: diukur sejak tiket dibuat hingga respons pertama Admin/Teknisi
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

  const frtLabel = hasFirstResponse
    ? `${formatMinutesLabel(frtElapsedMinutes)} / target ${frtTargetMinutes} mnt`
    : `Berjalan ${formatMinutesLabel(frtElapsedMinutes)} (target ${frtTargetMinutes} mnt)`;

  // RT evaluation (3a): Hanya mulai saat Tahap 2 (Assigned) atau saat tiket sudah Resolved
  const slaStartDate = getSlaStartTimestamp(ticket);
  const isRtStarted = Boolean(slaStartDate);
  const isPaused = !isResolved && (Boolean(ticket.slaPausedAtIso) || isPausedTicketStatus(ticket.status));

  const accumulatedPauseMs = Math.max(0, ticket.slaPausedTotalMs || 0);
  const pausedAtDate = parseFlexibleDate(ticket.slaPausedAtIso);
  const currentActivePauseMs =
    isPaused && pausedAtDate ? Math.max(0, nowMs - pausedAtDate.getTime()) : 0;
  const pausedTotalMs = accumulatedPauseMs + currentActivePauseMs;
  const pausedTotalMinutes = Math.round(pausedTotalMs / 60000);

  if (!isRtStarted) {
    const waitingReason =
      ticket.status === 'Need More Info'
        ? 'Terjeda (Menunggu Info Pelapor)'
        : 'Menunggu Tahap 2';

    const overallWaiting: 'On Track' | 'Mendekati Batas' | 'Overdue' =
      !hasFirstResponse && frtStatus === 'Melewati SLA'
        ? 'Overdue'
        : frtStatus === 'Mendekati Batas'
        ? 'Mendekati Batas'
        : 'On Track';

    return {
      frtTargetMinutes,
      rtTargetHours,
      hasFirstResponse,
      isRtStarted: false,
      isPaused: ticket.status === 'Need More Info',
      pauseReason: ticket.status === 'Need More Info' ? 'Need More Info (Auto-Close 3x24 Jam)' : undefined,
      pausedTotalMinutes,
      isResolved,
      frtElapsedMinutes,
      rtElapsedHours: 0,
      frtStatus,
      rtStatus: ticket.status === 'Need More Info' ? 'Terjeda (Paused)' : 'Menunggu Tahap 2',
      overallSlaStatus: overallWaiting,
      frtLabel,
      rtLabel: `${waitingReason} · target ${formatHoursLabel(rtTargetHours)}`
    };
  }

  const rtStartMs = slaStartDate!.getTime();
  const rtEndMs = isResolved && resolvedDate ? resolvedDate.getTime() : nowMs;
  const effectiveElapsedMs = Math.max(0, rtEndMs - rtStartMs - pausedTotalMs);
  const rtElapsedHours = effectiveElapsedMs / 3600000;

  const deadlineDate = parseFlexibleDate(ticket.slaDeadline);
  // Batas akhir efektif berdasarkan durasi kerja bersih (atau slaDeadline yang sudah digeser saat resume)
  const expectedNetDeadlineMs = rtStartMs + rtTargetHours * 3600000 + pausedTotalMs;
  const deadlineMs = deadlineDate
    ? Math.max(deadlineDate.getTime() + currentActivePauseMs, expectedNetDeadlineMs)
    : expectedNetDeadlineMs;

  let rtStatus: SlaComplianceState;
  if (isResolved) {
    rtStatus = rtElapsedHours <= rtTargetHours ? 'Memenuhi SLA' : 'Melewati SLA';
  } else if (isPaused) {
    rtStatus = 'Terjeda (Paused)';
  } else if (rtElapsedHours > rtTargetHours || nowMs > deadlineMs) {
    rtStatus = 'Melewati SLA';
  } else if (rtTargetHours - rtElapsedHours <= Math.min(4, rtTargetHours * 0.25)) {
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

  const rtLabel = isResolved
    ? `${formatHoursLabel(rtElapsedHours)} / target ${formatHoursLabel(rtTargetHours)}`
    : isPaused
    ? `Jeda pada ${formatHoursLabel(rtElapsedHours)} (target ${formatHoursLabel(rtTargetHours)})`
    : `Berjalan ${formatHoursLabel(rtElapsedHours)} (target ${formatHoursLabel(rtTargetHours)})`;

  return {
    frtTargetMinutes,
    rtTargetHours,
    hasFirstResponse,
    isRtStarted: true,
    isPaused,
    pauseReason: ticket.slaPauseReason,
    pausedTotalMinutes,
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
  pausedCount: number;
  waitingStage2Count: number;
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
      rtOverdueCount: 0,
      pausedCount: 0,
      waitingStage2Count: 0
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
  const rtOverdueCount = evals.filter(e => e.isRtStarted && e.rtStatus === 'Melewati SLA').length;
  const pausedCount = evals.filter(e => e.isPaused).length;
  const waitingStage2Count = evals.filter(e => !e.isRtStarted && !e.isResolved).length;

  return {
    totalTickets: tickets.length,
    frtComplianceRate,
    rtComplianceRate,
    avgFrtMinutes,
    avgRtHours,
    frtOverdueCount,
    rtOverdueCount,
    pausedCount,
    waitingStage2Count
  };
}

/**
 * Filter tickets belonging to a technician (matching ID, roleName, or delegation).
 */
export function filterTicketsForTechnician(tickets: DamageTicket[], tech: Pick<AppUser, 'id' | 'nama' | 'roleName'>): DamageTicket[] {
  return tickets.filter(
    t =>
      t.assignedTechnicianId === tech.id ||
      t.picTeknisi === tech.roleName ||
      (t.delegasiDari && tech.nama && t.delegasiDari.includes(tech.nama))
  );
}

/**
 * Computes individual SLA scorecards across all PUSDATIN technicians.
 */
export function computeTechnicianSlaBreakdown(
  tickets: DamageTicket[],
  technicians: AppUser[],
  config: SlaConfig = DEFAULT_SLA_CONFIG,
  nowMs: number = Date.now()
): TechnicianSlaBreakdown[] {
  const activeTechs = technicians.filter(u => u.role !== 'ACT-01' && u.role !== 'ACT-10');

  return activeTechs.map(tech => {
    const mine = filterTicketsForTechnician(tickets, tech);
    const agg = computeAggregateSlaStats(mine, config, nowMs);

    const openCount = mine.filter(
      t =>
        t.status === 'Open/Unassigned' ||
        (t.status as string) === 'Open' ||
        (t.status as string) === 'Baru' ||
        t.status === 'Re-opened' ||
        t.status === 'Need More Info'
    ).length;

    const inProgressCount = mine.filter(
      t =>
        t.status === 'Assigned' ||
        (t.status as string) === 'Diterima' ||
        t.status === 'In Progress' ||
        (t.status as string) === 'Perbaikan'
    ).length;

    const resolvedCount = mine.filter(t => isResolvedTicketStatus(t.status)).length;

    return {
      technicianId: tech.id,
      technicianName: tech.nama,
      roleName: tech.roleName,
      actorCode: tech.role,
      totalTickets: mine.length,
      openCount,
      inProgressCount,
      pausedCount: agg.pausedCount,
      resolvedCount,
      frtComplianceRate: agg.frtComplianceRate,
      rtComplianceRate: agg.rtComplianceRate,
      avgFrtMinutes: agg.avgFrtMinutes,
      avgRtHours: agg.avgRtHours,
      frtOverdueCount: agg.frtOverdueCount,
      rtOverdueCount: agg.rtOverdueCount,
      waitingStage2Count: agg.waitingStage2Count
    };
  });
}

// --- 4a. ITIL SERVICE REQUEST SLA: PEMINJAMAN ASET IT (APPROVAL TIME & FULFILLMENT TIME) ---
export function computeLoanSlaEvaluation(
  loan: LoanTicket,
  config: ServiceSlaConfig = DEFAULT_SERVICE_SLA_CONFIG,
  nowMs: number = Date.now()
): LoanSlaEvaluation {
  const approvalTargetMinutes = loan.approvalTargetMinutes ?? config.loan.approvalTargetMinutes;
  const fulfillmentTargetHours = loan.fulfillmentTargetHours ?? config.loan.fulfillmentTargetHours;

  const createdDate = parseFlexibleDate(loan.createdAtIso || loan.tglAju || loan.tglPinjam);
  const createdMs = createdDate ? createdDate.getTime() : nowMs;

  const isRejected = loan.status === 'Ditolak';
  const isFulfilled =
    Boolean(loan.fulfilledAtIso) ||
    loan.status === 'Diserahkan' ||
    (loan.status as string) === 'Disetujui' ||
    loan.status === 'Terlambat' ||
    loan.status === 'Dikembalikan' ||
    (loan.status as string) === 'Diterima Kembali' ||
    loan.status === 'Ditutup';

  const isApproved =
    isFulfilled ||
    isRejected ||
    Boolean(loan.approvedAtIso) ||
    loan.status === 'Dikonfirmasi' ||
    (loan.status as string) === 'Diterima';

  const approvedDate = parseFlexibleDate(loan.approvedAtIso || loan.fulfilledAtIso);
  const fulfilledDate = parseFlexibleDate(loan.fulfilledAtIso);

  const approvalEndMs = isApproved
    ? approvedDate
      ? approvedDate.getTime()
      : createdMs
    : nowMs;
  const approvalElapsedMinutes = Math.max(0, Math.round((approvalEndMs - createdMs) / 60000));

  let approvalStatus: LoanSlaEvaluation['approvalStatus'];
  if (isApproved) {
    approvalStatus = approvalElapsedMinutes <= approvalTargetMinutes ? 'Memenuhi SLA' : 'Melewati SLA';
  } else if (approvalElapsedMinutes > approvalTargetMinutes) {
    approvalStatus = 'Melewati SLA';
  } else if (approvalTargetMinutes - approvalElapsedMinutes <= Math.max(15, approvalTargetMinutes * 0.25)) {
    approvalStatus = 'Mendekati Batas';
  } else {
    approvalStatus = 'Dalam Batas';
  }

  let fulfillmentElapsedHours = 0;
  let fulfillmentStatus: LoanSlaEvaluation['fulfillmentStatus'];

  if (isRejected) {
    fulfillmentStatus = 'N/A (Ditolak)';
  } else {
    const fulfillEndMs = isFulfilled
      ? fulfilledDate
        ? fulfilledDate.getTime()
        : approvedDate
        ? approvedDate.getTime()
        : createdMs
      : nowMs;
    fulfillmentElapsedHours = Math.max(0, (fulfillEndMs - createdMs) / 3600000);

    if (isFulfilled) {
      fulfillmentStatus = fulfillmentElapsedHours <= fulfillmentTargetHours ? 'Memenuhi SLA' : 'Melewati SLA';
    } else if (fulfillmentElapsedHours > fulfillmentTargetHours) {
      fulfillmentStatus = 'Melewati SLA';
    } else if (fulfillmentTargetHours - fulfillmentElapsedHours <= Math.max(1, fulfillmentTargetHours * 0.25)) {
      fulfillmentStatus = 'Mendekati Batas';
    } else {
      fulfillmentStatus = 'Dalam Batas';
    }
  }

  let overallStatus: LoanSlaEvaluation['overallStatus'] = 'On Track';
  if (approvalStatus === 'Melewati SLA' || fulfillmentStatus === 'Melewati SLA') {
    overallStatus = 'Overdue';
  } else if (approvalStatus === 'Mendekati Batas' || fulfillmentStatus === 'Mendekati Batas') {
    overallStatus = 'Mendekati Batas';
  }

  const approvalLabel = isApproved
    ? `${formatMinutesLabel(approvalElapsedMinutes)} / target ${formatMinutesLabel(approvalTargetMinutes)}`
    : `Berjalan ${formatMinutesLabel(approvalElapsedMinutes)} (target ${formatMinutesLabel(approvalTargetMinutes)})`;

  const fulfillmentLabel = isRejected
    ? 'Ditolak pada tahap verifikasi'
    : isFulfilled
    ? `${formatHoursLabel(fulfillmentElapsedHours)} / target ${formatHoursLabel(fulfillmentTargetHours)}`
    : `Berjalan ${formatHoursLabel(fulfillmentElapsedHours)} (target ${formatHoursLabel(fulfillmentTargetHours)})`;

  return {
    approvalTargetMinutes,
    fulfillmentTargetHours,
    isApproved,
    isFulfilled,
    isRejected,
    approvalElapsedMinutes,
    fulfillmentElapsedHours,
    approvalStatus,
    fulfillmentStatus,
    overallStatus,
    approvalLabel,
    fulfillmentLabel
  };
}

export interface AggregateLoanSlaStats {
  totalLoans: number;
  approvalComplianceRate: number;
  fulfillmentComplianceRate: number;
  avgApprovalMinutes: number;
  avgFulfillmentHours: number;
  pendingApprovalCount: number;
  pendingFulfillmentCount: number;
  overdueCount: number;
}

export function computeAggregateLoanSlaStats(
  loans: LoanTicket[],
  config: ServiceSlaConfig = DEFAULT_SERVICE_SLA_CONFIG,
  nowMs: number = Date.now()
): AggregateLoanSlaStats {
  if (loans.length === 0) {
    return {
      totalLoans: 0,
      approvalComplianceRate: 100,
      fulfillmentComplianceRate: 100,
      avgApprovalMinutes: 0,
      avgFulfillmentHours: 0,
      pendingApprovalCount: 0,
      pendingFulfillmentCount: 0,
      overdueCount: 0
    };
  }

  const evals = loans.map(l => computeLoanSlaEvaluation(l, config, nowMs));
  const approvedList = evals.filter(e => e.isApproved);
  const approvalMet = approvedList.filter(e => e.approvalStatus === 'Memenuhi SLA');
  const approvalComplianceRate =
    approvedList.length > 0 ? Math.round((approvalMet.length / approvedList.length) * 100) : 100;

  const fulfilledList = evals.filter(e => e.isFulfilled && !e.isRejected);
  const fulfillMet = fulfilledList.filter(e => e.fulfillmentStatus === 'Memenuhi SLA');
  const fulfillmentComplianceRate =
    fulfilledList.length > 0 ? Math.round((fulfillMet.length / fulfilledList.length) * 100) : 100;

  const avgApprovalMinutes =
    approvedList.length > 0
      ? Math.round(approvedList.reduce((sum, e) => sum + e.approvalElapsedMinutes, 0) / approvedList.length)
      : 0;

  const avgFulfillmentHours =
    fulfilledList.length > 0
      ? Math.round((fulfilledList.reduce((sum, e) => sum + e.fulfillmentElapsedHours, 0) / fulfilledList.length) * 10) / 10
      : 0;

  const pendingApprovalCount = evals.filter(e => !e.isApproved).length;
  const pendingFulfillmentCount = evals.filter(e => e.isApproved && !e.isFulfilled && !e.isRejected).length;
  const overdueCount = evals.filter(e => e.overallStatus === 'Overdue').length;

  return {
    totalLoans: loans.length,
    approvalComplianceRate,
    fulfillmentComplianceRate,
    avgApprovalMinutes,
    avgFulfillmentHours,
    pendingApprovalCount,
    pendingFulfillmentCount,
    overdueCount
  };
}

// --- 4b. ITIL INITIAL RESPONSE & ANALYSIS SLA: PENGAJUAN SISTEM BARU (FEASIBILITY & BRD) ---
export function computeProposalSlaEvaluation(
  proposal: SystemProposal,
  config: ServiceSlaConfig = DEFAULT_SERVICE_SLA_CONFIG,
  nowMs: number = Date.now()
): ProposalSlaEvaluation {
  const feasibilityTargetHours = proposal.feasibilityTargetHours ?? config.proposal.feasibilityTargetHours;
  const brdTargetHours = proposal.brdTargetHours ?? config.proposal.brdTargetHours;

  const createdDate = parseFlexibleDate(proposal.createdAtIso || proposal.tanggalPengajuan);
  const createdMs = createdDate ? createdDate.getTime() : nowMs;

  const isFeasibilityDone = Boolean(proposal.verifiedAtIso || proposal.verifikasiAdmin);
  const verifiedDate = parseFlexibleDate(proposal.verifiedAtIso || proposal.verifikasiAdmin?.tanggal);
  const feasibilityEndMs = isFeasibilityDone
    ? verifiedDate
      ? verifiedDate.getTime()
      : createdMs
    : nowMs;
  const feasibilityElapsedHours = Math.max(0, (feasibilityEndMs - createdMs) / 3600000);

  let feasibilityStatus: ProposalSlaEvaluation['feasibilityStatus'];
  if (isFeasibilityDone) {
    feasibilityStatus = feasibilityElapsedHours <= feasibilityTargetHours ? 'Memenuhi SLA' : 'Melewati SLA';
  } else if (feasibilityElapsedHours > feasibilityTargetHours) {
    feasibilityStatus = 'Melewati SLA';
  } else if (feasibilityTargetHours - feasibilityElapsedHours <= Math.max(4, feasibilityTargetHours * 0.25)) {
    feasibilityStatus = 'Mendekati Batas';
  } else {
    feasibilityStatus = 'Dalam Batas';
  }

  const isBrdStarted = isFeasibilityDone;
  const isBrdDone = Boolean(proposal.brdCompletedAtIso || proposal.analisisKebutuhan);
  const brdStartMs = verifiedDate ? verifiedDate.getTime() : createdMs;
  const brdDoneDate = parseFlexibleDate(proposal.brdCompletedAtIso || proposal.analisisKebutuhan?.tanggal);

  let brdElapsedHours = 0;
  let brdStatus: ProposalSlaEvaluation['brdStatus'];

  if (!isBrdStarted) {
    brdStatus = 'Menunggu Tahap 1';
  } else {
    const brdEndMs = isBrdDone
      ? brdDoneDate
        ? brdDoneDate.getTime()
        : brdStartMs
      : nowMs;
    brdElapsedHours = Math.max(0, (brdEndMs - brdStartMs) / 3600000);

    if (isBrdDone) {
      brdStatus = brdElapsedHours <= brdTargetHours ? 'Memenuhi SLA' : 'Melewati SLA';
    } else if (brdElapsedHours > brdTargetHours) {
      brdStatus = 'Melewati SLA';
    } else if (brdTargetHours - brdElapsedHours <= Math.max(12, brdTargetHours * 0.25)) {
      brdStatus = 'Mendekati Batas';
    } else {
      brdStatus = 'Dalam Batas';
    }
  }

  let overallStatus: ProposalSlaEvaluation['overallStatus'] = 'On Track';
  if (feasibilityStatus === 'Melewati SLA' || brdStatus === 'Melewati SLA') {
    overallStatus = 'Overdue';
  } else if (feasibilityStatus === 'Mendekati Batas' || brdStatus === 'Mendekati Batas') {
    overallStatus = 'Mendekati Batas';
  }

  const feasibilityLabel = isFeasibilityDone
    ? `${formatHoursLabel(feasibilityElapsedHours)} / target ${formatHoursLabel(feasibilityTargetHours)}`
    : `Berjalan ${formatHoursLabel(feasibilityElapsedHours)} (target ${formatHoursLabel(feasibilityTargetHours)})`;

  const brdLabel = !isBrdStarted
    ? `Menunggu Verifikasi Kelayakan (target ${formatHoursLabel(brdTargetHours)})`
    : isBrdDone
    ? `${formatHoursLabel(brdElapsedHours)} / target ${formatHoursLabel(brdTargetHours)}`
    : `Berjalan ${formatHoursLabel(brdElapsedHours)} (target ${formatHoursLabel(brdTargetHours)})`;

  return {
    feasibilityTargetHours,
    brdTargetHours,
    isFeasibilityDone,
    isBrdStarted,
    isBrdDone,
    feasibilityElapsedHours,
    brdElapsedHours,
    feasibilityStatus,
    brdStatus,
    overallStatus,
    feasibilityLabel,
    brdLabel
  };
}

export interface AggregateProposalSlaStats {
  totalProposals: number;
  feasibilityComplianceRate: number;
  brdComplianceRate: number;
  avgFeasibilityHours: number;
  avgBrdHours: number;
  waitingFeasibilityCount: number;
  waitingBrdCount: number;
  overdueCount: number;
}

export function computeAggregateProposalSlaStats(
  proposals: SystemProposal[],
  config: ServiceSlaConfig = DEFAULT_SERVICE_SLA_CONFIG,
  nowMs: number = Date.now()
): AggregateProposalSlaStats {
  if (proposals.length === 0) {
    return {
      totalProposals: 0,
      feasibilityComplianceRate: 100,
      brdComplianceRate: 100,
      avgFeasibilityHours: 0,
      avgBrdHours: 0,
      waitingFeasibilityCount: 0,
      waitingBrdCount: 0,
      overdueCount: 0
    };
  }

  const evals = proposals.map(p => computeProposalSlaEvaluation(p, config, nowMs));
  const feasDone = evals.filter(e => e.isFeasibilityDone);
  const feasMet = feasDone.filter(e => e.feasibilityStatus === 'Memenuhi SLA');
  const feasibilityComplianceRate =
    feasDone.length > 0 ? Math.round((feasMet.length / feasDone.length) * 100) : 100;

  const brdDone = evals.filter(e => e.isBrdDone);
  const brdMet = brdDone.filter(e => e.brdStatus === 'Memenuhi SLA');
  const brdComplianceRate =
    brdDone.length > 0 ? Math.round((brdMet.length / brdDone.length) * 100) : 100;

  const avgFeasibilityHours =
    feasDone.length > 0
      ? Math.round((feasDone.reduce((s, e) => s + e.feasibilityElapsedHours, 0) / feasDone.length) * 10) / 10
      : 0;

  const avgBrdHours =
    brdDone.length > 0
      ? Math.round((brdDone.reduce((s, e) => s + e.brdElapsedHours, 0) / brdDone.length) * 10) / 10
      : 0;

  const waitingFeasibilityCount = evals.filter(e => !e.isFeasibilityDone).length;
  const waitingBrdCount = evals.filter(e => e.isFeasibilityDone && !e.isBrdDone).length;
  const overdueCount = evals.filter(e => e.overallStatus === 'Overdue').length;

  return {
    totalProposals: proposals.length,
    feasibilityComplianceRate,
    brdComplianceRate,
    avgFeasibilityHours,
    avgBrdHours,
    waitingFeasibilityCount,
    waitingBrdCount,
    overdueCount
  };
}

