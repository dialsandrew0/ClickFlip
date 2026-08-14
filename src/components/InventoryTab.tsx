import React, { useState } from "react";
import { ScannedItem, NicheConfig } from "../types";
import { NICHE_CONFIGS } from "../nicheConfigs";
import { IconMap } from "./FocusModuleSelector";
import NextMovePanel from "./NextMovePanel";
import StagingPhotoCoachPanel from "./StagingPhotoCoachPanel";
import { motion } from "motion/react";
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
  Check,
  Camera,
  ScanLine,
  ShieldCheck,
  ShoppingBag,
  SearchX,
  RotateCcw
} from "lucide-react";

interface InventoryTabProps {
  items: ScannedItem[];
  onDeleteItem: (id: string) => void;
  onLoadSampleItem?: () => void;
  onInspectDossier?: (item: ScannedItem) => void;
  onStartScan?: () => void;
}

export default function InventoryTab({ items, onDeleteItem, onLoadSampleItem, onInspectDossier, onStartScan }: InventoryTabProps) {
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
        items.length === 0 ? (
          /* Animated God-Tier Empty State when NO items exist in ledger */
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 shadow-lg text-center max-w-2xl mx-auto space-y-8 overflow-hidden relative"
          >
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-800 border border-amber-300 text-xs font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
              <span>Resale Intelligence Ledger</span>
            </div>

            {/* Interactive Viewfinder Radar Visual */}
            <div className="relative w-full max-w-md mx-auto aspect-4/3 rounded-3xl bg-stone-950 border border-stone-800 overflow-hidden shadow-2xl flex items-center justify-center p-6 my-2">
              {/* Radial Grid Pattern */}
              <div 
                className="absolute inset-0 opacity-20" 
                style={{ 
                  backgroundImage: "radial-gradient(#f59e0b 1px, transparent 1px)", 
                  backgroundSize: "20px 20px" 
                }} 
              />

              {/* Ambient Glowing Aura */}
              <div className="absolute -top-12 -left-12 w-40 h-40 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

              {/* Vertical Sweeping Radar Laser Beam */}
              <motion.div
                animate={{ y: ["-120%", "120%", "-120%"] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-x-0 h-20 bg-gradient-to-b from-transparent via-amber-500/25 to-transparent border-b border-amber-400/50 pointer-events-none z-10"
              />

              {/* Viewfinder Target Framing Corners */}
              <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-amber-400 rounded-tl-md" />
              <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-amber-400 rounded-tr-md" />
              <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-amber-400 rounded-bl-md" />
              <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-amber-400 rounded-br-md" />

              {/* Center Lens Scanner Target with Pulsing Rings */}
              <div className="relative z-20 flex flex-col items-center text-center space-y-3">
                <div className="relative flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.7, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                    className="absolute w-20 h-20 rounded-full border-2 border-amber-400/50"
                  />
                  <motion.div
                    animate={{ scale: [1, 2.3, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 0.7 }}
                    className="absolute w-20 h-20 rounded-full border border-amber-500/30"
                  />

                  <motion.button 
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={onStartScan}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-stone-950 flex items-center justify-center shadow-xl shadow-amber-500/20 border-2 border-amber-200 cursor-pointer relative z-10"
                  >
                    <Camera className="w-8 h-8 stroke-[2.5]" />
                  </motion.button>
                </div>

                <div className="space-y-0.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <ScanLine className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    AI OPTICAL LENS READY
                  </span>
                  <p className="text-stone-400 text-[11px] font-mono">Aim camera at stamps, logos, or marks</p>
                </div>
              </div>

              {/* Floating Live AI Radar Target Badges */}
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-5 left-5 z-20 bg-stone-900/90 backdrop-blur-md border border-stone-700/80 rounded-xl px-2.5 py-1.5 shadow-xl flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] font-mono text-stone-200 font-bold">Pyrex Daisy #475</span>
                <span className="text-[10px] font-mono text-emerald-400 font-black bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">+$65.00</span>
              </motion.div>

              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute bottom-5 right-5 z-20 bg-stone-900/90 backdrop-blur-md border border-stone-700/80 rounded-xl px-2.5 py-1.5 shadow-xl flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-[10px] font-mono text-stone-200 font-bold">Mid-Century Brass</span>
                <span className="text-[10px] font-mono text-amber-400 font-black bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">+$120.00</span>
              </motion.div>
            </div>

            {/* Headline & Description */}
            <div className="space-y-2 max-w-lg mx-auto">
              <h3 className="text-xl sm:text-2xl font-black font-display text-stone-900 tracking-tight">
                Your Resale Ledger is Ready
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Scan your first thrift find, estate discovery, or garage sale treasure to instantly calculate 300%+ ROI margins, generate eBay/Poshmark listing copy, and uncover reproduction red flags.
              </p>
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto pt-1">
              {onStartScan && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onStartScan}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs inline-flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 border border-amber-400 transition-all"
                >
                  <Camera className="w-4 h-4 fill-stone-950" />
                  <span>Scan First Item in Camera Lens</span>
                  <ArrowUpRight className="w-4 h-4" />
                </motion.button>
              )}

              {onLoadSampleItem && (
                <button
                  type="button"
                  onClick={onLoadSampleItem}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs inline-flex items-center justify-center gap-2 cursor-pointer border border-stone-200 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-amber-600 fill-amber-600" />
                  <span>Try Demo 1970s Pyrex Item</span>
                </button>
              )}
            </div>

            {/* 3 Step Quick Start Guide Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-left border-t border-stone-100">
              <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-stone-900 font-bold text-xs">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-700">
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                  <span>1. Lens Photo Scan</span>
                </div>
                <p className="text-[11px] text-stone-500 leading-normal">
                  Multi-angle photo capture with scale calibration (Credit Card, Coin, Ruler) for 3D item dimensions.
                </p>
              </div>

              <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-stone-900 font-bold text-xs">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span>2. Forensic Comps</span>
                </div>
                <p className="text-[11px] text-stone-500 leading-normal">
                  AI cross-references 18+ eBay sold comps and flags reproduction warning signs & maker stamps.
                </p>
              </div>

              <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-stone-900 font-bold text-xs">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-700">
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </div>
                  <span>3. 1-Tap Listing Kit</span>
                </div>
                <p className="text-[11px] text-stone-500 leading-normal">
                  Generate SEO titles, keywords, and formatted descriptions for eBay, Mercari, & Poshmark.
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Filtered search/category empty state when items exist but none match search term */
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-stone-200 p-8 text-center shadow-sm max-w-md mx-auto space-y-4"
          >
            <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-700 w-fit mx-auto border border-amber-200">
              <SearchX className="w-7 h-7" />
            </div>
            <div>
              <p className="text-stone-900 font-bold font-display text-base">No Matching Scouted Items</p>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                No items match your active search filter <span className="font-mono font-bold text-stone-800">"{searchTerm}"</span> or chosen specialty filter.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setFilterNiche("all");
              }}
              className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Search & Filters</span>
            </button>
          </motion.div>
        )
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item, idx) => {
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
                key={item.id || `inv-item-${idx}`}
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
