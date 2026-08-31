"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import {
  Video,
  Mic,
  Camera,
  Square,
  Play,
  Pause,
  Download,
  Trash2,
  Sparkles,
  Crown,
  Radio,
  FileVideo,
  Clock,
  User,
  ShieldCheck,
  AlertCircle,
  Eye,
  X,
  CheckCircle2,
  Calendar,
  Layers,
} from "lucide-react";

interface EmployeeOption {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  department: string;
  avatar_url?: string | null;
}

export default function FounderRecordingsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const isAuthorized = Boolean(
    user?.role === "Founder" ||
      user?.role === "Co-Founder" ||
      user?.email === "mujahidaryan222149@gmail.com" ||
      user?.email === "heyfarii@gmail.com"
  );

  const [recordingMode, setRecordingMode] = useState<"screen" | "screenshot" | "call">("screen");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("all");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [recordedMediaType, setRecordedMediaType] = useState<"screen_video" | "screenshot" | "call_audio">("screen_video");
  const [capturedImageData, setCapturedImageData] = useState<string | null>(null);
  const [recordingTitle, setRecordingTitle] = useState("");
  const [previewMedia, setPreviewMedia] = useState<any | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch Real Employees for Target Selection
  const { data: usersResponse } = useQuery<{ success: boolean; data: EmployeeOption[] }>({
    queryKey: ["iam-users-list"],
    queryFn: () => apiClient("/api/v1/iam/users"),
    enabled: isAuthorized,
  });

  const employees = usersResponse?.data || [];

  // 2. Fetch Active Recordings (Auto-purges records > 1 day old)
  const { data: recordingsResponse, isLoading, refetch } = useQuery<{
    success: boolean;
    data: any[];
  }>({
    queryKey: ["iam-recordings"],
    queryFn: () => apiClient("/api/v1/iam/recordings"),
    enabled: isAuthorized,
  });

  const recordings = recordingsResponse?.data || [];

  // 3. Save Recording Mutation
  const saveRecordingMutation = useMutation({
    mutationFn: (body: any) =>
      apiClient("/api/v1/iam/recordings", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      toast.success("Capture saved to Library (Auto-expires in 24 hours)");
      queryClient.invalidateQueries({ queryKey: ["iam-recordings"] });
      setRecordedBlobUrl(null);
      setCapturedImageData(null);
      setRecordingTitle("");
      setRecordingDuration(0);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save capture");
    },
  });

  // 4. Delete Recording Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/api/v1/iam/recordings?id=${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Recording deleted from database");
      queryClient.invalidateQueries({ queryKey: ["iam-recordings"] });
      if (previewMedia) setPreviewMedia(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete recording");
    },
  });

  const getTargetEmployeeName = () => {
    if (selectedEmployeeId === "all") return "All Staff / General";
    const found = employees.find((e) => e.id === selectedEmployeeId);
    return found ? `${found.first_name} ${found.last_name || ""}`.trim() : "Employee";
  };

  // ─── A. Start Screen Video Recording ───────────────────────────
  const startScreenRecording = async () => {
    try {
      recordedChunksRef.current = [];
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedBlobUrl(url);
        setRecordedMediaType("screen_video");
        setCapturedImageData(null);
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      // Handle user stopping stream from browser chrome UI
      stream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      toast.success(`Screen recording started for ${getTargetEmployeeName()}`);
    } catch (err: any) {
      toast.error("Screen recording cancelled or permission denied");
    }
  };

  // ─── B. Capture Screen / Tab Screenshot ────────────────────────
  const captureScreenshot = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      // Wait a moment for frame to render
      await new Promise((r) => setTimeout(r, 300));

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL("image/png");
      stream.getTracks().forEach((t) => t.stop());

      setCapturedImageData(dataUrl);
      setRecordedBlobUrl(dataUrl);
      setRecordedMediaType("screenshot");
      setRecordingTitle(`Screenshot - ${getTargetEmployeeName()} - ${new Date().toLocaleTimeString()}`);
      toast.success(`Screenshot captured for ${getTargetEmployeeName()}`);
    } catch (err: any) {
      toast.error("Screenshot capture cancelled or permission denied");
    }
  };

  // ─── C. Start Call Audio Recording ─────────────────────────────
  const startCallAudioRecording = async () => {
    try {
      recordedChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedBlobUrl(url);
        setRecordedMediaType("call_audio");
        setCapturedImageData(null);
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      toast.success("Call audio recording started");
    } catch (err: any) {
      toast.error("Microphone access denied or not supported");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const handleSaveRecording = () => {
    const empName = getTargetEmployeeName();
    const defaultTitle =
      recordedMediaType === "screenshot"
        ? `Screenshot - ${empName} - ${new Date().toLocaleDateString()}`
        : `${recordedMediaType === "screen_video" ? "Screen Interaction" : "Call Audio"} - ${empName} - ${new Date().toLocaleTimeString()}`;

    saveRecordingMutation.mutate({
      title: recordingTitle || defaultTitle,
      recording_type: recordedMediaType === "call_audio" ? "call" : "screen",
      media_type: recordedMediaType,
      file_url: recordedBlobUrl,
      image_data: capturedImageData,
      duration_seconds: recordingDuration,
      employee_id: selectedEmployeeId !== "all" ? selectedEmployeeId : null,
      employee_name: empName,
    });
  };

  // ─── Download to Local Machine ──────────────────────────────────
  const downloadToLocal = (item: any) => {
    const link = document.createElement("a");
    const safeEmp = (item.employee_name || "staff").replace(/\s+/g, "_");
    const dateStr = new Date(item.created_at).toISOString().split("T")[0];

    if (item.media_type === "screenshot" || item.image_data) {
      link.href = item.image_data || item.file_url;
      link.download = `axorks-screenshot-${safeEmp}-${dateStr}.png`;
    } else {
      link.href = item.file_url || recordedBlobUrl || "";
      link.download = `axorks-${item.recording_type || "screen"}-${safeEmp}-${dateStr}.webm`;
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("File downloaded to your local machine");
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatRemainingTime = (expiresAt: string) => {
    const expiry = new Date(expiresAt).getTime();
    const now = Date.now();
    const diff = expiry - now;
    if (diff <= 0) return "Expiring now";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m left`;
  };

  if (!isAuthorized) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4 max-w-lg mx-auto mt-12">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-100">Restricted Executive Console</h2>
        <p className="text-xs text-slate-400">
          Only the <strong>Founder</strong> (Muhammad Mujahid) and <strong>Co-Founder</strong> (Farhana Bakht) have authorization to access employee screen monitoring and call recordings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-violet-600 dark:text-violet-400" /> Employee Screen &amp; Call Recording Studio
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-500" /> Executive Surveillance
            </span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1">
            Capture employee screens, take instant screenshots, record audio logs • Stored for 1 day max with local download options
          </p>
        </div>

        {/* Expiry Policy Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 text-xs text-amber-900 dark:text-amber-300 font-bold shadow-xs">
          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>1-Day Auto-Purge Policy Active</span>
        </div>
      </div>

      {/* Main Recording Studio Controller */}
      <div className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-violet-600 dark:text-violet-400 animate-pulse" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Surveillance Studio Controls
            </h3>
          </div>

          {/* Target Employee Selection */}
          <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900 px-3.5 py-1.5 rounded-2xl border border-slate-300 dark:border-slate-700">
            <User className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-300">Target Employee:</span>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              disabled={isRecording}
              className="bg-transparent text-xs font-bold text-violet-700 dark:text-violet-300 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                All Staff / General
              </option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                  {emp.first_name} {emp.last_name || ""} ({emp.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Capture Mode Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            disabled={isRecording}
            onClick={() => setRecordingMode("screen")}
            className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${
              recordingMode === "screen"
                ? "bg-violet-50 dark:bg-violet-600/15 border-violet-500 text-violet-900 dark:text-violet-300 font-bold shadow-md ring-1 ring-violet-500/50"
                : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <Video className="w-6 h-6" />
            <span className="text-xs font-bold">Screen Video Recording</span>
            <span className="text-[10px] text-slate-500 font-medium">Record live interactive session</span>
          </button>

          <button
            disabled={isRecording}
            onClick={() => setRecordingMode("screenshot")}
            className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${
              recordingMode === "screenshot"
                ? "bg-emerald-50 dark:bg-emerald-600/15 border-emerald-500 text-emerald-900 dark:text-emerald-300 font-bold shadow-md ring-1 ring-emerald-500/50"
                : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <Camera className="w-6 h-6" />
            <span className="text-xs font-bold">Screen Snapshot</span>
            <span className="text-[10px] text-slate-500 font-medium">Take instant full-res screenshot</span>
          </button>

          <button
            disabled={isRecording}
            onClick={() => setRecordingMode("call")}
            className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${
              recordingMode === "call"
                ? "bg-cyan-50 dark:bg-cyan-600/15 border-cyan-500 text-cyan-900 dark:text-cyan-300 font-bold shadow-md ring-1 ring-cyan-500/50"
                : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <Mic className="w-6 h-6" />
            <span className="text-xs font-bold">Call Audio Capture</span>
            <span className="text-[10px] text-slate-500 font-medium">Record meeting / voice channel</span>
          </button>
        </div>

        {/* Action Trigger Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              {recordingMode === "screen" ? <Video className="w-5 h-5" /> : recordingMode === "screenshot" ? <Camera className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200">
                Target: <span className="text-violet-400">{getTargetEmployeeName()}</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                {recordingMode === "screen"
                  ? "Select employee window or entire screen to record"
                  : recordingMode === "screenshot"
                  ? "Capture high-resolution picture of employee workspace"
                  : "Record microphone voice notes or conference calls"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isRecording ? (
              <button
                onClick={stopRecording}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition animate-pulse"
              >
                <Square className="w-4 h-4" /> Stop Recording ({formatTime(recordingDuration)})
              </button>
            ) : (
              <button
                onClick={
                  recordingMode === "screen"
                    ? startScreenRecording
                    : recordingMode === "screenshot"
                    ? captureScreenshot
                    : startCallAudioRecording
                }
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 ${
                  recordingMode === "screenshot"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30"
                    : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-violet-600/30"
                }`}
              >
                {recordingMode === "screen" ? (
                  <>
                    <Video className="w-4 h-4" /> Start Screen Recording
                  </>
                ) : recordingMode === "screenshot" ? (
                  <>
                    <Camera className="w-4 h-4" /> Take Instant Screenshot
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" /> Start Audio Recording
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Live Preview / Save Section */}
        {(recordedBlobUrl || capturedImageData) && (
          <div className="p-5 rounded-2xl bg-slate-950 border border-violet-500/40 space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-xs font-bold text-violet-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Capture Ready: {getTargetEmployeeName()}
              </h4>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                1-Day Auto-Purge Expiry
              </span>
            </div>

            {/* Media Preview */}
            <div className="flex justify-center bg-black/80 rounded-xl overflow-hidden p-2">
              {recordedMediaType === "screenshot" ? (
                <img
                  src={capturedImageData || recordedBlobUrl!}
                  alt="Captured screenshot"
                  className="max-h-72 object-contain rounded-lg border border-slate-800"
                />
              ) : recordedMediaType === "screen_video" ? (
                <video src={recordedBlobUrl!} controls className="w-full max-h-72 rounded-lg bg-black" />
              ) : (
                <audio src={recordedBlobUrl!} controls className="w-full my-4" />
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <input
                type="text"
                value={recordingTitle}
                onChange={(e) => setRecordingTitle(e.target.value)}
                placeholder="Add custom title / notes for this capture..."
                className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 font-medium"
              />
              <button
                onClick={handleSaveRecording}
                disabled={saveRecordingMutation.isPending}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {saveRecordingMutation.isPending ? "Saving to Database..." : "Save to Library"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Saved Library (1-Day Max Storage) */}
      <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 space-y-4 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FileVideo className="w-4 h-4 text-violet-400" /> Active Employee Surveillance Library
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Recordings and screenshots automatically purge after 24 hours. Download local copies before expiry.
            </p>
          </div>

          <button
            onClick={() => refetch()}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            Refresh Library
          </button>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-500 font-mono">
            Loading surveillance records from Neon DB...
          </div>
        ) : recordings.length === 0 ? (
          <div className="py-14 text-center px-4 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-400 flex items-center justify-center mx-auto mb-2">
              <Video className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-200">No Active Recordings or Screenshots</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Captures will appear here and remain available for 24 hours before automatic database cleanup.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recordings.map((r: any) => {
              const isScreenshot = r.media_type === "screenshot" || Boolean(r.image_data);
              const remaining = formatRemainingTime(r.expires_at);

              return (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-3 shadow-lg group"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isScreenshot
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : r.recording_type === "call"
                            ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                            : "bg-violet-500/15 text-violet-400 border border-violet-500/30"
                        }`}
                      >
                        {isScreenshot ? (
                          <Camera className="w-4 h-4" />
                        ) : r.recording_type === "call" ? (
                          <Mic className="w-4 h-4" />
                        ) : (
                          <Video className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-slate-100 truncate" title={r.title}>
                          {r.title}
                        </h4>
                        <span className="text-[10px] text-violet-400 font-semibold flex items-center gap-1">
                          <User className="w-3 h-3" /> {r.employee_name || "Employee"}
                        </span>
                      </div>
                    </div>

                    {/* Expiry Badge */}
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                      ⏳ {remaining}
                    </span>
                  </div>

                  {/* Media Content Preview */}
                  <div className="rounded-xl overflow-hidden bg-black/60 border border-slate-800/80 max-h-40 flex items-center justify-center">
                    {isScreenshot ? (
                      <img
                        src={r.image_data || r.file_url}
                        alt="Screenshot thumbnail"
                        className="max-h-36 object-contain cursor-pointer hover:scale-105 transition"
                        onClick={() => setPreviewMedia(r)}
                      />
                    ) : r.recording_type === "call" ? (
                      <audio src={r.file_url} controls className="w-full p-2" />
                    ) : (
                      <video
                        src={r.file_url}
                        controls
                        className="w-full max-h-36 object-cover bg-black"
                      />
                    )}
                  </div>

                  {/* Metadata Row */}
                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-900">
                    <span>{new Date(r.created_at).toLocaleString()}</span>
                    <span className="font-mono text-slate-500">
                      {isScreenshot ? "PNG Snapshot" : `${r.duration_seconds || 0}s duration`}
                    </span>
                  </div>

                  {/* Action Buttons: Download & Delete */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => downloadToLocal(r)}
                      className="w-full py-2 px-3 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> Save Local
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Delete this recording now?")) {
                          deleteMutation.mutate(r.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full Size Preview Modal */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 space-y-4 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100">{previewMedia.title}</h3>
                <span className="text-xs text-violet-400">Target: {previewMedia.employee_name}</span>
              </div>
              <button
                onClick={() => setPreviewMedia(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center bg-black rounded-2xl p-2 max-h-[60vh] overflow-auto">
              {previewMedia.media_type === "screenshot" || previewMedia.image_data ? (
                <img
                  src={previewMedia.image_data || previewMedia.file_url}
                  alt="Full preview"
                  className="max-h-[55vh] object-contain rounded-lg"
                />
              ) : (
                <video src={previewMedia.file_url} controls className="max-h-[55vh] w-full rounded-lg" />
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => downloadToLocal(previewMedia)}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download to Computer
              </button>
              <button
                onClick={() => setPreviewMedia(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
