"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import {
  Video,
  Mic,
  Square,
  Play,
  Pause,
  Download,
  Trash2,
  Sparkles,
  Crown,
  Radio,
  FileVideo,
} from "lucide-react";

export default function FounderRecordingsPage() {
  const queryClient = useQueryClient();
  const [recordingType, setRecordingType] = useState<"screen" | "call">("screen");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [recordingTitle, setRecordingTitle] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: recordings = [], isLoading } = useQuery({
    queryKey: ["iam-recordings"],
    queryFn: () => apiClient("/api/v1/iam/recordings"),
  });

  const saveRecordingMutation = useMutation({
    mutationFn: (body: any) =>
      apiClient("/api/v1/iam/recordings", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      toast.success("Recording saved to Founder Library");
      queryClient.invalidateQueries({ queryKey: ["iam-recordings"] });
      setRecordedBlobUrl(null);
      setRecordingTitle("");
      setRecordingDuration(0);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save recording");
    },
  });

  const startScreenRecording = async () => {
    try {
      recordedChunksRef.current = [];
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream);
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
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      toast.success("Screen recording started");
    } catch (err: any) {
      toast.error("Screen recording cancelled or not supported");
    }
  };

  const startCallAudioRecording = async () => {
    try {
      recordedChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
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
      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const handleSaveRecording = () => {
    const title = recordingTitle || `${recordingType === "screen" ? "Screen Interaction" : "Call Audio"} Session - ${new Date().toLocaleTimeString()}`;
    saveRecordingMutation.mutate({
      title,
      recording_type: recordingType,
      file_url: recordedBlobUrl,
      duration_seconds: recordingDuration,
    });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base md:text-lg font-bold tracking-tight">
              Founder Screen Capture & Call Recording Studio
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Crown className="w-3 h-3 text-amber-500" /> Founder Supreme
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-0.5">
            Record, capture, and review employee screen interactions, discovery calls, and audio logs
          </p>
        </div>
      </div>

      {/* Live Recording Studio Controller */}
      <div className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-4 h-4 text-violet-500 animate-pulse" /> Live Recording Controls
          </h3>
          {isRecording && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-mono font-bold animate-pulse border border-rose-500/30">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> REC {formatTime(recordingDuration)}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Recording Mode Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-400">Select Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={isRecording}
                onClick={() => setRecordingType("screen")}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition ${
                  recordingType === "screen"
                    ? "bg-violet-600/10 border-violet-500 text-violet-400 font-bold"
                    : "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
                }`}
              >
                <Video className="w-6 h-6" />
                <span className="text-xs">Screen Capture</span>
              </button>

              <button
                disabled={isRecording}
                onClick={() => setRecordingType("call")}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition ${
                  recordingType === "call"
                    ? "bg-cyan-500/10 border-cyan-500 text-cyan-400 font-bold"
                    : "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
                }`}
              >
                <Mic className="w-6 h-6" />
                <span className="text-xs">Call Audio</span>
              </button>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-col items-center justify-center space-y-4">
            {!isRecording ? (
              <button
                onClick={recordingType === "screen" ? startScreenRecording : startCallAudioRecording}
                className="w-full sm:w-64 py-3.5 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 transition"
              >
                {recordingType === "screen" ? <Video className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                Start {recordingType === "screen" ? "Screen Recording" : "Call Audio Recording"}
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="w-full sm:w-64 py-3.5 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition animate-pulse"
              >
                <Square className="w-4 h-4" /> Stop Recording ({formatTime(recordingDuration)})
              </button>
            )}
          </div>
        </div>

        {/* Live Preview / Save Section */}
        {recordedBlobUrl && (
          <div className="mt-4 p-4 rounded-xl bg-slate-900/80 border border-violet-500/30 space-y-4">
            <h4 className="text-xs font-bold text-violet-400">Recording Preview & Save</h4>

            {recordingType === "screen" ? (
              <video src={recordedBlobUrl} controls className="w-full max-h-64 rounded-lg bg-black" />
            ) : (
              <audio src={recordedBlobUrl} controls className="w-full" />
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={recordingTitle}
                onChange={(e) => setRecordingTitle(e.target.value)}
                placeholder="Enter title for this recording..."
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
              <button
                onClick={handleSaveRecording}
                disabled={saveRecordingMutation.isPending}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs transition disabled:opacity-50"
              >
                {saveRecordingMutation.isPending ? "Saving..." : "Save to Library"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recording Library */}
      <div className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <FileVideo className="w-4 h-4 text-violet-400" /> Saved Screen & Call Recordings Library
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recordings.map((r: any) => (
            <div key={r.id} className="p-4 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center">
                    {r.recording_type === "screen" ? <Video className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate max-w-[160px]">{r.title}</h4>
                    <span className="text-[10px] text-slate-500 capitalize">{r.recording_type} • {r.duration_seconds || 0}s</span>
                  </div>
                </div>
              </div>

              {r.file_url && (
                <div>
                  {r.recording_type === "screen" ? (
                    <video src={r.file_url} controls className="w-full max-h-32 rounded bg-black" />
                  ) : (
                    <audio src={r.file_url} controls className="w-full" />
                  )}
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 flex justify-between">
                <span>{new Date(r.created_at).toLocaleDateString()}</span>
                <span className="font-mono">Founder Access</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
