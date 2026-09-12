import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Video,
  PlusCircle,
  ArrowLeft,
  Printer,
  Download,
  Zap,
  Info,
  Layers,
  Cpu,
  Tv,
  Wrench,
  HelpCircle,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { InspectionReport } from '../types';

interface InspectionResultsProps {
  report: InspectionReport;
  onNewInspection: () => void;
  onRecordAdditionalVideo: () => void;
  onProvideAdditionalInfo: (notes: string) => void;
}

export const InspectionResults: React.FC<InspectionResultsProps> = ({
  report,
  onNewInspection,
  onRecordAdditionalVideo,
  onProvideAdditionalInfo,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'physical' | 'functionality' | 'accessories' | 'frames'>('overview');
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [additionalNoteInput, setAdditionalNoteInput] = useState('');

  const { device, physical, functionality, accessories, sufficiency, frames } = report;
  const isComplete = sufficiency.isAuditComplete;

  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `device-audit-${report.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const submitAdditionalInfo = () => {
    if (!additionalNoteInput.trim()) return;
    onProvideAdditionalInfo(additionalNoteInput);
    setShowInfoModal(false);
  };

  // Helper for grade styling
  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'mint':
        return { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', label: 'Mint / Pristine' };
      case 'good':
        return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', label: 'Good' };
      case 'fair':
        return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', label: 'Fair / Usable' };
      case 'poor':
        return { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', label: 'Poor / Heavy Wear' };
      case 'damaged':
      default:
        return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', label: 'Damaged / Defective' };
    }
  };

  const getFunctionalBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Operational' };
      case 'partially_functional':
        return { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Partially Functional' };
      case 'non_functional':
        return { bg: 'bg-red-100', text: 'text-red-800', label: 'Non-Functional' };
      case 'untested_not_demonstrated':
      default:
        return { bg: 'bg-neutral-200', text: 'text-neutral-800', label: 'Untested in Video' };
    }
  };

  const getAccessoriesBadge = (comp: string) => {
    switch (comp) {
      case 'complete':
        return { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Complete (100%)' };
      case 'partially_complete':
        return { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Partially Complete' };
      case 'missing_critical':
        return { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Missing Critical Items' };
      case 'none_detected':
      default:
        return { bg: 'bg-red-100', text: 'text-red-800', label: 'No Accessories Shown' };
    }
  };

  const gradeInfo = getGradeBadge(physical.overallGrade);
  const funcInfo = getFunctionalBadge(functionality.observableStatus);
  const accessInfo = getAccessoriesBadge(accessories.overallCompleteness);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top Action Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <button
          onClick={onNewInspection}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 px-3 py-1.5 rounded-lg hover:bg-neutral-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Inspect Another Device
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 px-3 py-1.5 rounded-lg hover:bg-neutral-50 transition"
            title="Download JSON audit report"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 px-3 py-1.5 rounded-lg hover:bg-neutral-50 transition"
            title="Print or Save PDF report"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>
        </div>
      </div>

      {/* CORE HIGHLIGHT: AUDIT SUFFICIENCY BANNER */}
      {isComplete ? (
        <div className="bg-emerald-50 border-2 border-emerald-500/50 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded">
                    Audit Certified Complete
                  </span>
                  <span className="text-xs font-medium text-emerald-700">
                    Confidence: {sufficiency.confidenceScore}%
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 mt-1">
                  All Required Device Information is Complete &amp; Verified
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
                  Device identity, physical wear, functional demonstrations, and accessories were verified without critical omissions.
                </p>
              </div>
            </div>
            <div className="shrink-0 bg-white px-4 py-2 rounded-xl border border-emerald-200 text-right">
              <span className="text-[10px] text-neutral-500 block uppercase font-mono">Status</span>
              <span className="text-xs font-semibold text-emerald-700">Ready for Certification</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-500/10 border-2 border-amber-500/60 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-200 px-2.5 py-0.5 rounded">
                    Additional Video or Info Required
                  </span>
                  <span className="text-xs font-medium text-amber-800">
                    Confidence: {sufficiency.confidenceScore}%
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 mt-1">
                  Audit Incomplete: Key Information Missing from Video Capture
                </h2>
                <p className="text-xs sm:text-sm text-neutral-700 mt-0.5">
                  To certify this asset, the inspector must provide additional video footage or information addressing the gaps below.
                </p>
              </div>
            </div>

            {/* Quick Action CTA to record continuation */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                onClick={onRecordAdditionalVideo}
                className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 active:bg-black text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md transition"
              >
                <Video className="w-4 h-4 text-emerald-400" />
                Record Additional Video
              </button>
              <button
                onClick={() => setShowInfoModal(true)}
                className="px-3.5 py-2 bg-white hover:bg-neutral-100 text-neutral-800 text-xs sm:text-sm font-medium rounded-xl border border-neutral-300 flex items-center justify-center gap-1.5 transition"
              >
                <PlusCircle className="w-4 h-4 text-neutral-600" />
                Add Written Info
              </button>
            </div>
          </div>

          {/* Missing Requirements List */}
          <div className="space-y-2.5 pt-2 border-t border-amber-200/60">
            <div className="text-xs font-semibold text-neutral-800 uppercase tracking-wide">
              Required Information Checklist ({sufficiency.missingRequirements.length} items missing):
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sufficiency.missingRequirements.map((req) => (
                <div
                  key={req.id}
                  className="bg-white/90 rounded-xl p-3.5 border border-amber-300/80 shadow-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-neutral-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      {req.title}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        req.urgency === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {req.urgency}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-700 bg-amber-50/70 p-2 rounded-lg border border-amber-100 font-medium">
                    👉 {req.userInstruction}
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    <span className="font-medium text-neutral-700">Reason:</span> {req.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DEVICE HEADER & SUMMARY CARD */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-700 bg-neutral-100 px-2.5 py-1 rounded-md">
                {device.deviceCategory.replace('_', ' ')}
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                Audit ID: #{report.id}
              </span>
              <span className="text-xs text-neutral-500">
                {new Date(report.createdAt).toLocaleString()}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
              {device.brand} {device.model}
            </h1>

            <p className="text-xs sm:text-sm text-neutral-600 max-w-3xl">
              {device.summary}
            </p>

            {/* Serial Number Pill */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="inline-flex items-center gap-1.5 text-xs bg-neutral-100 px-3 py-1 rounded-lg border border-neutral-200">
                <span className="text-neutral-500 font-medium">Serial / Asset Tag:</span>
                {device.serialNumberOrTag.detected && device.serialNumberOrTag.value ? (
                  <span className="font-mono font-semibold text-neutral-900">
                    {device.serialNumberOrTag.value}
                  </span>
                ) : (
                  <span className="text-amber-700 font-medium italic">
                    Not detected in video footage
                  </span>
                )}
              </div>
              <span className="text-[11px] text-neutral-500">
                ({device.serialNumberOrTag.locationNotes})
              </span>
            </div>
          </div>

          {/* Key Metrics Quick Badges */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-center min-w-[95px]">
              <span className="text-[10px] uppercase font-bold text-neutral-500 block">Physical</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${gradeInfo.bg} ${gradeInfo.text}`}>
                {gradeInfo.label}
              </span>
              <span className="text-xs text-neutral-500 block mt-1 font-mono">{physical.score}/100</span>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-center min-w-[105px]">
              <span className="text-[10px] uppercase font-bold text-neutral-500 block">Funcionalidad</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${funcInfo.bg} ${funcInfo.text}`}>
                {funcInfo.label}
              </span>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-center min-w-[100px]">
              <span className="text-[10px] uppercase font-bold text-neutral-500 block">Accesorios</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${accessInfo.bg} ${accessInfo.text}`}>
                {accessInfo.label}
              </span>
              <span className="text-xs text-neutral-500 block mt-1 font-mono">{accessories.completenessScore}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* AUDIT NAVIGATION TABS */}
      <div className="border-b border-neutral-200 flex items-center gap-1 overflow-x-auto no-print">
        {[
          { id: 'overview', label: 'Audit Overview' },
          { id: 'physical', label: `Physical Status (${physical.score}%)` },
          { id: 'functionality', label: 'Funcionalidad' },
          { id: 'accessories', label: `Accesorios (${accessories.items.length})` },
          { id: 'frames', label: `Video Frames (${frames.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Executive Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Physical condition summary */}
            <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  1. Physical Wear
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${gradeInfo.bg} ${gradeInfo.text}`}>
                  {physical.overallGrade.toUpperCase()}
                </span>
              </div>
              <div className="text-sm font-semibold text-neutral-900">
                Score: {physical.score}/100
              </div>
              <p className="text-xs text-neutral-600 line-clamp-3">
                {physical.housingAndChassis.details}
              </p>
              <div className="text-[11px] text-neutral-500 pt-1 border-t border-neutral-100">
                {physical.defectsList.length} defect(s) logged
              </div>
            </div>

            {/* Funcionalidad summary */}
            <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  2. Funcionalidad
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${funcInfo.bg} ${funcInfo.text}`}>
                  {funcInfo.label}
                </span>
              </div>
              <div className="text-sm font-semibold text-neutral-900">
                Power State: {functionality.powerIndicator.state.replace('_', ' ')}
              </div>
              <p className="text-xs text-neutral-600 line-clamp-3">
                {functionality.powerIndicator.notes || "Power state and active behavior demonstrated in video."}
              </p>
              <div className="text-[11px] text-neutral-500 pt-1 border-t border-neutral-100">
                {functionality.demonstratedActions.length} action(s) tested, {functionality.untestedRisks.length} untested risk(s)
              </div>
            </div>

            {/* Accesorios summary */}
            <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  3. Accesorios
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${accessInfo.bg} ${accessInfo.text}`}>
                  {accessInfo.label}
                </span>
              </div>
              <div className="text-sm font-semibold text-neutral-900">
                Completeness: {accessories.completenessScore}%
              </div>
              <p className="text-xs text-neutral-600 line-clamp-3">
                {accessories.summary}
              </p>
              <div className="text-[11px] text-neutral-500 pt-1 border-t border-neutral-100">
                {accessories.items.length} accessory requirement(s) mapped
              </div>
            </div>
          </div>

          {/* Recommendations and Next Actions */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-3">
            <h3 className="font-semibold text-sm sm:text-base text-neutral-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-neutral-600" />
              Inspector Audit Recommendations &amp; Next Actions
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600">
              {sufficiency.recommendations}
            </p>
            <div className="space-y-1.5 pt-2">
              {sufficiency.suggestedNextActions.map((action, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-neutral-700">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PHYSICAL STATUS */}
      {activeTab === 'physical' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div>
                <h3 className="font-semibold text-base text-neutral-900">Physical Condition Breakdown</h3>
                <p className="text-xs text-neutral-500">Detailed examination of external housing, screen, ports, buttons, and cabling.</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-neutral-500">Score</span>
                <span className="text-base font-bold text-neutral-900 block">{physical.score} / 100</span>
              </div>
            </div>

            {/* Detailed Component Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* Housing */}
              <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-700">Housing &amp; Chassis</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-neutral-200 text-neutral-800 rounded">
                    {physical.housingAndChassis.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-neutral-600">{physical.housingAndChassis.details}</p>
              </div>

              {/* Screen / Display */}
              <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-700">Display / Screen</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-neutral-200 text-neutral-800 rounded">
                    {physical.screenOrDisplay.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-neutral-600">{physical.screenOrDisplay.details}</p>
              </div>

              {/* Ports */}
              <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-700">Ports &amp; Sockets</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-neutral-200 text-neutral-800 rounded">
                    {physical.portsAndConnectors.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-neutral-600">{physical.portsAndConnectors.details}</p>
              </div>

              {/* Buttons */}
              <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-700">Buttons &amp; Switches</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-neutral-200 text-neutral-800 rounded">
                    {physical.buttonsAndSwitches.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-neutral-600">{physical.buttonsAndSwitches.details}</p>
              </div>

              {/* Cables */}
              <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-700">Cables &amp; Wiring</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-neutral-200 text-neutral-800 rounded">
                    {physical.cablesAndWiring.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-neutral-600">{physical.cablesAndWiring.details}</p>
              </div>

              {/* Cleanliness */}
              <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-700">Cleanliness Level</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-neutral-200 text-neutral-800 rounded">
                    {physical.cleanliness.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-neutral-600">Surface evaluated for dust, grime, stickers, or adhesive residue.</p>
              </div>
            </div>
          </div>

          {/* Itemized Defects List */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-3">
            <h3 className="font-semibold text-sm sm:text-base text-neutral-900">
              Identified Defects &amp; Wear Points ({physical.defectsList.length})
            </h3>
            {physical.defectsList.length === 0 ? (
              <p className="text-xs text-neutral-500 italic">No significant cosmetic or physical defects detected.</p>
            ) : (
              <div className="divide-y divide-neutral-100">
                {physical.defectsList.map((defect, idx) => (
                  <div key={idx} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <span className="font-semibold text-neutral-900">{defect.area}:</span>{' '}
                      <span className="text-neutral-700">{defect.description}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0 ${
                        defect.severity === 'severe'
                          ? 'bg-red-100 text-red-800'
                          : defect.severity === 'moderate'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {defect.severity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: FUNCIONALIDAD */}
      {activeTab === 'functionality' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div>
                <h3 className="font-semibold text-base text-neutral-900">Observable Funcionalidad</h3>
                <p className="text-xs text-neutral-500">Real-time functional status determined from demonstrated actions in the video.</p>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${funcInfo.bg} ${funcInfo.text}`}>
                {funcInfo.label}
              </span>
            </div>

            {/* Diagnostic Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Power LED Indicator */}
              <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-800">Power LED / Pilot Lights</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-white border border-neutral-200 rounded">
                    {functionality.powerIndicator.state.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-neutral-600">{functionality.powerIndicator.notes}</p>
              </div>

              {/* Display Response */}
              <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-800">Display / Screen Boot</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-white border border-neutral-200 rounded">
                    {functionality.displayOrScreenResponse.state.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-neutral-600">{functionality.displayOrScreenResponse.notes}</p>
              </div>

              {/* Mechanical / Moving Parts */}
              <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-800">Mechanical / Moving Parts</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-white border border-neutral-200 rounded">
                    {functionality.mechanicalOrMovingParts.state.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-neutral-600">{functionality.mechanicalOrMovingParts.notes}</p>
              </div>

              {/* Audio / Beeps */}
              <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-800">Audible Alerts / Chimes</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-white border border-neutral-200 rounded">
                    {functionality.audibleAlerts?.detected ? 'Detected' : 'None Detected'}
                  </span>
                </div>
                <p className="text-xs text-neutral-600">{functionality.audibleAlerts?.notes || "No audible cues observed."}</p>
              </div>
            </div>

            {/* Demonstrated Actions vs Untested Risks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <h4 className="text-xs font-bold uppercase text-emerald-900 tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Demonstrated Actions in Video
                </h4>
                {functionality.demonstratedActions.length === 0 ? (
                  <p className="text-xs text-neutral-500 italic">No specific operational actions demonstrated.</p>
                ) : (
                  <ul className="space-y-1 text-xs text-neutral-800">
                    {functionality.demonstratedActions.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
                <h4 className="text-xs font-bold uppercase text-amber-900 tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Untested Functional Risks
                </h4>
                {functionality.untestedRisks.length === 0 ? (
                  <p className="text-xs text-neutral-500 italic">All critical functions demonstrated.</p>
                ) : (
                  <ul className="space-y-1 text-xs text-neutral-800">
                    {functionality.untestedRisks.map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ACCESORIOS */}
      {activeTab === 'accessories' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
              <div>
                <h3 className="font-semibold text-base text-neutral-900">Accesorios Audit</h3>
                <p className="text-xs text-neutral-500">
                  Expected standard accessories based on device type ({device.deviceType}), presence, and individual condition.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${accessInfo.bg} ${accessInfo.text}`}>
                  {accessInfo.label}
                </span>
                <span className="text-xs font-bold text-neutral-900 bg-neutral-100 px-2.5 py-1 rounded-lg">
                  {accessories.completenessScore}% Complete
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-neutral-700 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
              {accessories.summary}
            </p>

            {/* Inventory Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/70 text-neutral-600 font-semibold">
                    <th className="py-2.5 px-3">Accessory Item</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Presence Status</th>
                    <th className="py-2.5 px-3">Condition</th>
                    <th className="py-2.5 px-3">OEM / Original</th>
                    <th className="py-2.5 px-3">Observation Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {accessories.items.map((item, idx) => {
                    const isPresent = item.presence === 'present_verified';
                    const isCriticalMissing = item.presence === 'missing_critical';
                    return (
                      <tr key={idx} className="hover:bg-neutral-50/50">
                        <td className="py-3 px-3 font-semibold text-neutral-900">
                          {item.name}
                        </td>
                        <td className="py-3 px-3 text-neutral-600 capitalize">
                          {item.category.replace(/_/g, ' ')}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded inline-block ${
                              isPresent
                                ? 'bg-emerald-100 text-emerald-800'
                                : isCriticalMissing
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.presence.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-neutral-700 capitalize">
                          {item.condition.replace(/_/g, ' ')}
                        </td>
                        <td className="py-3 px-3">
                          {item.isOriginal === true ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              OEM Verified
                            </span>
                          ) : item.isOriginal === false ? (
                            <span className="text-[10px] text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                              Aftermarket / 3rd Party
                            </span>
                          ) : (
                            <span className="text-[10px] text-neutral-400">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-neutral-600 max-w-xs">
                          {item.notes}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CAPTURED FRAMES */}
      {activeTab === 'frames' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base text-neutral-900">
                  Sequential Video Evidence ({frames.length} frames)
                </h3>
                <p className="text-xs text-neutral-500">Click on any frame to inspect high-resolution details.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {frames.map((frame, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedFrame(frame)}
                  className="group relative aspect-video bg-neutral-900 rounded-xl overflow-hidden border border-neutral-200 shadow-xs cursor-pointer hover:ring-2 hover:ring-emerald-500 transition"
                >
                  <img
                    src={frame}
                    alt={`Frame ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="text-xs text-white bg-black/70 px-2.5 py-1 rounded-full backdrop-blur-xs">
                      Enlarge
                    </span>
                  </div>
                  <span className="absolute bottom-1.5 right-1.5 bg-black/75 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                    Frame #{index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: IMAGE LIGHTBOX */}
      {selectedFrame && (
        <div
          onClick={() => setSelectedFrame(null)}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl w-full bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl relative"
          >
            <div className="p-3 border-b border-neutral-800 flex items-center justify-between text-white">
              <span className="text-xs font-mono">Diagnostic Evidence Frame</span>
              <button
                onClick={() => setSelectedFrame(null)}
                className="text-xs text-neutral-400 hover:text-white px-2 py-1"
              >
                Close (ESC)
              </button>
            </div>
            <div className="p-2 flex items-center justify-center max-h-[75vh]">
              <img
                src={selectedFrame}
                alt="Enlarged diagnostic frame"
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ENTER WRITTEN ADDITIONAL INFO */}
      {showInfoModal && (
        <div
          onClick={() => setShowInfoModal(false)}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-lg w-full bg-white rounded-2xl overflow-hidden border border-neutral-200 shadow-2xl p-5 space-y-4"
          >
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                Provide Supplemental Information
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Supply missing details such as the serial number string, accessory status, or notes on why a test could not be performed.
              </p>
            </div>

            <textarea
              rows={4}
              value={additionalNoteInput}
              onChange={(e) => setAdditionalNoteInput(e.target.value)}
              placeholder="e.g., 'Serial Number is SN-9948271 located under battery pack. The charger is original 65W and functions normally.'..."
              className="w-full text-xs sm:text-sm p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-3.5 py-2 text-xs text-neutral-600 hover:text-neutral-900 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={submitAdditionalInfo}
                disabled={!additionalNoteInput.trim()}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition"
              >
                Save Supplemental Info &amp; Re-Evaluate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
