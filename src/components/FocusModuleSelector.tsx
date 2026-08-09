import React from "react";
import { NicheConfig } from "../types";
import { NICHE_CONFIGS } from "../nicheConfigs";
import { 
  Layers, 
  Palette, 
  Coins, 
  Music, 
  Shirt, 
  Sparkles, 
  ChevronRight,
  ClipboardList
} from "lucide-react";

interface FocusModuleSelectorProps {
  selectedNicheId: string;
  onSelectNiche: (niche: NicheConfig) => void;
  onClose?: () => void;
}

// Map icon string names to Lucide icon components
export const IconMap: Record<string, React.ComponentType<any>> = {
  Sparkles: Sparkles,
  Layers: Layers,
  Palette: Palette,
  Coins: Coins,
  Music: Music,
  Shirt: Shirt,
};

export default function FocusModuleSelector({
  selectedNicheId,
  onSelectNiche,
  onClose,
}: FocusModuleSelectorProps) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xl relative">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer font-mono text-xs font-bold"
        >
          ✕ Close
        </button>
      )}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold font-display text-stone-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            Specialty Research Focus Presets
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Auto-Detect is active by default. You can also lock a specific specialty rulebook below:
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {NICHE_CONFIGS.map((niche) => {
          const IconComponent = IconMap[niche.icon] || Layers;
          const isSelected = niche.id === selectedNicheId;

          // Compute custom background styles depending on accent color
          let accentBg = "hover:bg-stone-50 border-stone-200";
          let iconColor = "text-stone-500";
          let activeBorder = "border-stone-300";

          if (isSelected) {
            if (niche.accentColor === "emerald") {
              accentBg = "bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20";
              iconColor = "text-emerald-600";
            } else if (niche.accentColor === "amber") {
              accentBg = "bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20";
              iconColor = "text-amber-600";
            } else if (niche.accentColor === "indigo") {
              accentBg = "bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20";
              iconColor = "text-indigo-600";
            } else if (niche.accentColor === "purple") {
              accentBg = "bg-purple-50/70 border-purple-500 ring-2 ring-purple-500/20";
              iconColor = "text-purple-600";
            } else if (niche.accentColor === "rose") {
              accentBg = "bg-rose-50/70 border-rose-500 ring-2 ring-rose-500/20";
              iconColor = "text-rose-600";
            }
          }

          return (
            <button
              key={niche.id}
              id={`niche-btn-${niche.id}`}
              onClick={() => onSelectNiche(niche)}
              className={`flex flex-col text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer relative overflow-hidden group ${accentBg}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg bg-white shadow-sm border border-stone-100 ${isSelected ? iconColor : "text-stone-400 group-hover:text-stone-700"}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                {isSelected && (
                  <span className="flex h-2 w-2 relative">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      niche.accentColor === "emerald" ? "bg-emerald-400" :
                      niche.accentColor === "amber" ? "bg-amber-400" :
                      niche.accentColor === "indigo" ? "bg-indigo-400" :
                      niche.accentColor === "purple" ? "bg-purple-400" : "bg-rose-400"
                    }`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${
                      niche.accentColor === "emerald" ? "bg-emerald-500" :
                      niche.accentColor === "amber" ? "bg-amber-500" :
                      niche.accentColor === "indigo" ? "bg-indigo-500" :
                      niche.accentColor === "purple" ? "bg-purple-500" : "bg-rose-500"
                    }`}></span>
                  </span>
                )}
              </div>
              <h3 className="font-medium text-sm text-stone-900 font-display">
                {niche.name}
              </h3>
              <p className="text-[11px] text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                {niche.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Focus details sub-panel */}
      {selectedNicheId && (
        <div className="mt-5 p-4 rounded-xl bg-stone-50 border border-stone-200 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 mb-2">
              <ClipboardList className="w-3.5 h-3.5" />
              Forensic Evidence Checklist
            </h4>
            <ul className="space-y-1.5">
              {NICHE_CONFIGS.find(n => n.id === selectedNicheId)?.checklist.map((item, idx) => (
                <li key={idx} className="text-xs text-stone-600 flex items-start gap-1.5">
                  <span className="text-stone-400 font-mono mt-0.5">{idx + 1}.</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t md:border-t-0 md:border-l border-stone-200 pt-3 md:pt-0 md:pl-4 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
                Active Valuation Rubric
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                {NICHE_CONFIGS.find(n => n.id === selectedNicheId)?.valuationRubric}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-stone-150 flex items-center justify-between text-[11px]">
              <span className="text-stone-500">Suggested Comps Target:</span>
              <span className="font-medium text-stone-700">
                {NICHE_CONFIGS.find(n => n.id === selectedNicheId)?.sampleComps}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
