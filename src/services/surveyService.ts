import {
  DamageTicket,
  LoanTicket,
  SurveyModuleType,
  SurveyQuestionDefinition,
  SurveyResponse,
  SystemProposal
} from '../types';

export interface LikertOption {
  score: 1 | 2 | 3 | 4 | 5;
  emoji: string;
  label: string;
  shortLabel: string;
}

export const LIKERT_SCALE_OPTIONS: LikertOption[] = [
  { score: 1, emoji: '😡', label: '1 = Sangat Tidak Puas / Sangat Buruk', shortLabel: 'Sangat Buruk' },
  { score: 2, emoji: '😟', label: '2 = Tidak Puas / Kurang Baik', shortLabel: 'Kurang Baik' },
  { score: 3, emoji: '😐', label: '3 = Cukup / Netral', shortLabel: 'Cukup' },
  { score: 4, emoji: '🙂', label: '4 = Puas / Baik', shortLabel: 'Baik' },
  { score: 5, emoji: '😍', label: '5 = Sangat Puas / Sangat Baik', shortLabel: 'Sangat Baik' }
];

export interface ModuleSurveySchema {
  moduleType: SurveyModuleType;
  title: string;
  subtitle: string;
  triggerDescription: string;
  questions: SurveyQuestionDefinition[];
  textQuestion: string;
  textPlaceholder: string;
}

export const SURVEY_SCHEMAS: Record<SurveyModuleType, ModuleSurveySchema> = {
  Incident: {
    moduleType: 'Incident',
    title: 'Survei Kepuasan Laporan Kerusakan (Incident Management)',
    subtitle: 'Instrumen Continual Improvement ITIL setelah tiket perbaikan selesai ditangani',
    triggerDescription: 'Otomatis muncul setelah status tiket menjadi Resolved / Closed',
    questions: [
      {
        key: 'q1',
        label: 'Kecepatan Respons & Penyelesaian',
        question: 'Seberapa puas Anda dengan kecepatan respons dan penyelesaian masalah oleh tim IT?'
      },
      {
        key: 'q2',
        label: 'Ketepatan Solusi Teknisi',
        question: 'Apakah solusi yang diberikan oleh teknisi benar-benar menyelesaikan masalah Anda dengan tepat?'
      },
      {
        key: 'q3',
        label: 'Keramahan & Komunikasi',
        question: 'Seberapa puas Anda dengan keramahan dan kejelasan komunikasi dari teknisi kami?'
      }
    ],
    textQuestion: 'Adakah saran untuk meningkatkan layanan perbaikan kami?',
    textPlaceholder: 'Tuliskan saran atau catatan Anda mengenai layanan perbaikan ini...'
  },
  Loan: {
    moduleType: 'Loan',
    title: 'Survei Kepuasan Peminjaman Aset IT (Service Request)',
    subtitle: 'Evaluasi pengalaman pengguna setelah aset selesai digunakan dan dikembalikan',
    triggerDescription: 'Otomatis muncul setelah status peminjaman menjadi Dikembalikan',
    questions: [
      {
        key: 'q1',
        label: 'Kondisi & Kelayakan Aset IT',
        question: 'Bagaimana kondisi dan kelayakan aset IT (laptop/proyektor/dsb) yang Anda pinjam?'
      },
      {
        key: 'q2',
        label: 'Kemudahan Proses Pengajuan',
        question: 'Seberapa mudah dan lancar proses pengajuan peminjaman melalui sistem ini?'
      },
      {
        key: 'q3',
        label: 'Kecepatan Persetujuan & Serah Terima',
        question: 'Seberapa cepat tim PUSDATIN memproses persetujuan (approval) dan serah-terima peminjaman Anda?'
      }
    ],
    textQuestion: 'Apa yang bisa kami perbaiki dari layanan peminjaman aset ini?',
    textPlaceholder: 'Tuliskan masukan mengenai kelengkapan perangkat, prosedur pengambilan, atau jadwal...'
  },
  SystemProposal: {
    moduleType: 'SystemProposal',
    title: 'Survei Evaluasi Pasca-Implementasi Sistem Baru',
    subtitle: 'Evaluasi kepuasan & adopsi pengguna (1–3 bulan pasca go-live sistem baru)',
    triggerDescription: 'Tersedia untuk sistem baru yang telah Selesai / Serah Terima (Go-Live)',
    questions: [
      {
        key: 'q1',
        label: 'Kemudahan Antarmuka (UI/UX)',
        question: 'Seberapa mudah antarmuka (UI/UX) sistem baru ini digunakan untuk pekerjaan Anda sehari-hari?'
      },
      {
        key: 'q2',
        label: 'Stabilitas & Kesesuaian Fitur',
        question: 'Apakah fitur-fitur pada sistem baru ini dapat beroperasi dengan stabil dan sesuai dengan kebutuhan operasional Anda?'
      },
      {
        key: 'q3',
        label: 'Panduan & Dukungan Adaptasi Tim IT',
        question: 'Seberapa terbantu Anda dengan panduan (manual/tutorial) atau dukungan tim IT saat beradaptasi dengan sistem baru ini?'
      }
    ],
    textQuestion: 'Fitur tambahan apa yang paling Anda harapkan ada di pembaruan sistem berikutnya?',
    textPlaceholder: 'Tuliskan usulan penyempurnaan atau fitur tambahan untuk rilis berikutnya...'
  }
};

export function getModuleLabel(moduleType: SurveyModuleType): string {
  if (moduleType === 'Incident') return 'Laporan Kerusakan';
  if (moduleType === 'Loan') return 'Peminjaman Aset IT';
  return 'Pasca-Implementasi Sistem';
}

export function isDamageEligibleForSurvey(ticket: Pick<DamageTicket, 'status'>): boolean {
  const st = ticket.status;
  return (
    st === 'Resolved' ||
    st === 'Closed – Auto' ||
    st === 'Closed – Manual' ||
    (st as string) === 'Closed' ||
    (st as string) === 'Selesai'
  );
}

export function isLoanEligibleForSurvey(loan: Pick<LoanTicket, 'status'>): boolean {
  const st = loan.status;
  return st === 'Dikembalikan' || (st as string) === 'Diterima Kembali' || st === 'Ditutup';
}

export function isProposalEligibleForSurvey(proposal: Pick<SystemProposal, 'status'>): boolean {
  return proposal.status === 'Selesai' || proposal.status === 'Serah Terima';
}

export function computeSurveyAverageScore(ratings: { q1: number; q2: number; q3: number }): number {
  const avg = (Number(ratings.q1) + Number(ratings.q2) + Number(ratings.q3)) / 3;
  return Math.round(avg * 100) / 100;
}

export function getEmojiForScore(score: number): string {
  const rounded = Math.min(5, Math.max(1, Math.round(score)));
  return LIKERT_SCALE_OPTIONS.find(o => o.score === rounded)?.emoji || '🙂';
}

export interface AggregateSurveyStats {
  totalResponses: number;
  overallAverage: number;
  csatPercentage: number; // % of respondents with averageScore >= 4.0
  byModule: Record<
    SurveyModuleType,
    {
      count: number;
      avgScore: number;
      q1Avg: number;
      q2Avg: number;
      q3Avg: number;
    }
  >;
}

export function computeAggregateSurveyStats(surveys: SurveyResponse[]): AggregateSurveyStats {
  const calcMod = (list: SurveyResponse[]) => {
    if (list.length === 0) {
      return { count: 0, avgScore: 0, q1Avg: 0, q2Avg: 0, q3Avg: 0 };
    }
    const round2 = (n: number) => Math.round(n * 100) / 100;
    return {
      count: list.length,
      avgScore: round2(list.reduce((s, r) => s + r.averageScore, 0) / list.length),
      q1Avg: round2(list.reduce((s, r) => s + r.ratings.q1, 0) / list.length),
      q2Avg: round2(list.reduce((s, r) => s + r.ratings.q2, 0) / list.length),
      q3Avg: round2(list.reduce((s, r) => s + r.ratings.q3, 0) / list.length)
    };
  };

  const incidents = surveys.filter(s => s.moduleType === 'Incident');
  const loans = surveys.filter(s => s.moduleType === 'Loan');
  const proposals = surveys.filter(s => s.moduleType === 'SystemProposal');

  const overallAverage =
    surveys.length > 0
      ? Math.round((surveys.reduce((s, r) => s + r.averageScore, 0) / surveys.length) * 100) / 100
      : 0;
  const satisfiedCount = surveys.filter(s => s.averageScore >= 4).length;
  const csatPercentage =
    surveys.length > 0 ? Math.round((satisfiedCount / surveys.length) * 100) : 0;

  return {
    totalResponses: surveys.length,
    overallAverage,
    csatPercentage,
    byModule: {
      Incident: calcMod(incidents),
      Loan: calcMod(loans),
      SystemProposal: calcMod(proposals)
    }
  };
}

export function filterSurveysByMonthAndModule(
  surveys: SurveyResponse[],
  monthKey: string,
  moduleFilter: 'Semua' | SurveyModuleType
): SurveyResponse[] {
  return surveys.filter(s => {
    const matchesMonth = !monthKey || monthKey === 'Semua' || s.monthKey === monthKey;
    const matchesModule = moduleFilter === 'Semua' || s.moduleType === moduleFilter;
    return matchesMonth && matchesModule;
  });
}
