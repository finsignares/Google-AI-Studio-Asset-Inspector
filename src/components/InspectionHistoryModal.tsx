import React from 'react';
import { InspectionReport } from '../types';
import { Clock, X, ChevronRight, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react';

interface InspectionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: InspectionReport[];
  onSelectAudit: (report: InspectionReport) => void;
  onClearHistory: () => void;
}

export const InspectionHistoryModal: React.FC<InspectionHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelectAudit,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-2xl w-full bg-white rounded-2xl overflow-hidden border border-neutral-200 shadow-2xl flex flex-col max-h-[85vh]"
      >
        <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/60">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-neutral-700" />
            <h3 className="font-semibold text-neutral-900 text-base">
              Inspection Records &amp; History ({history.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {history.length === 0 ? (
            <div className="text-center py-8 text-neutral-400 text-xs sm:text-sm">
              No previous device inspections recorded in this browser session.
            </div>
          ) : (
            history.map((item) => {
              const isComplete = item.sufficiency.isAuditComplete;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectAudit(item);
                    onClose();
                  }}
                  className="p-3.5 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/80 cursor-pointer transition flex items-center justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs sm:text-sm text-neutral-900 group-hover:text-emerald-700 transition">
                        {item.device.brand} {item.device.model}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded">
                        {item.device.deviceCategory.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Grade: {item.physical.overallGrade.toUpperCase()}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium">
                        {isComplete ? (
                          <span className="text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Complete
                          </span>
                        ) : (
                          <span className="text-amber-700 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> Needs Info
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-neutral-400 group-hover:text-neutral-900 transition">
                    <span className="text-xs font-medium hidden sm:inline">Open</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {history.length > 0 && (
          <div className="p-3 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs">
            <button
              onClick={onClearHistory}
              className="text-neutral-500 hover:text-red-600 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear History
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-white border border-neutral-300 rounded-lg text-neutral-700 font-medium hover:bg-neutral-100 transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
