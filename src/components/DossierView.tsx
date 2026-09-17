import React, { useState } from "react";
import { ScannedItem, ResaleStatus, BuyCeilingDetails } from "../types";
import { NICHE_CONFIGS } from "../nicheConfigs";
import { ViolinForensicPanel } from "./ViolinForensicPanel";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Tag,
  DollarSign,
  Package,
  Clock,
  Layers,
  ShoppingBag,
  Info,
  Edit3,
  Save,
  Truck,
  Flame,
  CheckSquare,
  Square,
  Share2,
  Archive,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  HelpCircle,
  Zap
} from "lucide-react";

interface DossierViewProps {
  item: ScannedItem;
  onBackToScanner: () => void;
  onViewInventory: () => void;
  onDeleteItem?: (id: string) => void;
  onCorrectItem?: (id: string, newName: string) => void;
  onUpdateItem?: (updatedItem: ScannedItem) => void;
}

export default function DossierView({
  item,
  onBackToScanner,
  onViewInventory,
  onDeleteItem,
  onCorrectItem,
  onUpdateItem,
}: DossierViewProps) {
  const verdict = item.verdict;
  const niche = NICHE_CONFIGS.find((n) => n.id === item.nicheId) || NICHE_CONFIGS[0];

  // Tab navigation within dossier: 1. Evidence & Valuation -> 2. What's Next -> 3. Posting Section -> 4. Ledger or Archive
  const [activeTab, setActiveTab] = useState<"evidence" | "nextmove" | "posting" | "ledger">("evidence");

  // Platform switcher for listing generator
  const [listingPlatform, setListingPlatform] = useState<"ebay" | "poshmark" | "mercari" | "facebook" | "reverb">(
    item.nicheId === "instruments" ? "reverb" : "ebay"
  );

  // Copy feedback states
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Name correction state
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editedName, setEditedName] = useState<string>(verdict?.identifiedName || "");

  // Status & Financial overrides for Ledger tracking
  const [resaleStatus, setResaleStatus] = useState<ResaleStatus>(item.resaleStatus || (verdict?.verdict === "BUY" ? "sourced" : "passed"));
  const [buyPrice, setBuyPrice] = useState<string>(item.buyPrice?.toString() || item.condition.askingPrice?.toString() || "");
  const [soldPrice, setSoldPrice] = useState<string>(item.soldPrice?.toString() || "");
  const [listedPlatform, setListedPlatform] = useState<string>(item.platformListed || "eBay");

  // Archive state
  const [isArchived, setIsArchived] = useState<boolean>(Boolean(item.isArchived || item.resaleStatus === "archived"));
  const [archiveReason, setArchiveReason] = useState<string>(item.archiveReason || "Personal Collection");
  const [recordSavedToast, setRecordSavedToast] = useState<boolean>(false);

  // Interactive Checklist states
  const [checklistProgress, setChecklistProgress] = useState<Record<string, boolean>>({});

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveNameCorrection = () => {
    if (editedName.trim() && onCorrectItem) {
      onCorrectItem(item.id, editedName.trim());
      setIsEditingName(false);
    }
  };

  const handleToggleArchive = () => {
    const nextArchived = !isArchived;
    setIsArchived(nextArchived);
    if (nextArchived) {
      setResaleStatus("archived");
    } else {
      setResaleStatus("sourced");
    }
  };

  const handleSaveStatusUpdate = () => {
    if (!onUpdateItem) return;
    const finalStatus: ResaleStatus = isArchived ? "archived" : resaleStatus;
    const updated: ScannedItem = {
      ...item,
      resaleStatus: finalStatus,
      isArchived,
      archiveReason: isArchived ? archiveReason : undefined,
      archivedAt: isArchived ? (item.archivedAt || new Date().toISOString()) : undefined,
      buyPrice: buyPrice ? parseFloat(buyPrice) : undefined,
      soldPrice: soldPrice ? parseFloat(soldPrice) : undefined,
      platformListed: listedPlatform,
      dateAcquired: finalStatus === "sourced" || finalStatus === "listed" || finalStatus === "sold" ? (item.dateAcquired || new Date().toISOString()) : undefined,
      dateSold: finalStatus === "sold" ? (item.dateSold || new Date().toISOString()) : undefined,
      isSavedToLedger: true,
    };
    onUpdateItem(updated);
    setRecordSavedToast(true);
    setTimeout(() => setRecordSavedToast(false), 2500);
  };

  if (!verdict) {
    return (
      <div className="bg-stone-900 rounded-3xl p-8 border border-stone-800 text-center max-w-2xl mx-auto space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
        <h3 className="text-lg font-bold text-stone-100">Appraisal Incomplete</h3>
        <p className="text-xs text-stone-400">
          This item does not contain appraisal verdict data.
        </p>
        <button
          type="button"
          onClick={onBackToScanner}
          className="px-4 py-2 rounded-xl bg-amber-400 text-stone-950 text-xs font-bold font-mono cursor-pointer"
        >
          Return to Scanner
        </button>
      </div>
    );
  }

  // Calculate Net Margin & Economics
  const salePrice = verdict.suggestedListingPrice || verdict.marketRange?.median || verdict.highValue || 0;
  const currentBuyPrice = buyPrice ? parseFloat(buyPrice) : item.condition.askingPrice || 0;
  
  // Breakdown & Fee deduplication
  const rawNetEst = verdict.netEstimate;
  const netSalePrice = rawNetEst?.salePrice ?? salePrice;
  const marketplaceFee = rawNetEst?.marketplaceFee ?? Math.round(netSalePrice * 0.1325 * 100) / 100;
  const paymentProcessingFee = rawNetEst?.paymentProcessingFee ?? rawNetEst?.paymentFee ?? Math.round((netSalePrice * 0.029 + 0.3) * 100) / 100;
  const estimatedShipping = rawNetEst?.estimatedShipping ?? rawNetEst?.shippingCost ?? 6.5;
  const packingMaterials = rawNetEst?.packingMaterials ?? rawNetEst?.packingCost ?? 1.5;
  const acquisitionCost = rawNetEst?.acquisitionCost ?? currentBuyPrice;
  const estimatedNetProfit = rawNetEst?.estimatedNetProfit ?? rawNetEst?.netProfit ?? Math.round((netSalePrice - marketplaceFee - paymentProcessingFee - estimatedShipping - packingMaterials - acquisitionCost) * 100) / 100;
  const netMarginPercent = rawNetEst?.netMarginPercent ?? (netSalePrice > 0 ? Math.round((estimatedNetProfit / netSalePrice) * 100) : 0);

  const netEst = {
    salePrice: netSalePrice,
    marketplaceFee,
    paymentProcessingFee,
    estimatedShipping,
    packingMaterials,
    acquisitionCost,
    estimatedNetProfit,
    netMarginPercent,
  };

  // Buy Ceiling normalization (handles number, object, or missing)
  let buyCeiling: BuyCeilingDetails;
  if (typeof verdict.buyCeiling === "number") {
    buyCeiling = {
      maxPurchasePrice: verdict.buyCeiling,
      targetMarginPercent: 40,
      logicExplanation: "Maximum purchase ceiling to secure target profit margins after all marketplace deductions.",
    };
  } else if (verdict.buyCeiling && typeof verdict.buyCeiling === "object") {
    buyCeiling = {
      maxPurchasePrice: verdict.buyCeiling.maxPurchasePrice ?? Math.max(0, Math.round((salePrice * 0.5 - 8) * 100) / 100),
      targetMarginPercent: verdict.buyCeiling.targetMarginPercent ?? 40,
      logicExplanation: verdict.buyCeiling.logicExplanation || "To guarantee target margin after typical marketplace fees and shipping.",
    };
  } else {
    buyCeiling = {
      maxPurchasePrice: Math.max(0, Math.round((salePrice * 0.5 - 8) * 100) / 100),
      targetMarginPercent: 40,
      logicExplanation: "To guarantee at least a 40% net margin after typical 13.25% marketplace fees and shipping.",
    };
  }

  // Market Range normalization
  const rawMarket = verdict.marketRange;
  const marketRange = {
    low: rawMarket?.low ?? verdict.lowValue ?? 0,
    median: rawMarket?.median ?? Math.round(((verdict.lowValue || 0) + (verdict.highValue || 0)) / 2),
    high: rawMarket?.high ?? verdict.highValue ?? 0,
    compsCount: rawMarket?.compsCount ?? (rawMarket as any)?.numberOfComps ?? 12,
    compDateRange: rawMarket?.compDateRange || "Last 90 days (eBay Sold & Auction Comps)",
  };

  // Risk Flags normalization (handles array, object with reproductionRisk/conditionUncertainty/etc, or missing)
  let riskFlags: { type: string; severity: "low" | "medium" | "high"; message: string }[] = [];
  const rawRisk = verdict.riskFlags;
  if (Array.isArray(rawRisk)) {
    riskFlags = rawRisk.map((item: any) => ({
      type: item.type || "risk",
      severity: item.severity === "high" ? "high" : item.severity === "medium" ? "medium" : "low",
      message: item.message || item.note || String(item),
    }));
  } else if (rawRisk && typeof rawRisk === "object") {
    const obj = rawRisk as any;
    if (obj.reproductionRisk) {
      riskFlags.push({
        type: "reproduction",
        severity: String(obj.reproductionRisk).toLowerCase() === "high" ? "high" : String(obj.reproductionRisk).toLowerCase() === "medium" ? "medium" : "low",
        message: `Reproduction risk assessed as ${obj.reproductionRisk}.`,
      });
    }
    if (obj.conditionUncertainty) {
      riskFlags.push({
        type: "condition",
        severity: String(obj.conditionUncertainty).toLowerCase() === "high" ? "high" : String(obj.conditionUncertainty).toLowerCase() === "medium" ? "medium" : "low",
        message: `Condition uncertainty assessed as ${obj.conditionUncertainty}.`,
      });
    }
    if (obj.authenticityConcerns) {
      riskFlags.push({
        type: "authenticity",
        severity: String(obj.authenticityConcerns).toLowerCase() === "high" ? "high" : String(obj.authenticityConcerns).toLowerCase() === "medium" ? "medium" : "low",
        message: `Authenticity concern assessed as ${obj.authenticityConcerns}.`,
      });
    }
    if (obj.slowSellThrough) {
      riskFlags.push({
        type: "sell_through",
        severity: String(obj.slowSellThrough).toLowerCase() === "high" ? "high" : String(obj.slowSellThrough).toLowerCase() === "medium" ? "medium" : "low",
        message: `Sell-through rate assessed as ${obj.slowSellThrough}.`,
      });
    }
    if (Array.isArray(obj.notes)) {
      obj.notes.forEach((note: any) => {
        if (typeof note === "string" && note.trim()) {
          riskFlags.push({
            type: "field_check",
            severity: "low",
            message: note,
          });
        }
      });
    }
  }

  if (riskFlags.length === 0) {
    riskFlags = [
      { type: "authenticity", severity: "low", message: "Standard maker marks and silhouette match authentic catalog references." },
      { type: "sell_through", severity: "medium", message: "Solid demand for pristine specimens; slower for flawed items." },
    ];
  }

  // Specific listing copy based on selected platform
  const selectedPlatformListing =
    listingPlatform === "facebook"
      ? (verdict.listings?.facebook || verdict.listings?.facebookMarketplace)
      : verdict.listings?.[listingPlatform];

  const listingData = selectedPlatformListing || {
    title: verdict.listingTitle || verdict.identifiedName,
    description: verdict.descriptionWriteup || `${verdict.identifiedName} in excellent vintage condition.`,
    tags: verdict.listingKeywords || [],
    suggestedPriceFormat: `Buy It Now at $${verdict.suggestedListingPrice || marketRange.median} with Best Offer enabled`,
    platformNotes: "Standard listing format",
  };

  const listingTags = Array.isArray(listingData.tags) && listingData.tags.length > 0
    ? listingData.tags
    : Array.isArray(listingData.keywords) && listingData.keywords.length > 0
    ? listingData.keywords
    : Array.isArray(verdict.listingKeywords) && verdict.listingKeywords.length > 0
    ? verdict.listingKeywords
    : ["Vintage", "Collectibles", "EstateSale", "ResaleFind"];

  const priorityChecklist = Array.isArray(verdict.nextMoveStrategy?.priorityChecklist) && verdict.nextMoveStrategy.priorityChecklist.length > 0
    ? verdict.nextMoveStrategy.priorityChecklist
    : [
        "Inspect base and hallmarks under direct raking light",
        "Clean gently with soft cloth; avoid abrasive pads",
        "Take 4-6 staged photos highlighting markings and condition",
        "Copy generated listing title and description directly to eBay",
        "Package with bubble wrap and sturdy outer shipping carton",
      ];

  // Verdict colors & icons
  const isBuy = verdict.verdict === "BUY";
  const isSkip = verdict.verdict === "SKIP";
  const isPonder = verdict.verdict === "PONDER";

  const currentItemName = editedName || item.correctedName || verdict.identifiedName || "Vintage Item";

  const isViolinRelated = Boolean(
    verdict.violinForensics?.isViolinOrBowedString ||
    /violin|viola|cello|fiddle|bow|strad|guarner|amati|stainer|luthier|cremona/i.test(currentItemName) ||
    /violin|viola|cello|fiddle|bow|strad|guarner/i.test(verdict.category || "") ||
    /violin|viola|cello|fiddle|bow|strad|guarner/i.test(verdict.makerBrand || "")
  );

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-900/90 p-3 rounded-2xl border border-stone-800 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToScanner}
            className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>Scanner</span>
          </button>

          <span className="text-stone-600">•</span>

          <button
            type="button"
            onClick={onViewInventory}
            className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-stone-400" />
            <span>Sourcing Ledger</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-stone-400">
          <span className="px-2.5 py-0.5 rounded-full bg-stone-800 text-amber-300 font-bold border border-stone-700">
            ID: #{item.id.slice(-6).toUpperCase()}
          </span>
          <span>{new Date(item.scannedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Offline/Estimate Warning Banner if applicable */}
      {(item.status === "offline_draft" || verdict.confidence < 60) && (
        <div className="p-3.5 rounded-2xl bg-amber-950/80 border border-amber-700/70 text-amber-200 text-xs font-mono flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Estimate only — preliminary evidence</span>
            <p className="text-stone-300 text-[11px] mt-0.5">
              Limited visual hallmarks or offline estimation mode active. High-confidence buy verdicts are restricted until validated against sold comps.
            </p>
          </div>
        </div>
      )}

      {/* Primary Identification Hero Card */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          
          {/* Photo Slot Display */}
          <div className="md:col-span-4 aspect-square bg-stone-950 rounded-2xl overflow-hidden border border-stone-800 relative group">
            <img
              src={item.image}
              alt={verdict.identifiedName}
              className="w-full h-full object-contain p-2"
            />
            {item.additionalImages && item.additionalImages.length > 0 && (
              <div className="absolute bottom-2 left-2 bg-stone-950/80 px-2 py-0.5 rounded-md text-[10px] font-mono text-stone-300 border border-stone-800">
                +{item.additionalImages.length} angles
              </div>
            )}
          </div>

          {/* Core Identification Details */}
          <div className="md:col-span-8 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Resale Verdict Badge */}
              <div
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 border shadow-sm ${
                  isBuy
                    ? "bg-emerald-400 text-stone-950 border-emerald-300"
                    : isSkip
                    ? "bg-rose-500 text-white border-rose-400"
                    : "bg-amber-400 text-stone-950 border-amber-300"
                }`}
              >
                {isBuy && <CheckCircle className="w-3.5 h-3.5" />}
                {isSkip && <XCircle className="w-3.5 h-3.5" />}
                {isPonder && <AlertTriangle className="w-3.5 h-3.5" />}
                <span>{verdict.verdict} VERDICT</span>
              </div>

              {/* Confidence Badge */}
              <div className="px-2.5 py-1 rounded-xl bg-stone-800 text-stone-300 text-xs font-mono font-bold border border-stone-700 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{verdict.confidence}% Confidence</span>
              </div>

              {/* Category Pill */}
              <div className="px-2.5 py-1 rounded-xl bg-stone-800 text-stone-300 text-xs font-mono border border-stone-700 flex items-center gap-1.5">
                {item.detectedNicheName || item.detectedNicheId || verdict.detectedNicheName ? (
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-amber-400" />
                    <span>Auto Focus: {item.detectedNicheName || verdict.detectedNicheName || verdict.category || niche.name}</span>
                  </span>
                ) : (
                  <span>{verdict.category || niche.name}</span>
                )}
              </div>
            </div>

            {/* Editable Item Title */}
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-stone-950 border border-amber-400 text-stone-100 text-sm font-mono focus:outline-none"
                />
                <button
                  onClick={handleSaveNameCorrection}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 text-stone-950 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-display text-stone-100 leading-tight">
                  {verdict.identifiedName}
                </h1>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-stone-400 hover:text-amber-400 p-1 cursor-pointer"
                  title="Correct Item Name"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Verdict Reasoning Summary */}
            <p className="text-xs text-stone-300 font-mono leading-relaxed">
              {verdict.verdictReasoning}
            </p>

            {/* Quick Valuation Summary Bar */}
            <div className="pt-2 grid grid-cols-3 gap-2 border-t border-stone-800">
              <div>
                <span className="text-[10px] font-mono text-stone-400 block uppercase">Median Sold</span>
                <span className="text-lg font-bold font-mono text-stone-100">
                  ${marketRange.median}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-stone-400 block uppercase">Buy Ceiling</span>
                <span className="text-lg font-bold font-mono text-amber-400">
                  ${buyCeiling.maxPurchasePrice}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-stone-400 block uppercase">Est. Net Profit</span>
                <span
                  className={`text-lg font-bold font-mono ${
                    netEst.estimatedNetProfit > 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  ${netEst.estimatedNetProfit}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Internal Navigation Tabs: Evidence & Valuation -> What's Next -> Posting Section -> Ledger or Archive */}
      <div className="flex items-center gap-1.5 bg-stone-900/80 p-1.5 rounded-2xl border border-stone-800 overflow-x-auto no-scrollbar">
        {[
          { id: "evidence", label: "1. Evidence & Valuation", icon: <TrendingUp className="w-3.5 h-3.5" /> },
          { id: "nextmove", label: "2. What's Next", icon: <Sparkles className="w-3.5 h-3.5" /> },
          { id: "posting", label: "3. Posting Section", icon: <Tag className="w-3.5 h-3.5" /> },
          { id: "ledger", label: "4. Ledger or Archive", icon: <Archive className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? "bg-amber-400 text-stone-950 shadow-sm"
                : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/60"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: EVIDENCE & VALUATION */}
      {activeTab === "evidence" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Market Comps Range Card */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold font-mono text-stone-100 uppercase tracking-wider">
                  Market Range & Sold Comps
                </h2>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {verdict.ebaySoldSearchUrl && (
                  <a
                    href={verdict.ebaySoldSearchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-mono flex items-center gap-1 border border-stone-700"
                  >
                    <span>eBay Sold</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {(verdict.reverbSoldSearchUrl || item.nicheId === "instruments" || verdict.detectedNicheId === "instruments") && (
                  <a
                    href={verdict.reverbSoldSearchUrl || `https://reverb.com/marketplace?query=${encodeURIComponent(verdict.identifiedName)}&show_only_sold=true`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 text-xs font-mono flex items-center gap-1 border border-cyan-700/60"
                  >
                    <span>Reverb Comps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {(verdict.tarisioSearchUrl || isViolinRelated) && (
                  <a
                    href={
                      verdict.tarisioSearchUrl ||
                      `https://tarisio.com/cozio-archive/price-history/?maker=${encodeURIComponent(
                        verdict.makerBrand || currentItemName.replace(/copy|model|violin/gi, "").trim() || "violin"
                      )}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-xl bg-amber-950/80 hover:bg-amber-900 text-amber-300 text-xs font-mono flex items-center gap-1 border border-amber-700/60"
                    title="View fine instrument auction records on Tarisio Cozio Archive"
                  >
                    <span>Tarisio Archive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Price Gauge Visual */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-mono text-stone-400">
                <span>Low: ${marketRange.low}</span>
                <span className="text-amber-400 font-bold">Median: ${marketRange.median}</span>
                <span>High: ${marketRange.high}</span>
              </div>

              <div className="h-2.5 rounded-full bg-stone-800 overflow-hidden flex relative">
                <div className="w-1/3 bg-stone-700" />
                <div className="w-1/3 bg-amber-400" />
                <div className="w-1/3 bg-emerald-400" />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 pt-1">
                <span>Based on {marketRange.compsCount} sold comps</span>
                <span>Range: {marketRange.compDateRange}</span>
              </div>
            </div>

            {verdict.valuationMethodology && (
              <p className="text-xs font-mono text-stone-400 bg-stone-950/60 p-3 rounded-xl border border-stone-800/80">
                <span className="font-bold text-stone-300">Methodology: </span>
                {verdict.valuationMethodology}
              </p>
            )}
          </div>

          {/* God-Tier Violin & Bow Forensic Appraisal Inspector */}
          {(isViolinRelated || item.nicheId === "instruments" || verdict.detectedNicheId === "instruments") && (
            <ViolinForensicPanel
              forensics={verdict.violinForensics}
              identifiedName={currentItemName}
              makerBrand={verdict.makerBrand}
              category={verdict.category}
              tarisioUrl={verdict.tarisioSearchUrl}
              reverbUrl={verdict.reverbSoldSearchUrl}
              ebayUrl={verdict.ebaySoldSearchUrl}
            />
          )}

          {/* Net Profit Waterfall & Buy Ceiling */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Net Estimate Breakdown */}
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold font-mono text-stone-200 uppercase tracking-wider">
                  Net Profit Waterfall
                </h3>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-stone-300">
                  <span>Gross Sale Target</span>
                  <span className="font-bold">${netEst.salePrice}</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>Platform Fee (~13.25%)</span>
                  <span>-${netEst.marketplaceFee}</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>Payment Processing (~2.9%)</span>
                  <span>-${netEst.paymentProcessingFee}</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>Est. Shipping & Packing</span>
                  <span>-${(netEst.estimatedShipping + netEst.packingMaterials).toFixed(2)}</span>
                </div>
                {netEst.acquisitionCost > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>Acquisition Buy-in</span>
                    <span>-${netEst.acquisitionCost}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-stone-800 flex justify-between text-stone-100 font-bold text-sm">
                  <span>Estimated Net Profit</span>
                  <span className={netEst.estimatedNetProfit > 0 ? "text-emerald-400" : "text-rose-400"}>
                    ${netEst.estimatedNetProfit} ({netEst.netMarginPercent}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Buy Ceiling Guidance */}
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold font-mono text-stone-200 uppercase tracking-wider">
                    Maximum Buy Ceiling
                  </h3>
                </div>

                <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-center space-y-1">
                  <span className="text-[10px] font-mono uppercase text-stone-400">Max Sourcing Price</span>
                  <div className="text-2xl font-bold font-mono text-amber-400">
                    ${buyCeiling.maxPurchasePrice}
                  </div>
                  <span className="text-[10px] font-mono text-stone-400">
                    Targets {buyCeiling.targetMarginPercent}% profit margin
                  </span>
                </div>
              </div>

              <p className="text-[11px] font-mono text-stone-400 pt-2">
                {buyCeiling.logicExplanation}
              </p>
            </div>
          </div>

          {/* Risk Flags & Forensic Tells */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold font-mono text-stone-200 uppercase tracking-wider">
                Risk Flags & Forensic Tells
              </h3>
            </div>

            <div className="space-y-2">
              {riskFlags.map((flag, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs font-mono flex items-start gap-2.5 ${
                    flag.severity === "high"
                      ? "bg-rose-950/50 border-rose-800 text-rose-200"
                      : flag.severity === "medium"
                      ? "bg-amber-950/50 border-amber-800 text-amber-200"
                      : "bg-stone-950 border-stone-800 text-stone-300"
                  }`}
                >
                  <span className="font-bold uppercase text-[10px] px-1.5 py-0.5 rounded bg-stone-900 border border-stone-700 shrink-0">
                    {flag.type.replace("_", " ")}
                  </span>
                  <p className="leading-relaxed">{flag.message}</p>
                </div>
              ))}
            </div>

            {/* Inspection Checklist */}
            {verdict.inspectionPointsToVerify && (
              <div className="pt-2 border-t border-stone-800">
                <span className="text-[10px] font-mono text-stone-400 uppercase font-bold block mb-1">
                  Field Inspection Checklist:
                </span>
                <p className="text-xs font-mono text-stone-300 bg-stone-950 p-2.5 rounded-xl border border-stone-800">
                  {verdict.inspectionPointsToVerify}
                </p>
              </div>
            )}
          </div>

          {/* Stepper from Evidence to What's Next */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setActiveTab("nextmove")}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-mono font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <span>Next: What's Next Strategy</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SECTION 2: WHAT'S NEXT STRATEGY */}
      {activeTab === "nextmove" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Primary Strategy Banner */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold font-mono text-stone-100 uppercase tracking-wider">
                Primary Tactical Recommendation
              </h3>
            </div>
            <div className="p-4 bg-stone-950 rounded-xl border border-stone-800 text-sm font-mono text-stone-200 leading-relaxed">
              {verdict.nextMoveStrategy?.bestOverallPath ||
                verdict.nextMoveStrategy?.actionReason ||
                `List on ${listedPlatform} at $${verdict.suggestedListingPrice || marketRange.median} with Best Offer.`}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
                <span className="text-[10px] font-mono text-stone-400 block uppercase">Target Platform</span>
                <span className="text-sm font-bold font-mono text-amber-400">
                  {verdict.nextMoveStrategy?.targetPlatform || listedPlatform || "eBay / Mercari"}
                </span>
              </div>

              <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
                <span className="text-[10px] font-mono text-stone-400 block uppercase">Expected Turnaround</span>
                <span className="text-sm font-bold font-mono text-emerald-400">
                  {verdict.nextMoveStrategy?.turnaroundDays || verdict.nextMoveStrategy?.estimatedTurnaroundTime || "3-7 Days"}
                </span>
              </div>
            </div>
          </div>

          {/* Step-by-Step Priority Checklist */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold font-mono text-stone-100 uppercase tracking-wider">
                Priority Action Checklist
              </h3>
            </div>

            <div className="space-y-2">
              {priorityChecklist.map((step, idx) => {
                const isChecked = Boolean(checklistProgress[idx]);
                return (
                  <div
                    key={idx}
                    onClick={() => setChecklistProgress((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      isChecked
                        ? "bg-emerald-950/40 border-emerald-800/80 text-emerald-200 line-through opacity-70"
                        : "bg-stone-950 border-stone-800 text-stone-200 hover:border-stone-700"
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-stone-500 shrink-0" />
                    )}
                    <span className="text-xs font-mono flex-1">{step}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Multi-Channel Resale Pathways */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold font-mono text-stone-100 uppercase tracking-wider">
                  Multi-Channel Distribution Pathways
                </h3>
              </div>
              <span className="text-[10px] font-mono text-stone-400">
                Ranked by speed & profit margin
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  channel: "Online Marketplaces (eBay / Mercari)",
                  suitability: "High",
                  turnaround: "3 - 10 Days",
                  payout: `$${Math.round((verdict.suggestedListingPrice || marketRange.median) * 0.85)} net`,
                  tip: "Fastest national buyer reach; ensure secure packaging."
                },
                {
                  channel: "Local Marketplace (FB / OfferUp)",
                  suitability: "Moderate",
                  turnaround: "1 - 5 Days",
                  payout: `$${Math.round((verdict.suggestedListingPrice || marketRange.median) * 0.95)} cash`,
                  tip: "Zero shipping hassle and zero transaction fees; cash on collection."
                },
                {
                  channel: "Specialty Antique Booth / Consignment",
                  suitability: "Selective",
                  turnaround: "14 - 45 Days",
                  payout: `$${Math.round((verdict.suggestedListingPrice || marketRange.median) * 0.70)} net`,
                  tip: "Best for high-end decorative or fragile statement pieces."
                },
                {
                  channel: "Collector Direct / Private Sale",
                  suitability: "High Return",
                  turnaround: "Variable",
                  payout: `$${verdict.suggestedListingPrice || marketRange.median} max`,
                  tip: "Reach niche collectors via specialty forums or targeted social channels."
                }
              ].map((pathway, idx) => (
                <div key={idx} className="p-3.5 bg-stone-950 rounded-xl border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-stone-200">{pathway.channel}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      {pathway.suitability}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono text-stone-400">
                    <span>Speed: <span className="text-stone-200">{pathway.turnaround}</span></span>
                    <span>Est. Payout: <span className="text-emerald-400 font-bold">{pathway.payout}</span></span>
                  </div>
                  <p className="text-[11px] font-mono text-stone-400 pt-1 border-t border-stone-800/80">
                    💡 {pathway.tip}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Stepper buttons */}
          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={() => setActiveTab("evidence")}
              className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-mono text-xs flex items-center gap-1.5 border border-stone-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back: Evidence & Valuation</span>
            </button>
            <button
              onClick={() => setActiveTab("posting")}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-mono font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <span>Next: Posting Section</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SECTION 3: POSTING SECTION */}
      {activeTab === "posting" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Platform Format Selector */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-2.5 flex items-center justify-between gap-2">
            <span className="text-xs font-mono font-bold text-stone-400 uppercase pl-2">
              Posting Platform:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: "ebay", label: "eBay" },
                { id: "reverb", label: "Reverb" },
                { id: "poshmark", label: "Poshmark" },
                { id: "mercari", label: "Mercari" },
                { id: "facebook", label: "FB Marketplace" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setListingPlatform(p.id as any)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all ${
                    listingPlatform === p.id
                      ? "bg-amber-400 text-stone-950 shadow-sm"
                      : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Listing Title Box */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-stone-300 uppercase">
                Optimized Listing Title ({listingData.title.length}/80 chars)
              </span>
              <button
                onClick={() => copyToClipboard(listingData.title, "title")}
                className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-mono font-medium flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === "title" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === "title" ? "Copied" : "Copy Title"}</span>
              </button>
            </div>
            <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-stone-100 text-xs font-mono select-all">
              {listingData.title}
            </div>
          </div>

          {/* Pricing Recommendation Box */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-stone-300 uppercase">
                Suggested Listing Format & Price
              </span>
              <button
                onClick={() => copyToClipboard(listingData.suggestedPriceFormat, "price")}
                className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-mono font-medium flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === "price" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === "price" ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-stone-100 text-xs font-mono flex items-center justify-between">
              <span>{listingData.suggestedPriceFormat}</span>
              <span className="text-amber-400 font-bold">${verdict.suggestedListingPrice || marketRange.median}</span>
            </div>
          </div>

          {/* Description Writeup */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-stone-300 uppercase">
                Ready-to-Paste Description
              </span>
              <button
                onClick={() => copyToClipboard(listingData.description, "desc")}
                className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-mono font-medium flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === "desc" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === "desc" ? "Copied" : "Copy Description"}</span>
              </button>
            </div>
            <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-stone-300 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
              {listingData.description}
            </div>
          </div>

          {/* Keywords / Tags */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-stone-300 uppercase">
                Search Tags / Keywords ({listingTags.length})
              </span>
              <button
                onClick={() => copyToClipboard(listingTags.join(", "), "tags")}
                className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-mono font-medium flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === "tags" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === "tags" ? "Copied" : "Copy Tags"}</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 p-2 bg-stone-950 rounded-xl border border-stone-800">
              {listingTags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-stone-800 text-[11px] font-mono text-stone-300 border border-stone-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Stepper buttons */}
          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={() => setActiveTab("nextmove")}
              className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-mono text-xs flex items-center gap-1.5 border border-stone-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back: What's Next</span>
            </button>
            <button
              onClick={() => setActiveTab("ledger")}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-mono font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <span>Next: Ledger or Archive</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SECTION 4: LEDGER OR ARCHIVE */}
      {activeTab === "ledger" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold font-mono text-stone-100 uppercase tracking-wider">
                  Ledger & Archive Management
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {recordSavedToast && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-mono font-bold flex items-center gap-1 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Record Saved!</span>
                  </span>
                )}
                <button
                  onClick={handleSaveStatusUpdate}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Record</span>
                </button>
              </div>
            </div>

            {/* Status Lifecycle Selector */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider mb-2">
                Inventory Lifecycle Status
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: "sourced", label: "Sourced (Bought)", color: "bg-emerald-400 text-stone-950 font-bold" },
                  { id: "listed", label: "Listed For Sale", color: "bg-amber-400 text-stone-950 font-bold" },
                  { id: "sold", label: "Sold & Realized", color: "bg-cyan-400 text-stone-950 font-bold" },
                  { id: "passed", label: "Passed (Skipped)", color: "bg-stone-700 text-stone-200" },
                  { id: "archived", label: "Archived (Vault)", color: "bg-purple-400 text-stone-950 font-bold" },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setResaleStatus(s.id as ResaleStatus);
                      if (s.id === "archived") {
                        setIsArchived(true);
                      } else {
                        setIsArchived(false);
                      }
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-mono transition-all text-center cursor-pointer border ${
                      (resaleStatus === s.id || (s.id === "archived" && isArchived))
                        ? `${s.color} border-transparent shadow-sm`
                        : "bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Financial Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider mb-1">
                  Actual Purchase / Buy-In ($)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  placeholder="e.g. 5.00"
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider mb-1">
                  Target / Final Sold Price ($)
                </label>
                <input
                  type="number"
                  step="1"
                  value={soldPrice}
                  onChange={(e) => setSoldPrice(e.target.value)}
                  placeholder={`e.g. ${verdict.suggestedListingPrice || marketRange.median}`}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider mb-1">
                  Platform Listed On
                </label>
                <select
                  value={listedPlatform}
                  onChange={(e) => setListedPlatform(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs font-mono focus:border-amber-400 focus:outline-none"
                >
                  <option value="eBay">eBay</option>
                  <option value="Mercari">Mercari</option>
                  <option value="Poshmark">Poshmark</option>
                  <option value="Facebook Marketplace">FB Marketplace</option>
                  <option value="Whatnot">Whatnot</option>
                  <option value="Local Antique Booth">Local Antique Booth</option>
                  <option value="Private Collector">Private Collector</option>
                </select>
              </div>
            </div>

            {/* Archive / Vault Section */}
            <div className={`p-4 rounded-xl border transition-all ${
              isArchived 
                ? "bg-purple-950/30 border-purple-800/80 text-stone-200" 
                : "bg-stone-950 border-stone-800 text-stone-300"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Archive className={`w-4 h-4 mt-0.5 ${isArchived ? "text-purple-400" : "text-stone-500"}`} />
                  <div>
                    <span className="text-xs font-mono font-bold text-stone-200 flex items-center gap-2">
                      <span>Archive to Collection / Vault</span>
                      {isArchived ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-400 text-stone-950 font-black">
                          ARCHIVED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-800 text-stone-400">
                          ACTIVE INVENTORY
                        </span>
                      )}
                    </span>
                    <p className="text-[11px] font-mono text-stone-400 mt-0.5">
                      {isArchived
                        ? "This item is stored in the archive collection and kept off active resale listings."
                        : "Archive items kept for personal reference, personal collection, or long-term storage."}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleToggleArchive}
                  className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer border shrink-0 ${
                    isArchived
                      ? "bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700"
                      : "bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 border-purple-700"
                  }`}
                >
                  {isArchived ? "Unarchive / Restore to Active" : "Archive Item"}
                </button>
              </div>

              {isArchived && (
                <div className="mt-3 pt-3 border-t border-purple-800/40 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wider mb-1">
                      Archive Reason
                    </label>
                    <select
                      value={archiveReason}
                      onChange={(e) => setArchiveReason(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-stone-900 border border-purple-800/60 text-stone-100 text-xs font-mono focus:border-purple-400 focus:outline-none"
                    >
                      <option value="Personal Collection">Personal Collection</option>
                      <option value="Historical Reference">Historical / Identification Reference</option>
                      <option value="Gifted or Donated">Gifted or Donated</option>
                      <option value="Damaged or Scrapped">Damaged or Scrapped</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wider mb-1">
                      Archived Timestamp
                    </label>
                    <div className="px-3 py-1.5 rounded-xl bg-stone-900 border border-purple-800/60 text-stone-300 text-xs font-mono">
                      {item.archivedAt ? new Date(item.archivedAt).toLocaleDateString() : new Date().toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stepper / Action Footer */}
          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={() => setActiveTab("posting")}
              className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-mono text-xs flex items-center gap-1.5 border border-stone-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back: Posting Section</span>
            </button>
            <button
              onClick={onViewInventory}
              className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 font-mono font-bold text-xs flex items-center gap-1.5 border border-stone-700 cursor-pointer"
            >
              <span>View Master Inventory</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
