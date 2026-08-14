"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { Phone, Plus } from "lucide-react";

interface CallsPanelProps {
  entityType: string;
  entityId: string;
}

export function CallsPanel({ entityType, entityId }: CallsPanelProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [direction, setDirection] = useState("outbound");
  const [duration, setDuration] = useState("");
  const [outcome, setOutcome] = useState("");

  const { data: calls = [] } = useQuery({
    queryKey: ["calls", entityType, entityId],
    queryFn: () => apiClient(`/api/v1/calls?entity_type=${entityType}&entity_id=${entityId}`),
    enabled: !!entityId,
  });

  const logCall = useMutation({
    mutationFn: () =>
      apiClient("/api/v1/calls", {
        method: "POST",
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          direction,
          duration_seconds: duration ? parseInt(duration) : null,
          outcome: outcome || null,
          called_at: new Date().toISOString(),
        }),
      }),
    onSuccess: () => {
      setShowForm(false);
      setDuration("");
      setOutcome("");
      queryClient.invalidateQueries({ queryKey: ["calls", entityType, entityId] });
      queryClient.invalidateQueries({ queryKey: ["timeline", entityType, entityId] });
      toast.success("Call logged");
    },
  });

  return (
    <div className="space-y-3">
      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 text-xs text-violet-400 hover:underline">
          <Plus className="w-3 h-3" /> Log a call
        </button>
      ) : (
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
          <div className="grid grid-cols-3 gap-2">
            <select value={direction} onChange={(e) => setDirection(e.target.value)} className="px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-100">
              <option value="outbound">Outbound</option>
              <option value="inbound">Inbound</option>
            </select>
            <input type="number" placeholder="Duration (sec)" value={duration} onChange={(e) => setDuration(e.target.value)} className="px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-100 placeholder-slate-500" />
            <input type="text" placeholder="Outcome" value={outcome} onChange={(e) => setOutcome(e.target.value)} className="px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-100 placeholder-slate-500" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-3 py-1 rounded bg-slate-800 text-slate-400 text-xs">Cancel</button>
            <button onClick={() => logCall.mutate()} className="px-3 py-1 rounded bg-violet-600 text-white text-xs">Save</button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-40 overflow-y-auto">
        {calls.map((call: any) => (
          <div key={call.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/40 border border-slate-800/60 text-xs">
            <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="font-medium text-slate-200 capitalize">{call.direction}</span>
              {call.duration_seconds && <span className="text-slate-500 ml-2">({call.duration_seconds}s)</span>}
              {call.outcome && <span className="text-slate-500 ml-2">• {call.outcome}</span>}
            </div>
            <span className="text-[10px] text-slate-600 shrink-0">{new Date(call.called_at).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
