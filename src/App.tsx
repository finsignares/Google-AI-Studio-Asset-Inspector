/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Camera,
  History,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Cpu,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { CameraRecorder } from './components/CameraRecorder';
import { InspectionResults } from './components/InspectionResults';
import { InspectionHistoryModal } from './components/InspectionHistoryModal';
import { InspectionReport, MissingRequirementItem } from './types';
import { SAMPLE_AUDITS } from './data/sampleAudits';

const LOCAL_STORAGE_KEY = 'asset_inspector_history_v1';

export default function App() {
  const [view, setView] = useState<'recorder' | 'results'>('recorder');
  const [currentReport, setCurrentReport] = useState<InspectionReport | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<InspectionReport[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Continuation / Follow-up state when additional video is needed
  const [followUpContext, setFollowUpContext] = useState<{
    previousReport: InspectionReport;
    missingRequirements: MissingRequirementItem[];
  } | null>(null);

  // Load history from localStorage on mount, seeding with samples if empty
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      } else {
        setHistory(SAMPLE_AUDITS);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SAMPLE_AUDITS));
      }
    } catch (e) {
      console.warn("Failed to load audit history:", e);
      setHistory(SAMPLE_AUDITS);
    }
  }, []);

  const saveReportToHistory = (newReport: InspectionReport) => {
    setHistory((prev) => {
      // If replacing an existing report with updated follow-up
      const filtered = prev.filter((r) => r.id !== newReport.id);
      const updated = [newReport, ...filtered];
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn("Storage quota full or error saving:", e);
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setHistory([]);
    setShowHistoryModal(false);
  };

  // Perform AI Inspection by calling backend
  const handleInspectionStart = async (
    frames: string[],
    notes: string,
    isFollowUp?: boolean,
    previousReport?: InspectionReport
  ) => {
    setIsProcessing(true);
    setError(null);
    setProcessingStatus("Initializing multimodal video frames...");

    try {
      // Rotating friendly status updates for user engagement during AI processing
      const statusTimer = setInterval(() => {
        setProcessingStatus((prev) => {
          if (prev.includes("Initializing")) return "Identifying electronic asset type & manufacturer...";
          if (prev.includes("Identifying")) return "Auditing physical condition, casing, screen & connectors...";
          if (prev.includes("Auditing physical")) return "Evaluating functionality indicators & demonstrated actions...";
          if (prev.includes("Evaluating functionality")) return "Checking accessories inventory completeness...";
          return "Validating audit sufficiency & missing information checklist...";
        });
      }, 1600);

      const response = await fetch("/api/inspect-device", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          frames,
          additionalNotes: notes,
          isFollowUp: Boolean(isFollowUp),
          previousReportSummary: previousReport ? previousReport.device.summary : undefined,
        }),
      });

      clearInterval(statusTimer);

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !data.report) {
        throw new Error("Invalid response format received from inspector service.");
      }

      const generatedReport: InspectionReport = {
        id: previousReport ? previousReport.id : `audit-${Date.now().toString(36)}`,
        createdAt: new Date().toISOString(),
        ...data.report,
        frames,
        inspectorNotes: notes,
        continuationCount: previousReport ? (previousReport.continuationCount || 0) + 1 : 0,
      };

      setCurrentReport(generatedReport);
      saveReportToHistory(generatedReport);
      setFollowUpContext(null);
      setView('results');
    } catch (err: any) {
      console.error("Inspection processing error:", err);
      setError(
        err.message ||
          "An unexpected error occurred during asset inspection. Please verify your camera frames and try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Trigger follow-up video capture for missing requirements
  const handleRecordAdditionalVideo = () => {
    if (!currentReport) return;
    setFollowUpContext({
      previousReport: currentReport,
      missingRequirements: currentReport.sufficiency.missingRequirements,
    });
    setView('recorder');
  };

  // Provide additional written info
  const handleProvideAdditionalInfo = async (notes: string) => {
    if (!currentReport) return;
    setIsProcessing(true);
    setError(null);
    setProcessingStatus("Re-evaluating audit sufficiency with supplemental inspector info...");

    try {
      const response = await fetch("/api/inspect-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frames: currentReport.frames,
          additionalNotes: notes,
          isFollowUp: true,
          previousReportSummary: currentReport.device.summary,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to update audit.");
      }

      const data = await response.json();
      const updatedReport: InspectionReport = {
        ...currentReport,
        ...data.report,
        inspectorNotes: `${currentReport.inspectorNotes ? currentReport.inspectorNotes + " | " : ""}${notes}`,
        continuationCount: (currentReport.continuationCount || 0) + 1,
      };

      setCurrentReport(updatedReport);
      saveReportToHistory(updatedReport);
    } catch (err: any) {
      setError(err.message || "Failed to process supplemental information.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartNewInspection = () => {
    setCurrentReport(null);
    setFollowUpContext(null);
    setError(null);
    setView('recorder');
  };

  const handleSelectHistoryAudit = (report: InspectionReport) => {
    setCurrentReport(report);
    setView('results');
  };

  return (
    <div className="min-h-screen bg-neutral-100/60 text-neutral-900 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div
            onClick={handleStartNewInspection}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition">
              <Camera className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-neutral-900 tracking-tight leading-none">
                  Device &amp; Asset Video Inspector
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                  AI Multi-Criteria
                </span>
              </div>
              <span className="text-[11px] text-neutral-500 block leading-tight mt-0.5">
                Physical Status • Funcionalidad • Accesorios Completeness
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-medium transition"
              title="View past inspection records"
            >
              <History className="w-4 h-4 text-neutral-500" />
              <span className="hidden sm:inline">Records</span>
              <span className="bg-neutral-200 text-neutral-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {history.length}
              </span>
            </button>

            {view === 'results' && (
              <button
                onClick={handleStartNewInspection}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:bg-black text-white text-xs font-semibold shadow-xs transition"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">New Audit</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Error Alert Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-900 p-4 rounded-xl flex items-start gap-3 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold">Inspection Error</div>
              <p className="mt-0.5 text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-neutral-400 hover:text-neutral-700 text-xs px-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading / AI Processing Overlay */}
        {isProcessing && (
          <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border border-neutral-200">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 mx-auto flex items-center justify-center animate-pulse">
                <Sparkles className="w-8 h-8 animate-spin" />
              </div>

              <div>
                <h3 className="font-bold text-base sm:text-lg text-neutral-900">
                  Inspecting Device Video
                </h3>
                <p className="text-xs text-neutral-500 mt-1 font-mono">
                  Gemini 3.8 Flash Diagnostic Auditor
                </p>
              </div>

              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-700 font-medium min-h-[44px] flex items-center justify-center">
                {processingStatus}
              </div>

              <div className="text-[11px] text-neutral-400">
                Evaluating device identification, physical wear, functional indicators, accessories completeness, and audit sufficiency.
              </div>
            </div>
          </div>
        )}

        {/* View Switcher */}
        {view === 'recorder' ? (
          <CameraRecorder
            onInspectionStart={handleInspectionStart}
            isProcessing={isProcessing}
            followUpContext={followUpContext}
            onCancelFollowUp={() => {
              setFollowUpContext(null);
              if (currentReport) setView('results');
            }}
            onLoadSampleAudit={(sample) => {
              setCurrentReport(sample);
              setView('results');
            }}
          />
        ) : (
          currentReport && (
            <InspectionResults
              report={currentReport}
              onNewInspection={handleStartNewInspection}
              onRecordAdditionalVideo={handleRecordAdditionalVideo}
              onProvideAdditionalInfo={handleProvideAdditionalInfo}
            />
          )
        )}
      </main>

      {/* History Slide-Over / Modal */}
      <InspectionHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        history={history}
        onSelectAudit={handleSelectHistoryAudit}
        onClearHistory={handleClearHistory}
      />

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white/70 py-4 px-4 text-center text-xs text-neutral-500 no-print">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Certified Asset &amp; Electronics Video Inspector • Powered by Gemini 3.8 Flash
          </span>
          <span className="text-[11px] text-neutral-400">
            Physical Status • Funcionalidad • Accesorios • Audit Sufficiency Checklist
          </span>
        </div>
      </footer>
    </div>
  );
}
