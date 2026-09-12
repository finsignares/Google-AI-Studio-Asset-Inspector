import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Video,
  Upload,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Clock,
  CheckCircle2,
  FileVideo,
  StopCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { extractKeyframesFromVideo, compressImageFile } from '../utils/videoExtractor';
import { SAMPLE_AUDITS } from '../data/sampleAudits';
import { InspectionReport, MissingRequirementItem } from '../types';

interface CameraRecorderProps {
  onInspectionStart: (
    frames: string[],
    notes: string,
    isFollowUp?: boolean,
    previousReport?: InspectionReport
  ) => void;
  isProcessing: boolean;
  followUpContext?: {
    previousReport: InspectionReport;
    missingRequirements: MissingRequirementItem[];
  } | null;
  onCancelFollowUp?: () => void;
  onLoadSampleAudit: (sample: InspectionReport) => void;
}

const RECORDING_GUIDES = [
  { sec: 0, title: "1. Front & Branding", tip: "Frame the entire device and brand logo" },
  { sec: 4, title: "2. Sides, Edges & Ports", tip: "Slowly pan around all sides, ports, and seams" },
  { sec: 8, title: "3. Serial Label / Underside", tip: "Show rating plate, barcode, or regulatory label" },
  { sec: 12, title: "4. Power-On & Display", tip: "Press power button, show LEDs or screen wake" },
  { sec: 16, title: "5. Accessories & Cables", tip: "Place charger, battery, remote, or cables in frame" },
];

export const CameraRecorder: React.FC<CameraRecorderProps> = ({
  onInspectionStart,
  isProcessing,
  followUpContext,
  onCancelFollowUp,
  onLoadSampleAudit,
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [inspectorNotes, setInspectorNotes] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [extractingFrames, setExtractingFrames] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera helper
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
    setIsRecording(false);
  };

  // Start camera
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    stopCamera();

    try {
      // Prefer requested camera with fallback
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
      setFacingMode(mode);
    } catch (err: any) {
      console.warn("Camera access failed:", err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? "Camera permission was denied. You can allow camera access in browser settings, or upload a recorded video file below."
          : `Unable to open camera: ${err.message || "Device not found"}. You can upload a video file or test a pre-loaded sample.`
      );
      setCameraActive(false);
    }
  };

  // Toggle between back and front camera
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    startCamera(nextMode);
  };

  // Start video recording
  const startRecording = () => {
    if (!mediaStreamRef.current) return;
    recordedChunksRef.current = [];
    setRecordedVideoUrl(null);
    setCapturedFrames([]);

    try {
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : MediaRecorder.isTypeSupported("video/mp4")
        ? "video/mp4"
        : "";

      const options = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(mediaStreamRef.current, options);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const mime = recorder.mimeType || "video/webm";
        const videoBlob = new Blob(recordedChunksRef.current, { type: mime });
        const url = URL.createObjectURL(videoBlob);
        setRecordedVideoUrl(url);

        // Automatically extract keyframes from the recorded clip
        setExtractingFrames(true);
        try {
          const frames = await extractKeyframesFromVideo(videoBlob, 8);
          setCapturedFrames(frames);
        } catch (err) {
          console.error("Frame extraction error:", err);
        } finally {
          setExtractingFrames(false);
        }
      };

      recorder.start(500); // chunk every 500ms
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);

      // Timer
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => {
          // auto cap recording at 30s to keep inspection snappy
          if (prev >= 30) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error("MediaRecorder start failed:", err);
      setCameraError(`Could not start video recording: ${err.message}`);
    }
  };

  // Stop video recording
  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Snap high-res snapshot while in preview
  const snapStillPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
      setCapturedFrames((prev) => [...prev, dataUrl]);
    }
  };

  // Handle uploaded video file
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setCameraError(null);
    setExtractingFrames(true);
    try {
      if (file.type.startsWith("video/")) {
        const frames = await extractKeyframesFromVideo(file, 8);
        setCapturedFrames(frames);
        setRecordedVideoUrl(URL.createObjectURL(file));
      } else if (file.type.startsWith("image/")) {
        const compressed = await compressImageFile(file);
        setCapturedFrames((prev) => [...prev, compressed]);
      } else {
        setCameraError("Please upload a supported video file (MP4, WebM, MOV) or device images.");
      }
    } catch (err: any) {
      console.error("Upload extraction error:", err);
      setCameraError(`Failed to process video file: ${err.message}`);
    } finally {
      setExtractingFrames(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Compute current guidance phase
  const currentGuide =
    RECORDING_GUIDES.slice()
      .reverse()
      .find((g) => recordingSeconds >= g.sec) || RECORDING_GUIDES[0];

  const handleProceedToAudit = () => {
    if (capturedFrames.length === 0) return;
    onInspectionStart(
      capturedFrames,
      inspectorNotes,
      Boolean(followUpContext),
      followUpContext?.previousReport
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top Banner if in Follow-Up / Additional Video Mode */}
      {followUpContext && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-600 rounded-lg shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded">
                  Supplemental Video Capture
                </span>
                <span className="text-xs text-neutral-500 font-mono">
                  Target: {followUpContext.previousReport.device.brand} {followUpContext.previousReport.device.model}
                </span>
              </div>
              <h3 className="font-semibold text-neutral-900 text-sm sm:text-base mt-1">
                Record Additional Video to Complete Device Verification
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 mt-1">
                The initial audit detected missing criteria. Please focus your lens on the items listed below:
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {followUpContext.missingRequirements.map((req, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-amber-100 text-amber-900 font-medium px-2.5 py-1 rounded-md border border-amber-300/60 inline-flex items-center gap-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                    {req.title}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {onCancelFollowUp && (
            <button
              onClick={onCancelFollowUp}
              className="px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 border border-neutral-300 rounded-lg hover:bg-neutral-100 transition shrink-0"
            >
              Cancel Follow-Up
            </button>
          )}
        </div>
      )}

      {/* Main Recording & Camera Console */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {/* Console Header */}
        <div className="px-5 py-4 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3 bg-neutral-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-neutral-900 text-base leading-tight">
                {followUpContext ? "Supplemental Video Recorder" : "Asset & Device Video Capture"}
              </h2>
              <p className="text-xs text-neutral-500">
                {cameraActive
                  ? "Real-time Mobile Viewfinder Active"
                  : "Start camera to record or upload a video clip"}
              </p>
            </div>
          </div>

          {cameraActive && (
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFacingMode}
                className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 px-3 py-1.5 rounded-lg hover:bg-neutral-50 active:scale-95 transition"
                title="Switch Camera"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Switch</span> ({facingMode === 'environment' ? 'Rear' : 'Front'})
              </button>
              <button
                onClick={stopCamera}
                className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition"
              >
                Close Camera
              </button>
            </div>
          )}
        </div>

        {/* Viewfinder Area */}
        <div className="relative bg-neutral-950 min-h-[380px] sm:min-h-[460px] flex items-center justify-center overflow-hidden">
          {cameraActive ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full max-h-[540px] object-cover"
              />

              {/* Viewfinder Target Framing Overlay */}
              <div className="absolute inset-4 sm:inset-8 pointer-events-none border-2 border-white/30 rounded-2xl flex flex-col justify-between p-4">
                <div className="flex items-center justify-between">
                  <div className="w-6 h-6 border-t-2 border-l-2 border-emerald-400" />
                  {isRecording && (
                    <div className="bg-red-600/90 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-sm animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      REC 00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds} / 00:30
                    </div>
                  )}
                  <div className="w-6 h-6 border-t-2 border-r-2 border-emerald-400" />
                </div>

                {/* Center Target Reticle */}
                <div className="self-center flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-400/80" />
                  </div>
                  {isRecording && (
                    <div className="mt-3 bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs max-w-xs shadow-lg border border-white/10">
                      <div className="font-semibold text-emerald-400">{currentGuide.title}</div>
                      <div className="text-neutral-300 mt-0.5">{currentGuide.tip}</div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="w-6 h-6 border-b-2 border-l-2 border-emerald-400" />
                  <div className="text-[11px] text-white/70 bg-black/50 px-2.5 py-0.5 rounded backdrop-blur-sm">
                    {facingMode === 'environment' ? 'Rear Lens (Macro/Wide)' : 'Front Lens'}
                  </div>
                  <div className="w-6 h-6 border-b-2 border-r-2 border-emerald-400" />
                </div>
              </div>
            </div>
          ) : (
            /* Idle Screen when camera is not started */
            <div className="p-8 text-center text-white max-w-md">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-neutral-800/80 border border-neutral-700 flex items-center justify-center mb-4 text-emerald-400">
                <Video className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-white">Record Asset Video</h3>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1 mb-6">
                Capture a 10–25 second walkthrough of any electronic or electric device. Rotate all angles, highlight serial labels, ports, power button, and accessories.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => startCamera('environment')}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <Camera className="w-4 h-4" />
                  Open Mobile Camera
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium rounded-xl border border-neutral-700 flex items-center justify-center gap-2 transition"
                >
                  <Upload className="w-4 h-4" />
                  Upload Video Clip
                </button>
              </div>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
        </div>

        {/* Live Camera Controls Bar (When Camera is active) */}
        {cameraActive && (
          <div className="p-4 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between gap-4">
            <button
              onClick={snapStillPhoto}
              className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-900 text-neutral-200 text-xs font-medium rounded-xl border border-neutral-700 flex items-center gap-1.5 transition"
              title="Capture a close-up macro frame of label or port"
            >
              <Camera className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Snap Macro Still</span>
            </button>

            {/* Main Record / Stop Trigger */}
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-semibold text-sm rounded-full flex items-center gap-2 shadow-lg shadow-red-600/30 transition transform hover:scale-105"
              >
                <span className="w-3 h-3 rounded-full bg-white" />
                Start Recording Video
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="px-6 py-2.5 bg-neutral-100 hover:bg-white text-neutral-900 font-semibold text-sm rounded-full flex items-center gap-2 shadow-lg transition animate-pulse"
              >
                <StopCircle className="w-4 h-4 text-red-600" />
                Finish Video ({recordingSeconds}s)
              </button>
            )}

            <div className="text-right">
              <span className="text-[11px] text-neutral-400 block">Optimal length</span>
              <span className="text-xs font-mono text-neutral-200 font-medium">10-25s</span>
            </div>
          </div>
        )}

        {/* Camera Error Message */}
        {cameraError && (
          <div className="p-4 bg-red-50 border-t border-red-200 flex items-start gap-3 text-red-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold">Camera Notice</div>
              <div>{cameraError}</div>
            </div>
          </div>
        )}

        {/* Drag & Drop Fallback Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFileUpload(file);
          }}
          className={`px-5 py-4 border-t border-neutral-200 transition ${
            dragOver ? 'bg-emerald-50 border-emerald-300' : 'bg-neutral-50/70'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-600">
            <div className="flex items-center gap-2">
              <FileVideo className="w-4 h-4 text-neutral-500 shrink-0" />
              <span>
                Drop pre-recorded video clip (MP4, WebM, MOV) or click to browse files.
              </span>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-lg text-xs font-medium text-neutral-800 shrink-0 transition"
            >
              Browse Video File
            </button>
          </div>
        </div>
      </div>

      {/* Frame Extraction Indicator */}
      {extractingFrames && (
        <div className="bg-neutral-900 text-white rounded-xl p-4 flex items-center justify-center gap-3 text-xs shadow-md">
          <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
          <span>Extracting and indexing diagnostic keyframes across video timeline...</span>
        </div>
      )}

      {/* Captured Frames Review Strip */}
      {capturedFrames.length > 0 && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-neutral-900 text-sm sm:text-base flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Indexed Video Frames ({capturedFrames.length})
              </h3>
              <p className="text-xs text-neutral-500">
                These sequential visual samples will be analyzed by Gemini for device type, physical wear, functionality, and accessories.
              </p>
            </div>
            <button
              onClick={() => setCapturedFrames([])}
              className="text-xs text-neutral-500 hover:text-red-600 transition"
            >
              Clear Frames
            </button>
          </div>

          {/* Thumbnail Gallery */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
            {capturedFrames.map((frame, index) => (
              <div
                key={index}
                className="group relative aspect-video bg-neutral-900 rounded-lg overflow-hidden border border-neutral-200 shadow-xs"
              >
                <img
                  src={frame}
                  alt={`Frame ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                  #{index + 1}
                </span>
              </div>
            ))}
          </div>

          {/* Optional Inspector Notes */}
          <div className="pt-2 border-t border-neutral-100">
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Optional Inspector Observation Notes (optional)
            </label>
            <input
              type="text"
              value={inspectorNotes}
              onChange={(e) => setInspectorNotes(e.target.value)}
              placeholder="e.g., 'Device powers on with single beep', 'Charger is genuine OEM', 'Liquid indicator appears white'..."
              className="w-full text-xs sm:text-sm px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
            />
          </div>

          {/* Run AI Inspection CTA */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-neutral-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Multi-criteria audit will verify physical wear, function &amp; accessories completeness</span>
            </div>

            <button
              onClick={handleProceedToAudit}
              disabled={isProcessing}
              className="w-full sm:w-auto px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 active:bg-black text-white font-medium text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              {isProcessing
                ? "Analyzing Video with AI..."
                : followUpContext
                ? "Submit Supplemental Video & Update Audit"
                : "Analyze Device & Audit Completeness"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Preloaded Sample Scenarios (Great for immediate testing!) */}
      <div className="bg-neutral-50/80 rounded-2xl border border-neutral-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-neutral-700" />
            <h4 className="font-semibold text-neutral-900 text-xs sm:text-sm uppercase tracking-wider">
              Quick Test Scenarios (Sample Video Audits)
            </h4>
          </div>
          <span className="text-[11px] text-neutral-500">Test the complete AI audit engine instantly</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SAMPLE_AUDITS.map((sample) => {
            const isComplete = sample.sufficiency.isAuditComplete;
            return (
              <button
                key={sample.id}
                onClick={() => onLoadSampleAudit(sample)}
                className="text-left bg-white p-3.5 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-medium px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded-md">
                      {sample.device.deviceCategory.replace('_', ' ')}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isComplete
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isComplete ? 'Complete' : 'Needs Video/Info'}
                    </span>
                  </div>
                  <div className="font-semibold text-xs sm:text-sm text-neutral-900 group-hover:text-emerald-700 transition">
                    {sample.device.brand} {sample.device.model}
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2">
                    {sample.device.summary}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-600">
                  <span>Grade: {sample.physical.overallGrade.toUpperCase()}</span>
                  <span className="font-medium text-neutral-900 flex items-center gap-1 group-hover:translate-x-0.5 transition">
                    View Audit <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
