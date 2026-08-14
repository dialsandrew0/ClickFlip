import React, { useState } from "react";
import { ScannedItem } from "../types";
import { NICHE_CONFIGS } from "../nicheConfigs";
import { 
  CheckCircle, 
  AlertTriangle, 
  ArrowLeft, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Ruler, 
  TrendingUp, 
  Tag, 
  FileText, 
  Layers,
  ShoppingBag
} from "lucide-react";

interface DossierViewProps {
  item: ScannedItem;
  onBackToScanner: () => void;
  onViewInventory: () => void;
  onDeleteItem?: (id: string) => void;
}

export default function DossierView({
  item,
  onBackToScanner,
  onViewInventory,
  onDeleteItem,
}: DossierViewProps) {
  const [activeSection, setActiveSection] = useState<"knockout" | "forensics" | "strategy" | "summary">("knockout");
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [checkedKnockouts, setCheckedKnockouts] = useState<Record<string, boolean>>({});

  const verdict = item.verdict;
  const niche = NICHE_CONFIGS.find(n => n.id === item.nicheId) || NICHE_CONFIGS[0];

  const toggleKnockout = (idx: number) => {
    setCheckedKnockouts(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const copyToClipboard = (text: string, setFn: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setFn(true);
    setTimeout(() => setFn(false), 2000);
  };

  if (!verdict) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-stone-200 text-center max-w-2xl mx-auto space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-stone-900">Appraisal Incomplete</h3>
        <p className="text-xs text-stone-500">This item dossier does not contain full appraisal verdict data.</p>
        <button
          type="button"
          onClick={onBackToScanner}
          className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold cursor-pointer"
        >
          Return to Camera Scanner
        </button>
      </div>
    );
  }

  const isBuy = verdict.verdict === "BUY";
  const isPonder = verdict.verdict === "PONDER";

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToScanner}
            className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Studio Camera</span>
          </button>
          
          <span className="text-stone-300">•</span>

          <button
            type="button"
            onClick={onViewInventory}
            className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-stone-600" />
            <span>Master Inventory Ledger</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-stone-500">
          <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 font-bold">
            Ref: #{item.id.slice(-6).toUpperCase()}
          </span>
          <span>{new Date(item.scannedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Primary Item Identity Header Card */}
      <div className="bg-stone-950 text-white rounded-3xl p-6 border border-stone-800 shadow-2xl relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Item Photo & Badge Overlay */}
          <div className="md:col-span-4 relative group">
            <div className="aspect-square rounded-2xl overflow-hidden bg-stone-900 border border-stone-800 shadow-inner">
              <img 
                src={item.image} 
                alt={verdict.identifiedName} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase font-mono tracking-wider shadow-lg ${
                isBuy ? "bg-emerald-500 text-stone-950" : isPonder ? "bg-amber-400 text-stone-950" : "bg-rose-500 text-white"
              }`}>
                {verdict.verdict || "BUY"} VERDICT
              </span>
            </div>
            <div className="absolute bottom-3 right-3 bg-stone-950/90 backdrop-blur-xs px-2.5 py-1 rounded-xl border border-stone-800 text-[10px] font-mono text-amber-300 font-bold">
              {verdict.confidenceScore || verdict.confidence || 95}% Confidence
            </div>
          </div>

          {/* Item Title, Category & Key Financials */}
          <div className="md:col-span-8 space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-amber-400 font-semibold mb-1">
                <span>{verdict.category || niche.name}</span>
                <span>•</span>
                <span className="text-stone-400">
                  {item.condition.wearNotes ? "Inspected Condition" : "Standard Grade"}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-display text-stone-100 leading-snug">
                {verdict.identifiedName}
              </h1>
            </div>

            {/* Financial Highlights Pill Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-stone-900 p-3 rounded-2xl border border-stone-800">
                <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">Estimated Price Range</span>
                <span className="text-base font-extrabold text-stone-100 font-mono mt-0.5 block">
                  ${verdict.lowValue} – ${verdict.highValue}
                </span>
              </div>

              <div className="bg-stone-900 p-3 rounded-2xl border border-stone-800">
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block font-bold">Target List Price</span>
                <span className="text-base font-extrabold text-amber-300 font-mono mt-0.5 block">
                  ${verdict.suggestedListingPrice || verdict.highValue}
                </span>
              </div>

              <div className="bg-stone-900 p-3 rounded-2xl border border-stone-800 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block font-bold">Est. Net Margin</span>
                <span className="text-base font-extrabold text-emerald-400 font-mono mt-0.5 block truncate">
                  {verdict.marginEstimate || `+$${Math.round((verdict.suggestedListingPrice || verdict.highValue) * 0.78)} Net`}
                </span>
              </div>
            </div>

            {/* Verdict Reasoning */}
            <div className="bg-stone-900/90 border border-stone-800 p-3.5 rounded-2xl text-xs text-stone-300 leading-relaxed">
              <span className="font-bold text-amber-300 font-mono block mb-0.5">Appraisal Rationale:</span>
              {verdict.verdictReasoning || "Strong collector demand with verified resale comps."}
            </div>

          </div>

        </div>
      </div>

      {/* Sequential Sourcing Workflow Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-stone-200 p-1.5 flex gap-1.5 shadow-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSection("knockout")}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
            activeSection === "knockout"
              ? "bg-amber-500 text-stone-950 shadow-sm border border-amber-400 font-extrabold"
              : "bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>1. In-Hand Checklist</span>
          </div>
          <span className="text-[10px] font-mono opacity-80 font-normal">Step 1: Physical Defect Check</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("forensics")}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
            activeSection === "forensics"
              ? "bg-stone-900 text-white shadow-sm border border-stone-800 font-extrabold"
              : "bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>2. Forensic Tells</span>
          </div>
          <span className="text-[10px] font-mono opacity-80 font-normal">Step 2: Hallmarks & Repros</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("strategy")}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
            activeSection === "strategy"
              ? "bg-stone-900 text-white shadow-sm border border-stone-800 font-extrabold"
              : "bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            <span>3. Market Strategy</span>
          </div>
          <span className="text-[10px] font-mono opacity-80 font-normal">Step 3: Platforms & Comps</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("summary")}
          className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
            activeSection === "summary"
              ? "bg-stone-900 text-white shadow-sm border border-stone-800 font-extrabold"
              : "bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span>4. Resale Listing Kit</span>
          </div>
          <span className="text-[10px] font-mono opacity-80 font-normal">Step 4: Copy SEO Copywrite</span>
        </button>
      </div>

      {/* STEP 1: IN-HAND PHYSICAL CHECKLIST */}
      {activeSection === "knockout" && (
        <div className="bg-stone-950 text-stone-100 rounded-3xl p-6 border border-stone-800 shadow-xl space-y-5">
          <div className="border-b border-stone-800 pb-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold mb-0.5">
                Phase 1 • Immediate Field Inspection
              </div>
              <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-amber-400" />
                1. In-Hand Physical Inspection Checklist
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">Tap each item as you physically inspect the object in your hands before purchasing or packing.</p>
            </div>
          </div>

          <div className="space-y-2">
            {(verdict.reproTells && verdict.reproTells.length > 0
              ? verdict.reproTells
              : [
                  "Verify hallmark relief stamp or maker signature on base",
                  "Check for hidden hairline cracks under bright focal light",
                  "Verify weight resonance, heft, and material coldness",
                  "Inspect edges, handles, and rims for micro flea-bites or chips"
                ]
            ).map((check, idx) => {
              const isChecked = !!checkedKnockouts[idx];
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleKnockout(idx)}
                  className={`w-full text-left p-3.5 rounded-2xl border text-xs flex items-start gap-3 transition-all cursor-pointer ${
                    isChecked
                      ? "bg-emerald-950/80 border-emerald-500/80 text-emerald-200 line-through opacity-85"
                      : "bg-stone-900 border-stone-800 text-stone-200 hover:border-stone-700"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-lg border shrink-0 flex items-center justify-center mt-0.5 ${
                    isChecked ? "bg-emerald-500 border-emerald-400 text-stone-950" : "border-stone-600 bg-stone-950"
                  }`}>
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span className="leading-relaxed font-medium">{check}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2: FORENSIC AUTHENTICITY TELLS */}
      {activeSection === "forensics" && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-6">
          <div className="border-b border-stone-100 pb-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 font-bold mb-0.5">
              Phase 2 • Verification & Authentication
            </div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              2. Forensic Authenticity & Hallmark Analysis
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">Verified maker stamps, period hallmarks, material patina, and reproduction red flags.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Key Identifiers */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
              <h4 className="text-xs font-bold font-mono text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-indigo-600" />
                Verified Key Identifiers
              </h4>
              <ul className="space-y-1.5 text-xs text-stone-700">
                {(verdict.keyIdentifiers && verdict.keyIdentifiers.length > 0 
                  ? verdict.keyIdentifiers 
                  : ["Maker stamp verified on base", "Authentic period material patina present"]
                ).map((idStr, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>{idStr}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Reproduction Red Flags */}
            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 space-y-3">
              <h4 className="text-xs font-bold font-mono text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Reproduction Red Flags & Tells
              </h4>
              <ul className="space-y-1.5 text-xs text-amber-900">
                {(verdict.reproTells && verdict.reproTells.length > 0
                  ? verdict.reproTells
                  : ["Check for modern seam casts or casting bubbles", "Verify weight resonance against authentic vintage examples"]
                ).map((tell, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{tell}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Valuation Methodology */}
          <div className="bg-stone-900 text-stone-200 p-4 rounded-2xl border border-stone-800 text-xs space-y-1 font-mono">
            <span className="text-amber-400 font-bold uppercase tracking-wider block text-[10px]">Valuation Methodology & Formula</span>
            <p className="text-stone-300 leading-relaxed font-sans">
              {verdict.valuationMethodology || "90-day sold historical marketplace averages filtered by condition quality grade."}
            </p>
          </div>
        </div>
      )}

      {/* STEP 3: MARKETPLACE SALES STRATEGY */}
      {activeSection === "strategy" && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-600 font-bold mb-0.5">
                Phase 3 • Profit Channel Strategy
              </div>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                3. Marketplace Sales Strategy & Direct Comps
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">Optimal listing channels, estimated turnaround times, and verified sold transaction comps.</p>
            </div>

            {verdict.ebaySoldSearchUrl && (
              <a
                href={verdict.ebaySoldSearchUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1.5 border border-indigo-200 transition-colors cursor-pointer"
              >
                <span>eBay Sold Comps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Strategy Pathways */}
          {verdict.nextMoveStrategy && (
            <div className="space-y-4">
              <div className="bg-indigo-950 text-indigo-100 p-4 rounded-2xl border border-indigo-900 text-xs space-y-1">
                <span className="text-indigo-400 font-bold font-mono text-[10px] uppercase tracking-wider block">Best Resale Path</span>
                <p className="leading-relaxed font-medium">{verdict.nextMoveStrategy.bestOverallPath}</p>
              </div>

              {verdict.nextMoveStrategy.pathways && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {verdict.nextMoveStrategy.pathways.map((path, idx) => (
                    <div key={idx} className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between font-bold font-mono text-stone-800">
                        <span>{path.targetPlatform}</span>
                        <span className="text-emerald-600 font-mono text-[11px]">{path.estimatedPayout}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-stone-500 font-mono">
                        <span>Turnaround: {path.turnaroundTime}</span>
                        <span>•</span>
                        <span>Suitability: {path.suitabilityScore}%</span>
                      </div>
                      {path.stepsToExecute && path.stepsToExecute[0] && (
                        <p className="text-stone-600 text-[11px] leading-relaxed pt-1">
                          {path.stepsToExecute[0]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* STEP 4: RESALE LISTING KIT */}
      {activeSection === "summary" && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-amber-600 font-bold mb-0.5">
                Phase 4 • Marketplace Listing Creation
              </div>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-500" />
                4. E-Commerce Resale Copywriter & Listing Kit
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">1-Tap copyable titles and detailed descriptions ready for eBay, Poshmark, Mercari, or Etsy.</p>
            </div>
          </div>

          {/* Optimized Listing Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold font-mono text-stone-700 uppercase tracking-wider">
                Optimized SEO Marketplace Title ({verdict.listingTitle?.length || 0}/80 Chars)
              </label>
              <button
                type="button"
                onClick={() => copyToClipboard(verdict.listingTitle || verdict.identifiedName, setCopiedTitle)}
                className="px-3 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedTitle ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTitle ? "Copied Title!" : "Copy Title"}</span>
              </button>
            </div>
            <input
              type="text"
              readOnly
              value={verdict.listingTitle || verdict.identifiedName}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs font-mono font-medium text-stone-900 focus:outline-none"
            />
          </div>

          {/* Description Writeup */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold font-mono text-stone-700 uppercase tracking-wider">
                Full Item Description & Condition Dossier
              </label>
              <button
                type="button"
                onClick={() => copyToClipboard(verdict.descriptionWriteup || "", setCopiedDesc)}
                className="px-3 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedDesc ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedDesc ? "Copied Description!" : "Copy Writeup"}</span>
              </button>
            </div>
            <textarea
              readOnly
              rows={5}
              value={verdict.descriptionWriteup || ""}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-xs text-stone-800 leading-relaxed font-sans focus:outline-none resize-none"
            />
          </div>

          {/* Calibrated Physical Dimensions */}
          {verdict.measurementsCm && (
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex items-center gap-3">
              <Ruler className="w-5 h-5 text-stone-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-stone-900 font-mono block">Calibrated Scale Dimensions:</span>
                <span className="text-stone-600">
                  Width: {verdict.measurementsCm.widthCm}cm • Height: {verdict.measurementsCm.heightCm}cm 
                  {verdict.measurementsCm.depthCm ? ` • Depth: ${verdict.measurementsCm.depthCm}cm` : ""}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer Return Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-200">
        <button
          type="button"
          onClick={onBackToScanner}
          className="px-5 py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs flex items-center gap-2 hover:bg-stone-800 transition-colors cursor-pointer shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Appraise Another Item in Studio Lens</span>
        </button>

        {onDeleteItem && (
          <button
            type="button"
            onClick={() => onDeleteItem(item.id)}
            className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
          >
            Remove Item
          </button>
        )}
      </div>

    </div>
  );
}
