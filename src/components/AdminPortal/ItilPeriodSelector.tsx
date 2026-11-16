import React from 'react';
import { Calendar } from 'lucide-react';
import {
  getAvailablePeriodKeys,
  getStandardPeriodLabel,
  ITIL_REPORT_CATALOG,
  ReportingCadence
} from '../../services/reportGovernanceService';

interface ItilPeriodSelectorProps {
  menuId: keyof typeof ITIL_REPORT_CATALOG;
  dates: (string | undefined)[];
  cadence: ReportingCadence;
  periodKey: string;
  onChangeCadence: (cadence: ReportingCadence) => void;
  onChangePeriodKey: (key: string) => void;
}

export const ItilPeriodSelector: React.FC<ItilPeriodSelectorProps> = ({
  menuId,
  dates,
  cadence,
  periodKey,
  onChangeCadence,
  onChangePeriodKey
}) => {
  const spec = ITIL_REPORT_CATALOG[menuId];
  const keys = cadence === 'semua' ? [] : getAvailablePeriodKeys(dates, cadence);

  const handleSelectCadence = (next: ReportingCadence) => {
    onChangeCadence(next);
    if (next === 'semua') {
      onChangePeriodKey('');
      return;
    }
    const nextKeys = getAvailablePeriodKeys(dates, next);
    onChangePeriodKey(nextKeys[0] || '');
  };

  return (
    <div
      data-testid={`itil-period-bar-${menuId}`}
      className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
    >
      <div className="min-w-0">
        {spec && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
            <span className="font-semibold text-slate-900">{spec.itilReportTitle}</span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span className="text-slate-600">{spec.standardCadence}</span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span className="text-slate-500">Format: {spec.preferredFormats.join(' / ')}</span>
          </div>
        )}
        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
          Periode Aktif: <strong className="text-slate-800">{getStandardPeriodLabel(cadence, periodKey)}</strong>
          {spec ? ` — ${spec.audience}` : ''}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {(
            [
              { id: 'semua', label: 'Semua' },
              { id: 'bulanan', label: 'Bulanan' },
              { id: 'triwulanan', label: 'Triwulan' },
              { id: 'semesteran', label: 'Semester' },
              { id: 'tahunan', label: 'Tahunan' }
            ] as { id: ReportingCadence; label: string }[]
          ).map(opt => (
            <button
              key={opt.id}
              type="button"
              data-testid={`cadence-${menuId}-${opt.id}`}
              onClick={() => handleSelectCadence(opt.id)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                cadence === opt.id
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {cadence !== 'semua' && keys.length > 0 && (
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              data-testid={`period-key-${menuId}`}
              value={periodKey || keys[0]}
              onChange={e => onChangePeriodKey(e.target.value)}
              className="bg-transparent text-xs font-mono font-semibold text-slate-900 outline-none cursor-pointer"
            >
              {keys.map(k => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
