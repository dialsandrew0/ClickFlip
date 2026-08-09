import React, { useState } from "react";
import { NextMoveStrategy, DistributionPath } from "../types";
import { 
  Compass, 
  ShoppingBag, 
  Landmark, 
  Users, 
  Store, 
  CheckCircle2, 
  Circle, 
  Copy, 
  Check, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  DollarSign, 
  Zap, 
  ShieldCheck,
  ChevronRight
} from "lucide-react";

interface NextMovePanelProps {
  strategy?: NextMoveStrategy;
  itemTitle: string;
  suggestedPrice?: number;
}

export default function NextMovePanel({ strategy, itemTitle, suggestedPrice }: NextMovePanelProps) {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<boolean>(false);

  // Default fallback pathways if item was scanned in offline quick mode
  const defaultPathways: DistributionPath[] = [
    {
      id: "online_marketplace",
      type: "online_marketplace",
      targetPlatform: "eBay & Mercari Cross-List",
      suitabilityScore: 94,
      estimatedPayout: `$${suggestedPrice ? Math.round(suggestedPrice * 0.87) : "45 - 90"} net after 13% fees`,
      turnaroundTime: "2-5 Days",
      stepsToExecute: [
        "Create Buy-It-Now listing with 'Best Offer' enabled to gauge serious buyer interest",
        "Copy and paste the AI-optimized listing title and description into eBay/Mercari",
        "Upload 8+ high-contrast staged photos including close-ups of hallmarks and scale reference",
        "Set buyer-paid calculated shipping with USPS Ground Advantage or Priority Mail box"
      ],
      customPostCopy: `FOR SALE: ${itemTitle}\n\nAuthentic vintage item in verified condition. Please review all detailed high-resolution photos for exact hallmarks and measurements. Fast 24-hour dispatch with tracking and sturdy protective packaging.\n\nKey Highlights:\n- Verified authentic hallmark signatures & markings\n- Preserved vintage condition\n- Carefully measured dimensions\n\nQuestions? Message anytime!`,
      proTips: [
        "Promote listing at a modest 3-5% ad rate on eBay to rank #1 in visual search recommendations",
        "Price 10% above your bottom-line target to leave room for automated 5% discount offers to watchers"
      ]
    },
    {
      id: "specialty_auction",
      type: "specialty_auction",
      targetPlatform: "Heritage Auctions / LiveAuctioneers / EBTH",
      suitabilityScore: 88,
      estimatedPayout: `$${suggestedPrice ? Math.round(suggestedPrice * 1.2) : "120 - 250"} potential catalog high-estimate`,
      turnaroundTime: "30-45 Days (Catalog Window)",
      stepsToExecute: [
        "Submit clear high-resolution hallmark photos to consignment valuation desk via online portal",
        "Establish formal reserve price protection before approving consignment agreement",
        "Confirm buyer premium split (typically 15-20% fee covered by high bidder)",
        "Ship item via insured signature-required courier directly to auction vault"
      ],
      customPostCopy: `CONSIGNMENT SUBMISSION BRIEF:\nItem: ${itemTitle}\nCategory: Specialty Vintage / Antiques\nCondition: Verified Authentic with Hallmark Documentation\nEstimate Request: Catalog placement in upcoming Fine Decorative Arts / Collector Auction. High-resolution provenance photos attached.`,
      proTips: [
        "Request inclusion in quarterly themed auctions rather than monthly open sales for maximum bidder competition",
        "Provide full scale measurement documentation to earn the 'Guaranteed Catalog Description' badge"
      ]
    },
    {
      id: "private_collectors",
      type: "private_collectors",
      targetPlatform: "Reddit r/Coins, r/Vintage, Niche Collector Forums & Direct Pitch",
      suitabilityScore: 92,
      estimatedPayout: `$${suggestedPrice ? Math.round(suggestedPrice * 0.95) : "80 - 150"} zero platform commission`,
      turnaroundTime: "1-3 Days",
      stepsToExecute: [
        "Join targeted niche subreddits or specialized Facebook collector groups",
        "Post tagged photo with handwritten timestamp index card (e.g., [FS] ${itemTitle})",
        "Utilize PayPal Goods & Services for 100% buyer/seller transaction protection",
        "Direct message active collectors who posted 'WTB' (Want To Buy) requests for similar items"
      ],
      customPostCopy: `[FS] ${itemTitle} - Rare Verified Finding\n\nHey collectors! Offering up this pristine ${itemTitle}. Verified hallmarks intact. Looking for $${suggestedPrice || 120} shipped CONUS via PayPal Goods & Services. Photos & timestamp tagged in album. PM if interested!`,
      proTips: [
        "Never accept 'PayPal Friends & Family' or unverified wire transfers from new forum accounts",
        "Include a free bonus vintage ephemera bookmark or sticker to earn 5-star verified seller karma"
      ]
    },
    {
      id: "local_consignment",
      type: "local_consignment",
      targetPlatform: "Local Antique Mall Booth / Specialty Pawn Partner",
      suitabilityScore: 82,
      estimatedPayout: `$${suggestedPrice ? Math.round(suggestedPrice * 0.70) : "40 - 75"} immediate cash / 60-40 consignment split`,
      turnaroundTime: "Immediate Cash or 14-30 Days",
      stepsToExecute: [
        "Show item and AI appraisal sheet to head buyer at high-foot-traffic local antique mall",
        "Negotiate 60/40 consignment split or cash buy-out at 50% wholesale value for instant cash",
        "Attach printed QR code linking to AI appraisal report on booth shelf display",
        "Check monthly statement or pick up check upon item sale"
      ],
      customPostCopy: `LOCAL BOOTH / SHOP DISPLAY CARD:\n${itemTitle}\nVerified Authentic Vintage Piece\nAppraisal Highlight: Preserved hallmarks & period aesthetics\nOur Price: $${suggestedPrice || 100}`,
      proTips: [
        "Booth items near glass display cases sell 2.5x faster when accompanied by a short printed history card",
        "Offer local shop owners a bundle discount if bringing 3+ scouted items at once"
      ]
    }
  ];

  const pathways = strategy?.pathways && strategy.pathways.length > 0 
    ? strategy.pathways 
    : defaultPathways;

  const currentPath = pathways[activeTab] || pathways[0];

  const toggleStep = (stepIdx: number) => {
    const key = `${currentPath.id}-${stepIdx}`;
    setCompletedSteps(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPathIcon = (type: string) => {
    switch (type) {
      case "online_marketplace":
        return <ShoppingBag className="w-4 h-4 text-emerald-600" />;
      case "specialty_auction":
        return <Landmark className="w-4 h-4 text-purple-600" />;
      case "private_collectors":
        return <Users className="w-4 h-4 text-indigo-600" />;
      case "local_consignment":
        return <Store className="w-4 h-4 text-amber-600" />;
      default:
        return <Compass className="w-4 h-4 text-stone-600" />;
    }
  };

  return (
    <div className="bg-stone-900 text-stone-100 rounded-2xl p-5 sm:p-6 shadow-md border border-stone-800 space-y-6">
      
      {/* Header & Best Overall Directive */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold font-display text-white tracking-wide">
            Next Move AI — Strategic Distribution Directions
          </h3>
        </div>
        <p className="text-xs text-stone-400 leading-relaxed">
          AI-calculated pathways to maximize profit, speed, and ease for <strong className="text-stone-200">{itemTitle}</strong>.
        </p>

        {strategy?.bestOverallPath && (
          <div className="mt-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-wider text-[10px] text-amber-400 block font-mono">
                God-Tier Recommendation Directive
              </span>
              <p className="mt-0.5 font-medium leading-relaxed">
                {strategy.bestOverallPath}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pathway Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-stone-800 pb-3">
        {pathways.map((path, idx) => {
          const isActive = activeTab === idx;
          return (
            <button
              key={path.id || idx}
              type="button"
              onClick={() => setActiveTab(idx)}
              className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                isActive
                  ? "bg-stone-800 border-amber-400/80 ring-1 ring-amber-400/50 shadow-sm"
                  : "bg-stone-950/60 border-stone-800/80 text-stone-400 hover:bg-stone-800/50 hover:text-stone-200"
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="p-1.5 rounded-lg bg-stone-900 border border-stone-700/60">
                  {getPathIcon(path.type)}
                </div>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-stone-900/90 text-amber-400 border border-stone-700">
                  {path.suitabilityScore}% Match
                </span>
              </div>

              <div>
                <span className="text-xs font-bold block text-stone-100 truncate">
                  {path.targetPlatform.split("/")[0]}
                </span>
                <span className="text-[10px] text-stone-400 block truncate mt-0.5 font-mono">
                  {path.estimatedPayout}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Pathway Deep-Dive Card */}
      {currentPath && (
        <div className="space-y-5 animate-fadeIn">
          
          {/* Channel Header Specs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-950/80 p-4 rounded-xl border border-stone-800">
            <div>
              <div className="flex items-center gap-2">
                {getPathIcon(currentPath.type)}
                <h4 className="text-sm font-bold text-white font-display">
                  {currentPath.targetPlatform}
                </h4>
              </div>
              <p className="text-xs text-stone-400 mt-1">
                Target Channel Suitability Match: <strong className="text-amber-400 font-mono">{currentPath.suitabilityScore}%</strong>
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono border-t sm:border-t-0 border-stone-800 pt-2 sm:pt-0">
              <div className="bg-stone-900 px-3 py-1.5 rounded-lg border border-stone-800">
                <span className="text-[10px] text-stone-400 block uppercase font-sans">Est Net Payout</span>
                <span className="font-bold text-emerald-400">{currentPath.estimatedPayout}</span>
              </div>
              <div className="bg-stone-900 px-3 py-1.5 rounded-lg border border-stone-800">
                <span className="text-[10px] text-stone-400 block uppercase font-sans">Turnaround</span>
                <span className="font-bold text-stone-200 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  {currentPath.turnaroundTime}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Execution Steps */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5 mb-3">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Step-by-Step Setup Walkthrough
            </h5>

            <div className="space-y-2">
              {currentPath.stepsToExecute.map((step, sIdx) => {
                const key = `${currentPath.id}-${sIdx}`;
                const isDone = !!completedSteps[key];
                return (
                  <div
                    key={sIdx}
                    onClick={() => toggleStep(sIdx)}
                    className={`p-3 rounded-xl border flex items-start gap-3 transition-all cursor-pointer ${
                      isDone
                        ? "bg-emerald-950/30 border-emerald-800/60 text-emerald-200"
                        : "bg-stone-950/60 border-stone-800 hover:border-stone-700 text-stone-300"
                    }`}
                  >
                    <button type="button" className="shrink-0 mt-0.5 cursor-pointer">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-950" />
                      ) : (
                        <Circle className="w-4 h-4 text-stone-500 hover:text-stone-300" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <span className="text-xs leading-relaxed block font-medium">
                        <strong className="text-stone-400 mr-1 font-mono">Step {sIdx + 1}:</strong>
                        {step}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ready-to-Copy Customized Post / Outreach Draft */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5 text-amber-400" />
                Custom Ready-To-Post / Outreach Copy
              </h5>
              <button
                type="button"
                onClick={() => handleCopyText(currentPath.customPostCopy)}
                className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-700"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-stone-400" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>

            <pre className="text-xs text-stone-200 bg-stone-950 p-4 rounded-xl border border-stone-800 whitespace-pre-wrap font-mono leading-relaxed select-all overflow-x-auto">
              {currentPath.customPostCopy}
            </pre>
          </div>

          {/* Pro Tips ("How to get the most out of it with ease") */}
          {currentPath.proTips && currentPath.proTips.length > 0 && (
            <div className="bg-amber-950/20 border border-amber-800/40 p-4 rounded-xl space-y-2">
              <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Pro Profit Maximizers ("How to get the most with ease")
              </h5>
              <ul className="space-y-1.5">
                {currentPath.proTips.map((tip, tIdx) => (
                  <li key={tIdx} className="text-xs text-amber-200/90 flex items-start gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
