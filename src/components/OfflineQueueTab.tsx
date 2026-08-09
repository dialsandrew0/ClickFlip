import React, { useState } from "react";
import { OfflineQueueItem, ConditionAnswers } from "../types";
import { NICHE_CONFIGS } from "../nicheConfigs";
import { IconMap } from "./FocusModuleSelector";
import { 
  Wifi, 
  Trash2, 
  RefreshCw, 
  Sparkles, 
  Loader2, 
  Layers, 
  AlertTriangle,
  Database,
  CheckCircle,
  Clock
} from "lucide-react";

interface OfflineQueueTabProps {
  queue: OfflineQueueItem[];
  onRemoveFromQueue: (id: string) => void;
  onSyncItem: (queueItem: OfflineQueueItem) => Promise<boolean>;
}

export default function OfflineQueueTab({
  queue,
  onRemoveFromQueue,
  onSyncItem,
}: OfflineQueueTabProps) {
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncStatuses, setSyncStatuses] = useState<Record<string, "idle" | "syncing" | "done" | "error">>({});
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });

  const handleSyncSingle = async (item: OfflineQueueItem) => {
    setSyncStatuses(prev => ({ ...prev, [item.id]: "syncing" }));
    const success = await onSyncItem(item);
    if (success) {
      setSyncStatuses(prev => ({ ...prev, [item.id]: "done" }));
    } else {
      setSyncStatuses(prev => ({ ...prev, [item.id]: "error" }));
    }
  };

  const handleSyncAll = async () => {
    if (queue.length === 0) return;
    setSyncingAll(true);
    setSyncProgress({ current: 0, total: queue.length });

    // Sync sequentially to preserve network resources and request ordering
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      setSyncProgress(prev => ({ ...prev, current: i + 1 }));
      setSyncStatuses(prev => ({ ...prev, [item.id]: "syncing" }));
      
      const success = await onSyncItem(item);
      if (success) {
        setSyncStatuses(prev => ({ ...prev, [item.id]: "done" }));
      } else {
        setSyncStatuses(prev => ({ ...prev, [item.id]: "error" }));
      }
    }
    setSyncingAll(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Offline Hub Status Indicator */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold font-display text-stone-800 flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-500" />
              Offline Capture Queue
            </h2>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              When scout scouting in dead cell zones (thick estate sale walls or basements), photos save locally. Sync them once your signal returns.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {queue.length > 0 && (
              <button
                onClick={handleSyncAll}
                disabled={syncingAll}
                className="px-5 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 transition-all"
              >
                {syncingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-stone-300" />
                    Syncing {syncProgress.current}/{syncProgress.total}...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Sync All Saved Items ({queue.length})
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Queue Listing */}
      {queue.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-sm max-w-xl mx-auto">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <p className="text-stone-800 font-semibold font-display text-base">Your Queue is Completely Synced</p>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            All captured snapshots are successfully analyzed and located in your master inventory. Activate "Queue Offline" in your scanner config to reserve entries locally.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {queue.map((item) => {
            const niche = NICHE_CONFIGS.find(n => n.id === item.nicheId) || NICHE_CONFIGS[0];
            const status = syncStatuses[item.id] || "idle";
            const parsedTime = new Date(item.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div 
                key={item.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Photo with category overlay */}
                  <div className="relative h-48 bg-stone-100 overflow-hidden border-b border-stone-150">
                    <img 
                      src={item.image} 
                      alt="Offline capture" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border shadow-sm ${niche.badgeColor}`}>
                        {niche.name}
                      </span>
                      {item.quickVerdictOnly && (
                        <span className="text-[10px] bg-stone-900/95 text-stone-200 px-2 py-1 rounded-full font-bold shadow-sm">
                          Quick Mode
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 right-3 bg-stone-900/80 backdrop-blur text-[10px] text-stone-200 font-mono px-2 py-1 rounded-md flex items-center gap-1 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {parsedTime}
                    </div>
                  </div>

                  {/* Condition answers list */}
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-[11px] border-b border-stone-100 pb-2">
                      <div>
                        <span className="text-stone-400 block uppercase font-bold tracking-wider text-[9px]">Functional</span>
                        <span className="font-semibold text-stone-700 capitalize">{item.condition.functional}</span>
                      </div>
                      <div>
                        <span className="text-stone-400 block uppercase font-bold tracking-wider text-[9px]">Complete</span>
                        <span className="font-semibold text-stone-700 capitalize">{item.condition.complete}</span>
                      </div>
                    </div>

                    {item.condition.wearNotes && (
                      <div>
                        <span className="text-stone-400 block uppercase font-bold tracking-wider text-[9px] mb-0.5">Reported damage</span>
                        <p className="text-xs text-stone-600 bg-stone-50 p-2 rounded-lg border border-stone-150 leading-relaxed italic">
                          "{item.condition.wearNotes}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card footer controls depending on status */}
                <div className="p-4 border-t border-stone-100 bg-stone-50 flex items-center justify-between gap-2.5">
                  <button
                    disabled={status === "syncing" || syncingAll}
                    onClick={() => onRemoveFromQueue(item.id)}
                    className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    disabled={status === "syncing" || syncingAll}
                    onClick={() => handleSyncSingle(item)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                      status === "error"
                        ? "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
                        : "bg-stone-900 hover:bg-stone-800 text-white"
                    }`}
                  >
                    {status === "syncing" ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Syncing...
                      </>
                    ) : status === "error" ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Failed (Retry)
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        Sync to Server
                      </>
                    )}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
