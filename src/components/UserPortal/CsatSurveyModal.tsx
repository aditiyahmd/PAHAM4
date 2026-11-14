import React, { useState } from 'react';
import { Star, CheckCircle2, Sparkles, X, Send, AlertCircle } from 'lucide-react';
import { AppDatabase } from '../../services/db';
import { SurveyModuleType, SurveyResponse } from '../../types';
import {
  LIKERT_SCALE_OPTIONS,
  SURVEY_SCHEMAS,
  getModuleLabel
} from '../../services/surveyService';

interface CsatSurveyModalProps {
  isOpen: boolean;
  moduleType: SurveyModuleType;
  entityId: string;
  entityTitle: string;
  technicianOrPic?: string;
  defaultRespondentName?: string;
  defaultRespondentUnit?: string;
  onClose: () => void;
  onSubmitted: (survey: SurveyResponse) => void;
}

export const CsatSurveyModal: React.FC<CsatSurveyModalProps> = ({
  isOpen,
  moduleType,
  entityId,
  entityTitle,
  technicianOrPic,
  defaultRespondentName,
  defaultRespondentUnit,
  onClose,
  onSubmitted
}) => {
  const activeUser = AppDatabase.getActiveUser();
  const schema = SURVEY_SCHEMAS[moduleType];

  const [ratings, setRatings] = useState<{ q1: number; q2: number; q3: number }>({
    q1: 0,
    q2: 0,
    q3: 0
  });
  const [feedbackText, setFeedbackText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratings.q1 || !ratings.q2 || !ratings.q3) {
      setErrorMsg('Harap pilih penilaian skala 1–5 untuk seluruh pertanyaan kepuasan di atas.');
      return;
    }
    setErrorMsg(null);

    const res = AppDatabase.submitSurveyResponse({
      moduleType,
      entityId,
      entityTitle,
      respondentName: defaultRespondentName || activeUser.nama,
      respondentEmail: activeUser.email,
      respondentUnit: defaultRespondentUnit || activeUser.unit || activeUser.roleName,
      technicianOrPic,
      ratings: {
        q1: ratings.q1 as 1 | 2 | 3 | 4 | 5,
        q2: ratings.q2 as 1 | 2 | 3 | 4 | 5,
        q3: ratings.q3 as 1 | 2 | 3 | 4 | 5
      },
      feedbackText: feedbackText.trim()
    });

    if (!res.success || !res.survey) {
      setErrorMsg(res.message);
      return;
    }

    onSubmitted(res.survey);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      data-testid="csat-survey-modal"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden my-6">
        <div className="bg-slate-900 text-white p-5 flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3 h-3" />
              <span>ITIL Continual Improvement · Survei Kepuasan ({getModuleLabel(moduleType)})</span>
            </div>
            <h3 className="text-base font-bold text-white">{schema.title}</h3>
            <p className="text-xs text-slate-300 mt-0.5">{schema.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label="Tutup survei"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs max-h-[78vh] overflow-y-auto">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] text-slate-500 block">Objek Layanan yang Dievaluasi</span>
              <span className="font-bold text-slate-900 text-sm">{entityTitle}</span>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md">
                {entityId}
              </span>
              {technicianOrPic && (
                <span className="block text-[10px] text-slate-500 mt-1">PIC: {technicianOrPic}</span>
              )}
            </div>
          </div>

          {/* Legend Skala Likert 1–5 */}
          <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 text-[11px] text-indigo-950">
            <span className="font-bold block mb-1">Panduan Skala Penilaian (1–5):</span>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {LIKERT_SCALE_OPTIONS.map(opt => (
                <span key={opt.score} className="inline-flex items-center gap-1">
                  <span>{opt.emoji}</span>
                  <strong>{opt.score}</strong> = {opt.shortLabel}
                </span>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Questions 1–3 with Emoji & Stars */}
          <div className="space-y-4">
            {schema.questions.map((q, idx) => {
              const currentScore = ratings[q.key];
              return (
                <div key={q.key} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                      Pertanyaan {idx + 1} · {q.label}
                    </span>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{q.question}</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {LIKERT_SCALE_OPTIONS.map(opt => {
                      const isSelected = currentScore === opt.score;
                      return (
                        <button
                          key={opt.score}
                          type="button"
                          data-testid={`survey-${q.key}-score-${opt.score}`}
                          onClick={() =>
                            setRatings(prev => ({
                              ...prev,
                              [q.key]: opt.score
                            }))
                          }
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                            isSelected
                              ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400/40 shadow-xs'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className="text-xl leading-none">{opt.emoji}</span>
                          <div className="flex items-center justify-center gap-0.5">
                            {Array.from({ length: opt.score }).map((_, sIdx) => (
                              <Star
                                key={sIdx}
                                className={`w-3 h-3 ${
                                  isSelected
                                    ? 'fill-amber-400 text-amber-500'
                                    : 'fill-amber-300 text-amber-400'
                                }`}
                              />
                            ))}
                          </div>
                          <span className={`text-[10px] font-bold ${isSelected ? 'text-amber-950' : 'text-slate-600'}`}>
                            {opt.score} · {opt.shortLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Question 4: Saran / Masukan Teks */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <label className="block font-bold text-slate-900 text-sm">
              4. {schema.textQuestion}
            </label>
            <textarea
              rows={3}
              data-testid="survey-feedback-input"
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              placeholder={schema.textPlaceholder}
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Responden: <strong>{defaultRespondentName || activeUser.nama}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Nanti Saja
              </button>
              <button
                type="submit"
                data-testid="submit-csat-survey-btn"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Penilaian Survei</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
