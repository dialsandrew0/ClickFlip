import React, { useState } from "react";
import { ScannedItem, NicheConfig } from "../types";
import { NICHE_CONFIGS } from "../nicheConfigs";
import { IconMap } from "./FocusModuleSelector";
import NextMovePanel from "./NextMovePanel";
import StagingPhotoCoachPanel from "./StagingPhotoCoachPanel";
import { 
  Search, 
  Trash2, 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Coins, 
  ArrowUpRight,
  Clipboard,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Tag,
  TrendingUp,
  FileText,
  Ruler,
  CreditCard,
  Download,
  Sparkles,
  Check
} from "lucide-react";

interface InventoryTabProps {
  items: ScannedItem[];
  onDeleteItem: (id: string) => void;
  onLoadSampleItem?: () => void;
  onInspectDossier?: (item: ScannedItem) => void;
}

export default function InventoryTab({ items, onDeleteItem, onLoadSampleItem, onInspectDossier }: InventoryTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterNiche, setFilterNiche] = useState<string>("all");
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [checkedKnockouts, setCheckedKnockouts] = useState<Record<string, boolean>>({});

  const toggleKnockout = (key: string) => {
    setCheckedKnockouts(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Export inventory spreadsheet as CSV
  const handleExportCSV = () => {
    if (items.length === 0) return;

    const headers = [
      "Item ID",
      "Identified Name",
      "Verdict",
      "Category",
      "Target List Price ($)",
      "Conservative Low ($)",
      "High Est ($)",
      "Scanned Date",
      "Best Route Pathway",
      "Description"
    ];

    const rows = items.map(item => [
      `"${item.id}"`,
      `"${(item.verdict?.identifiedName || "Unidentified").replace(/"/g, '""')}"`,
      `"${item.verdict?.verdict || "UNKNOWN"}"`,
      `"${(item.verdict?.category || "General").replace(/"/g, '""')}"`,
      item.verdict?.suggestedListingPrice || 0,
      item.verdict?.lowValue || 0,
      item.verdict?.highValue || 0,
      `"${new Date(item.scannedAt).toLocaleDateString()}"`,
      `"${(item.verdict?.nextMoveStrategy?.bestOverallPath || "eBay").replace(/"/g, '""')}"`,
      `"${(item.verdict?.descriptionWriteup || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FlipFindr_Resale_Ledger_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger brief copy feedback animations
  const handleCopyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  // Filter logic
  const filteredItems = items.filter((item) => {
    const nameMatches = item.verdict?.identifiedName
      ? item.verdict.identifiedName.toLowerCase().includes(searchTerm.toLowerCase())
      : item.condition.wearNotes.toLowerCase().includes(searchTerm.toLowerCase()) || "unidentified item".includes(searchTerm.toLowerCase());
    
    const nicheMatches = filterNiche === "all" || item.nicheId === filterNiche;
    return nameMatches && nicheMatches;
  });

  // Calculate aggregated stats
  const totalScoutCount = items.length;
  const buyRecommendations = items.filter(i => i.verdict?.verdict === "BUY");
  const buyCount = buyRecommendations.length;
  
  // Projected value bounds
  const estLowSum = items.reduce((sum, item) => sum + (item.verdict?.lowValue || 0), 0);
  const estHighSum = items.reduce((sum, item) => sum + (item.verdict?.highValue || 0), 0);
  const estListSum = items.reduce((sum, item) => sum + (item.verdict?.suggestedListingPrice || 0), 0);

  const toggleExpandItem = (id: string) => {
    setExpandedItemId(expandedItemId === id ? null : id);
  };

  const getVerdictBadge = (verdict: "BUY" | "SKIP" | "PONDER" | undefined) => {
    switch (verdict) {
      case "BUY":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm font-display">
            <CheckCircle className="w-3.5 h-3.5" />
            BUY VERDICT
          </span>
        );
      case "SKIP":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 shadow-sm font-display">
            <XCircle className="w-3.5 h-3.5" />
            SKIP VERDICT
          </span>
        );
      case "PONDER":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-sm font-display">
            <AlertTriangle className="w-3.5 h-3.5" />
            PONDER/VERIFY
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-600 border border-stone-200">
            PROCESSING
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Control panel & filters */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2 max-w-md w-full relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search scouted items..."
            className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-500/10 focus:border-stone-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs text-stone-500 font-medium">Focus Filter:</span>
          <select
            value={filterNiche}
            onChange={(e) => setFilterNiche(e.target.value)}
            className="text-xs font-medium border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-stone-500/10 bg-white"
          >
            <option value="all">All Specialties</option>
            {NICHE_CONFIGS.map((niche) => (
              <option key={niche.id} value={niche.id}>
                {niche.name}
              </option>
            ))}
          </select>

          {items.length > 0 && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors ml-1"
              title="Download Master Ledger CSV for Excel / Taxes"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 sm:p-12 text-center shadow-sm max-w-xl mx-auto space-y-4">
          <div className="p-3.5 rounded-2xl bg-stone-100 text-stone-400 w-fit mx-auto border border-stone-200">
            <Layers className="w-8 h-8 text-stone-400" />
          </div>
          <div>
            <p className="text-stone-800 font-bold font-display text-base">No Scouted Items in Ledger</p>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto leading-relaxed">
              {items.length === 0 
                ? "You haven't scouted any items yet! Snap photos in the Lens Scanner or try a demo appraisal below to see full forensic AI dossiers, Next Move strategy pathways, and AI photo staging."
                : "No items match your active search terms or specialty filters."}
            </p>
          </div>

          {items.length === 0 && onLoadSampleItem && (
            <button
              type="button"
              onClick={onLoadSampleItem}
              className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 fill-stone-950" />
              <span>Load Sample Scouted Item (1970s Pyrex Casserole)</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const niche = NICHE_CONFIGS.find(n => n.id === item.nicheId) || NICHE_CONFIGS[0];
            const NicheIcon = IconMap[niche.icon] || Layers;
            const isExpanded = expandedItemId === item.id;
            const parsedDate = new Date(item.scannedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            });

            return (
              <div 
                key={item.id}
                id={`inventory-item-${item.id}`}
                className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm ${
                  isExpanded ? "border-stone-400 ring-2 ring-stone-900/5" : "border-stone-200 hover:border-stone-300"
                }`}
              >
                {/* Accordion Summary Row */}
                <div 
                  onClick={() => toggleExpandItem(item.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-stone-100 overflow-hidden border border-stone-150 shrink-0 shadow-inner">
                      <img 
                        src={item.image} 
                        alt="Scouted item" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-stone-900 truncate font-display text-sm sm:text-base">
                          {item.verdict?.identifiedName || "Appraising Item..."}
                        </h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${niche.badgeColor}`}>
                          {niche.name}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-stone-500 mt-1">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5" />
                          {parsedDate}
                        </span>
                        {item.condition && (
                          <span className="bg-stone-50 px-2 py-0.5 rounded border border-stone-100">
                            Cond: {item.condition.functional === "yes" ? "Functional" : item.condition.functional === "no" ? "Non-functional" : "Untested"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-none pt-3 sm:pt-0">
                    <div className="text-left sm:text-right">
                      {item.verdict ? (
                        <>
                          <div className="text-sm font-bold text-stone-800 font-mono">
                            ${item.verdict.lowValue} - ${item.verdict.highValue}
                          </div>
                          <div className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                            Est. Resale Price
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-amber-600 animate-pulse font-medium">Pending Analysis</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {getVerdictBadge(item.verdict?.verdict)}
                      <button
                        type="button"
                        className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-700 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Dossier Panel */}
                {isExpanded && (
                  <div className="border-t border-stone-150 bg-stone-50/50 p-5 sm:p-6 space-y-6 animate-fadeIn">
                    
                    {/* Top Action Bar to Open Dedicated Dossier Page */}
                    {onInspectDossier && (
                      <div className="bg-stone-900 text-stone-100 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-bold font-mono text-amber-300">
                            Dedicated God-Tier Dossier Page Available
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspectDossier(item);
                          }}
                          className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-black font-mono flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                        >
                          <span>Open Dossier Review Page →</span>
                        </button>
                      </div>
                    )}
                    
                    {/* Appraisal Core Verdict Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      
                      {/* Left: Forensic insights & identifiers */}
                      <div className="md:col-span-7 space-y-5">
                        
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                            Item Identification & Context
                          </h4>
                          <p className="text-sm text-stone-800 bg-white p-4 rounded-xl border border-stone-200 shadow-xs leading-relaxed">
                            {item.verdict?.identifiedName} — confidence score: <strong className="text-stone-900">{item.verdict?.confidence}%</strong>.
                          </p>
                        </div>

                        {/* Measured Physical Dimensions (Scale Calibration) */}
                        {item.verdict?.estimatedDimensions && (
                          <div className="bg-emerald-50/60 border border-emerald-200/80 p-4 rounded-xl shadow-xs">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5 mb-1">
                              <Ruler className="w-4 h-4 text-emerald-600" />
                              Calibrated Physical Dimensions
                            </h4>
                            <p className="text-sm font-bold text-emerald-900 font-mono">
                              {item.verdict.estimatedDimensions.rawMeasurementText || `${item.verdict.estimatedDimensions.widthCm}cm × ${item.verdict.estimatedDimensions.heightCm}cm`}
                            </p>
                            <p className="text-[10px] text-emerald-700 mt-1 font-medium">
                              {item.verdict.estimatedDimensions.calibrationMethod}
                            </p>
                          </div>
                        )}

                        {/* Niche Valuation Methodology Breakdown */}
                        {item.verdict?.valuationMethodology && (
                          <div className="bg-stone-100/70 border border-stone-250 p-4 rounded-xl shadow-xs">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5 mb-1">
                              <TrendingUp className="w-4 h-4 text-stone-600" />
                              God-Tier Specialty Valuation Mechanics
                            </h4>
                            <p className="text-xs text-stone-800 leading-relaxed">
                              {item.verdict.valuationMethodology}
                            </p>
                          </div>
                        )}

                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                            Observed Hallmark Identifiers
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {item.verdict?.keyIdentifiers && item.verdict.keyIdentifiers.length > 0 ? (
                              item.verdict.keyIdentifiers.map((tag, idx) => (
                                <span key={idx} className="bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-xs text-stone-700 shadow-xs flex items-center gap-1">
                                  <Tag className="w-3 h-3 text-stone-400" />
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-stone-500 italic">No specific physical hallmarks isolated in photo.</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                            Reproduction Red Flags & Tells to Verify
                          </h4>
                          <div className="bg-amber-50/40 border border-amber-200/60 rounded-xl p-4 space-y-2">
                            {item.verdict?.reproTells && item.verdict.reproTells.length > 0 ? (
                              item.verdict.reproTells.map((tell, idx) => (
                                <div key={idx} className="text-xs text-amber-900 flex items-start gap-2">
                                  <span className="font-bold text-amber-600 mt-0.5">•</span>
                                  <p className="leading-relaxed">{tell}</p>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-stone-500 italic">No major reproduction risks identified. Standard wear patterns apply.</p>
                            )}
                          </div>
                        </div>

                        {/* Interactive Knockout Physical Inspection Checkboxes */}
                        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 text-stone-100 shadow-md space-y-2.5">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold font-mono text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                              <CheckCircle className="w-4 h-4 text-amber-400" />
                              Knockout Inspection Checkboxes (In-Hand)
                            </h4>
                            <span className="text-[10px] text-stone-400 font-mono">1-Tap Verification</span>
                          </div>
                          <p className="text-[11px] text-stone-400 leading-relaxed">
                            Tap to check off physical hallmarks or damage points before purchasing or listing:
                          </p>

                          <div className="space-y-2 pt-1">
                            {(item.verdict?.reproTells && item.verdict.reproTells.length > 0
                              ? item.verdict.reproTells
                              : ["Verify hallmark relief stamp on base", "Check for hidden hairline cracks or chips", "Verify weight resonance and material composition"]
                            ).map((check, idx) => {
                              const checkKey = `${item.id}-knockout-${idx}`;
                              const isChecked = !!checkedKnockouts[checkKey];
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => toggleKnockout(checkKey)}
                                  className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-start gap-2.5 transition-all cursor-pointer ${
                                    isChecked
                                      ? "bg-emerald-950/80 border-emerald-500/80 text-emerald-200 line-through opacity-85"
                                      : "bg-stone-950 border-stone-800 text-stone-200 hover:border-stone-700"
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center mt-0.5 ${
                                    isChecked ? "bg-emerald-500 border-emerald-400 text-stone-950" : "border-stone-600 bg-stone-900"
                                  }`}>
                                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                  <span className="leading-relaxed">{check}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Real Comps Deep Link */}
                        <div className="pt-2">
                          <a
                            href={item.verdict?.ebaySoldSearchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 py-3 px-5 rounded-xl text-xs font-bold bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 transition-colors cursor-pointer shadow-xs"
                          >
                            <Coins className="w-4 h-4 text-amber-500" />
                            Research Completed & Sold Listing Comps on eBay
                            <ArrowUpRight className="w-3.5 h-3.5 text-stone-500" />
                          </a>
                        </div>

                      </div>

                      {/* Right: Reseller listing templates (copy/paste) */}
                      <div className="md:col-span-5 space-y-4 border-t md:border-t-0 md:border-l border-stone-200 pt-5 md:pt-0 md:pl-6">
                        
                        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
                          <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center justify-between mb-2">
                            <span>Sellers Listing Title</span>
                            <button
                              onClick={() => handleCopyToClipboard(item.verdict?.listingTitle || "", `title-${item.id}`)}
                              className="p-1 hover:bg-stone-50 rounded text-stone-400 hover:text-stone-600 transition-all flex items-center gap-1 cursor-pointer font-sans normal-case text-[10px]"
                            >
                              <Copy className="w-3 h-3" />
                              {copiedStates[`title-${item.id}`] ? "Copied!" : "Copy Title"}
                            </button>
                          </h4>
                          <p className="text-xs font-semibold text-stone-800 bg-stone-50 p-2.5 rounded-lg border border-stone-150 font-mono select-all">
                            {item.verdict?.listingTitle}
                          </p>
                        </div>

                        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
                          <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center justify-between mb-2">
                            <span>Target Resale Pricing</span>
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-150">
                              <span className="text-[10px] text-stone-500 block uppercase tracking-wider font-semibold">Suggested price</span>
                              <span className="text-lg font-bold text-stone-800 font-mono">${item.verdict?.suggestedListingPrice}</span>
                            </div>
                            <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                              <span className="text-[10px] text-emerald-600 block uppercase tracking-wider font-semibold">Value ceiling</span>
                              <span className="text-lg font-bold text-emerald-800 font-mono">${item.verdict?.highValue}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
                          <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center justify-between mb-2">
                            <span>Description Template</span>
                            <button
                              onClick={() => handleCopyToClipboard(item.verdict?.descriptionWriteup || "", `desc-${item.id}`)}
                              className="p-1 hover:bg-stone-50 rounded text-stone-400 hover:text-stone-600 transition-all flex items-center gap-1 cursor-pointer font-sans normal-case text-[10px]"
                            >
                              <Clipboard className="w-3.5 h-3.5" />
                              {copiedStates[`desc-${item.id}`] ? "Copied!" : "Copy Description"}
                            </button>
                          </h4>
                          <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-150 h-32 overflow-y-auto select-all">
                            {item.verdict?.descriptionWriteup}
                          </p>
                        </div>

                        {/* Search keyword tags */}
                        {item.verdict?.listingKeywords && item.verdict.listingKeywords.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Recommended listing tags</span>
                            <div className="flex flex-wrap gap-1">
                              {item.verdict.listingKeywords.map((tag, tIdx) => (
                                <span key={tIdx} className="bg-stone-200/60 text-stone-700 text-[10px] font-medium px-2 py-0.5 rounded font-mono">
                                  #{tag.replace(/\s+/g, "")}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>

                    </div>

                    {/* God-Tier Next Move Strategic Pathways AI */}
                    <div className="border-t border-stone-200 pt-6">
                      <NextMovePanel
                        strategy={item.verdict?.nextMoveStrategy}
                        itemTitle={item.verdict?.identifiedName || "Scouted Item"}
                        suggestedPrice={item.verdict?.suggestedListingPrice}
                      />
                    </div>

                    {/* AI Studio Photo Op & Staging Coach */}
                    <div className="border-t border-stone-200 pt-6">
                      <StagingPhotoCoachPanel
                        guide={item.verdict?.stagingPhotoGuide}
                        itemTitle={item.verdict?.identifiedName || "Scouted Item"}
                      />
                    </div>

                    {/* Bottom Utility controls */}
                    <div className="border-t border-stone-200 pt-4 flex justify-between items-center text-xs text-stone-400">
                      <span>Unique ID: <strong className="font-mono text-[10px]">{item.id}</strong></span>
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="flex items-center gap-1.5 text-stone-400 hover:text-red-600 transition-colors py-1 px-2.5 rounded-lg hover:bg-red-50 cursor-pointer font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Item Log
                      </button>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Casual, Compact & Noticeable Reseller Financial Ledger Footer Strip */}
      {totalScoutCount > 0 && (
        <div className="bg-stone-900 text-stone-100 rounded-2xl p-4 border border-stone-800 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-bold text-amber-300 uppercase tracking-wider font-sans text-xs">
                Ledger Financial Summary
              </span>
              <span className="text-stone-700 hidden sm:inline">•</span>
              <span className="text-stone-400 font-sans text-xs hidden sm:inline">
                {totalScoutCount} Items Scouted ({buyCount} Buy Deals • {totalScoutCount > 0 ? Math.round((buyCount / totalScoutCount) * 100) : 0}% Rate)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2">
                <span className="text-stone-400 text-[11px] font-sans">Valuation Range:</span>
                <span className="font-bold text-stone-200">
                  ${estLowSum.toLocaleString()} – ${estHighSum.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-2 bg-stone-800/90 px-3 py-1.5 rounded-xl border border-stone-700/80">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-stone-300 text-[11px] font-sans">Projected Revenue:</span>
                <span className="font-extrabold text-emerald-400 text-sm">
                  ${estListSum.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
