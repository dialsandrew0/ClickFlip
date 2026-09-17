import React, { useState } from "react";
import { ViolinBowForensics } from "../types";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Award,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  FileText
} from "lucide-react";

interface ViolinForensicPanelProps {
  forensics?: ViolinBowForensics;
  identifiedName: string;
  makerBrand?: string;
  category?: string;
  tarisioUrl?: string;
  reverbUrl?: string;
  ebayUrl?: string;
}

export const ViolinForensicPanel: React.FC<ViolinForensicPanelProps> = ({
  forensics,
  identifiedName,
  makerBrand,
  category,
  tarisioUrl,
  reverbUrl,
  ebayUrl,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"label" | "anatomy" | "cracks" | "bow" | "tiers">("label");

  // Determine if this item has violin/bow context
  const hasLabel = Boolean(forensics?.labelAnalysis?.transcription);
  const crackDiscount = forensics?.crackSeverityMap?.valueDiscountPercent || 0;

  // Safe fallback search URL for Tarisio Cozio archive
  const makerSearch = encodeURIComponent(makerBrand || identifiedName.replace(/copy|model|violin/gi, "").trim() || "violin");
  const liveTarisioLink = tarisioUrl || `https://tarisio.com/cozio-archive/price-history/?maker=${makerSearch}`;

  return (
    <div className="bg-stone-900 border border-amber-900/60 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5 relative overflow-hidden">
      {/* Subtle violin/antique wood aesthetic banner */}
      <div className="absolute top-0 right-0 w-96 h-32 bg-gradient-to-bl from-amber-600/10 via-amber-900/5 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold font-display text-stone-100 tracking-wide">
                Violin & Bow Forensic Appraisal
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-stone-950 uppercase tracking-wider">
                God-Tier Engine
              </span>
            </div>
            <p className="text-xs font-mono text-stone-400">
              Cremona facsimile deconstruction, McKinley tariff dating, tonewood grading & crack damage matrix
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={liveTarisioLink}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-700/50 text-amber-300 text-xs font-mono flex items-center gap-1.5 transition-all"
            title="Search Tarisio Cozio Fine Instrument Archive"
          >
            <span>Tarisio Archive</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4 pt-1">
          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-stone-950/80 p-1.5 rounded-2xl border border-stone-800 overflow-x-auto no-scrollbar">
            {[
              { id: "label", label: "1. Label Deconstruction", count: hasLabel ? "Label Detected" : undefined },
              { id: "anatomy", label: "2. 5-Point Anatomy", count: "Spruce / Maple" },
              { id: "cracks", label: "3. Crack Damage Matrix", count: crackDiscount > 0 ? `-${crackDiscount}%` : "No Cracks" },
              { id: "bow", label: "4. Bow Appraisal", count: forensics?.bowEvaluation?.included ? "Bow Included" : "Bow Check" },
              { id: "tiers", label: "5. Workshop Tiers", count: "$50 - $25k+" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`py-1.5 px-3 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeSubTab === tab.id
                    ? "bg-amber-400 text-stone-950 shadow-sm"
                    : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/60"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      activeSubTab === tab.id
                        ? "bg-stone-950/20 text-stone-950"
                        : "bg-stone-800 text-stone-300"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* TAB 1: LABEL DECONSTRUCTION */}
          {activeSubTab === "label" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-mono font-bold text-stone-200 uppercase tracking-wider">
                      Facsimile Label Reality Check
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950 border border-amber-800 text-amber-300">
                    {forensics?.labelAnalysis?.verdict === "facsimile_trade"
                      ? "Facsimile Workshop Copy"
                      : forensics?.labelAnalysis?.verdict === "genuine_workshop"
                      ? "Genuine Workshop Label"
                      : forensics?.labelAnalysis?.verdict === "master_luthier"
                      ? "High-Grade Signed Master"
                      : "Trade / Workshop Model"}
                  </span>
                </div>

                {forensics?.labelAnalysis?.transcription && (
                  <div className="p-3 bg-stone-900/90 rounded-xl border border-amber-900/40 font-serif italic text-amber-200 text-sm tracking-wide text-center">
                    "{forensics.labelAnalysis.transcription}"
                  </div>
                )}

                <p className="text-xs font-mono text-stone-300 leading-relaxed">
                  {forensics?.labelAnalysis?.explanation ||
                    "99.9% of violins found at estate sales bearing 'Antonius Stradivarius Cremonensis Faciebat Anno 1716' or 'Joseph Guarnerius' labels are commercial workshop facsimile copies made between 1880 and 1930 in Saxony (Markneukirchen), Bohemia (Schönbach), Bavaria (Mittenwald), or France (Mirecourt)."}
                </p>

                {/* McKinley Tariff Era Card */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-stone-800/80">
                  <div className="p-2.5 rounded-xl bg-stone-900/70 border border-stone-800">
                    <span className="text-[10px] font-mono text-stone-400 uppercase block font-bold">
                      Pre-1890 (No Country)
                    </span>
                    <span className="text-xs font-mono text-stone-300 block pt-0.5">
                      No country mark on label; indicative of 19th-century European trade.
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-stone-900/70 border border-stone-800">
                    <span className="text-[10px] font-mono text-amber-400 uppercase block font-bold">
                      1890 - 1920 (Country Name)
                    </span>
                    <span className="text-xs font-mono text-stone-300 block pt-0.5">
                      Stamped with country only ("Germany", "France", "Bavaria", "Czechoslovakia").
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-stone-900/70 border border-stone-800">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase block font-bold">
                      Post-1921 ("Made In...")
                    </span>
                    <span className="text-xs font-mono text-stone-300 block pt-0.5">
                      Stamped strictly with "Made in Germany" or "Made in Czecho-Slovakia".
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 5-POINT ANATOMICAL FORENSICS */}
          {activeSubTab === "anatomy" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Purfling Channel Check */}
                <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                      1. Purfling Channel
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        forensics?.purflingAssessment?.type === "inlaid_3ply"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : forensics?.purflingAssessment?.type === "painted_scratched"
                          ? "bg-rose-950 text-rose-400 border border-rose-800"
                          : "bg-stone-800 text-stone-300"
                      }`}
                    >
                      {forensics?.purflingAssessment?.type === "inlaid_3ply"
                        ? "Inlaid 3-Ply Wood"
                        : forensics?.purflingAssessment?.type === "painted_scratched"
                        ? "Painted Faux (Student Tell)"
                        : "Inspection Recommended"}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-stone-300 leading-relaxed">
                    {forensics?.purflingAssessment?.qualityNotes ||
                      "Genuine violins feature an inlaid 3-ply strip (ebony/maple/ebony) hand-grooved with sharp mitred 'bee-stings' into corner corners. Painted or scratched faux purfling indicates an entry-level student fiddle worth <$100."}
                  </p>
                </div>

                {/* 2. Tonewood & Flame */}
                <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                      2. Tonewood & Flame
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-stone-800 text-stone-300">
                      Spruce & Maple
                    </span>
                  </div>
                  <p className="text-xs font-mono text-stone-300 leading-relaxed">
                    {forensics?.tonewoodFlameGrade ||
                      "Inspect the top plate for straight, tightly spaced vertical annual growth rings (alpine/Carpathian spruce). The back plate, ribs, and scroll should display prominent transverse 'tiger flame' curl figure."}
                  </p>
                </div>

                {/* 3. Internal Corner Blocks & Linings */}
                <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                      3. Internal Corner Blocks
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-stone-800 text-stone-300">
                      Look Through F-Hole
                    </span>
                  </div>
                  <p className="text-xs font-mono text-stone-300 leading-relaxed">
                    Classical European construction includes 4 solid triangular spruce blocks in the rib corners and continuous willow linings. Cheap Saxon/Bohemian trade shortcuts often omit internal blocks entirely.
                  </p>
                </div>

                {/* 4. Scroll & Pegbox Volute */}
                <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                      4. Scroll & Pegbox Volute
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-stone-800 text-stone-300">
                      Carving Depth
                    </span>
                  </div>
                  <p className="text-xs font-mono text-stone-300 leading-relaxed">
                    Examine the back of the scroll volute. Master and artisan instruments have fluting carved cleanly all the way into the pegbox throat. Bushings (circular wood rings around peg holes) indicate pro player maintenance.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CRACK DAMAGE MATRIX */}
          {activeSubTab === "cracks" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-mono font-bold text-stone-200 uppercase tracking-wider">
                      Critical Structural Crack Severity & Market Penalties
                    </span>
                  </div>
                  {crackDiscount > 0 && (
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-rose-950 border border-rose-800 text-rose-300">
                      Estimated Damage Discount: -{crackDiscount}%
                    </span>
                  )}
                </div>

                <div className="space-y-2 pt-1">
                  {/* Soundpost Crack on Back */}
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded bg-rose-900 text-rose-200 text-[10px] font-mono font-bold uppercase shrink-0">
                      -50% to -75%
                    </span>
                    <div>
                      <span className="text-xs font-mono font-bold text-rose-300 block">
                        Soundpost Crack on the Back Plate (Fatal Defect)
                      </span>
                      <p className="text-[11px] font-mono text-rose-200/80 leading-relaxed">
                        The soundpost sustains 12-15 lbs of downward string tension directly onto the back. A crack in this zone requires an extensive internal soundpost patch ($500-$1,200 luthier repair) and permanently devalues the instrument by 50% to 75%.
                      </p>
                    </div>
                  </div>

                  {/* Soundpost Crack on Top */}
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-900/60 flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded bg-amber-900 text-amber-200 text-[10px] font-mono font-bold uppercase shrink-0">
                      -30% to -40%
                    </span>
                    <div>
                      <span className="text-xs font-mono font-bold text-amber-300 block">
                        Soundpost Crack on the Top Spruce Plate
                      </span>
                      <p className="text-[11px] font-mono text-amber-200/80 leading-relaxed">
                        Located near the treble foot of the bridge. Requires opening the instrument to install interior cleats/reinforcements.
                      </p>
                    </div>
                  </div>

                  {/* Bass Bar Crack */}
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-900/60 flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded bg-amber-900 text-amber-200 text-[10px] font-mono font-bold uppercase shrink-0">
                      -25% to -35%
                    </span>
                    <div>
                      <span className="text-xs font-mono font-bold text-amber-300 block">
                        Bass Bar Crack (Beneath G-Foot of Bridge)
                      </span>
                      <p className="text-[11px] font-mono text-amber-200/80 leading-relaxed">
                        Runs directly along the internal longitudinal bass bar. Requires removing the top plate and replacing or refitting the bass bar.
                      </p>
                    </div>
                  </div>

                  {/* Open Seams */}
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/60 flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-900 text-emerald-200 text-[10px] font-mono font-bold uppercase shrink-0">
                      -0% to -5%
                    </span>
                    <div>
                      <span className="text-xs font-mono font-bold text-emerald-300 block">
                        Open Seams (Rib & Plate Separation — Benign)
                      </span>
                      <p className="text-[11px] font-mono text-emerald-200/80 leading-relaxed">
                        Dry hide glue separating between ribs and top/back plates is standard and designed to happen to prevent wood splitting. Easily reglued by any luthier with fresh hot hide glue ($40-$80).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BOW FORENSICS */}
          {activeSubTab === "bow" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-mono font-bold text-stone-200 uppercase tracking-wider">
                      Bow Forensics: The Case's Secret Fortune
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400">
                    Often worth more than the violin itself
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Wood Species */}
                  <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-1.5">
                    <span className="text-[10px] font-mono text-amber-400 uppercase font-bold block">
                      Stick Wood Species
                    </span>
                    <span className="text-xs font-mono font-bold text-stone-200 block">
                      {forensics?.bowEvaluation?.stickWood || "Pernambuco vs Brazilwood"}
                    </span>
                    <p className="text-[11px] font-mono text-stone-400 leading-relaxed">
                      Genuine Brazilian Pernambuco (Caesalpinia echinata) is dense, highly resonant, orange-brown heartwood. Now protected under CITES, fine Pernambuco sticks command $800 to $20,000+. Common Brazilwood commands $50 to $200.
                    </p>
                  </div>

                  {/* Metal Mountings */}
                  <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-1.5">
                    <span className="text-[10px] font-mono text-amber-400 uppercase font-bold block">
                      Frog & Button Mountings
                    </span>
                    <span className="text-xs font-mono font-bold text-stone-200 block">
                      {forensics?.bowEvaluation?.fittingsMetal || "Solid Silver vs Nickel-Silver"}
                    </span>
                    <p className="text-[11px] font-mono text-stone-400 leading-relaxed">
                      Nickel-silver is used on student/commercial bows ($50-$300). Solid Sterling Silver (white patina, non-magnetic) indicates pro/orchestral bows ($1,000-$8,000). 14k/18k Gold indicates master presentation bows ($10,000+).
                    </p>
                  </div>
                </div>

                {/* Maker Stamps Check */}
                <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-1.5">
                  <span className="text-[10px] font-mono text-stone-300 uppercase font-bold block">
                    Maker Stamp Triage (Inspect Above Frog):
                  </span>
                  <p className="text-xs font-mono text-stone-300 leading-relaxed">
                    Check the facet of the stick directly above the frog or underneath the leather thumb grip. Look for stamps like <span className="text-amber-300 font-bold">Tourte, Peccatte, Sartory, Lamy, Voirin, Tubbs, Vigneron, Nürnberger, H.R. Pfretzschner, Bausch, Hoyer, or Dürrschmidt</span>.
                  </p>
                  <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-900/50 flex items-center gap-2 text-[11px] font-mono text-rose-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>Warning: A hairline fracture at the tip/head mortise destroys 80%+ of a bow's collector value.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: WORKSHOP VALUATION TIERS */}
          {activeSubTab === "tiers" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-3">
                <span className="text-xs font-mono font-bold text-stone-200 uppercase tracking-wider block">
                  Secondary Resale Valuation Tiers for Bowed Strings
                </span>

                <div className="space-y-2 text-xs font-mono">
                  {/* Tier 1 */}
                  <div className="p-3 rounded-xl bg-stone-900 border border-amber-500/30 space-y-1">
                    <div className="flex items-center justify-between text-amber-300 font-bold">
                      <span>Tier 1: Master Trade & Signed Luthiers</span>
                      <span>$3,000 – $25,000+</span>
                    </div>
                    <p className="text-[11px] text-stone-400 leading-relaxed">
                      Ernst Heinrich Roth (1920s Markneukirchen with stamped EHR brand & serials), Heinrich Theodor Heberlein Jr., Paul Knorr, John Juzek "Master Art" (Prague), Charles J.B. Collin-Mézin (Paris, pencil signed on inner back), Marc Laberte, Honoré Derazey, Neuner & Hornsteiner.
                    </p>
                  </div>

                  {/* Tier 2 */}
                  <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-1">
                    <div className="flex items-center justify-between text-stone-200 font-bold">
                      <span>Tier 2: Quality European Workshop Fiddles</span>
                      <span>$600 – $3,000</span>
                    </div>
                    <p className="text-[11px] text-stone-400 leading-relaxed">
                      J.T.L. (Jérôme Thibouville-Lamy: Medio-Fino, Compagnon, Mansuy, Breton Brevete), Schönbach / Luby Czech workshops, Lyon & Healy / Sears Roebuck early imports, Jackson-Guldan, Juzek commercial models.
                    </p>
                  </div>

                  {/* Tier 3 */}
                  <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-1">
                    <div className="flex items-center justify-between text-stone-200 font-bold">
                      <span>Tier 3: Modern Bench-Made Asian Luthiers</span>
                      <span>$500 – $2,500</span>
                    </div>
                    <p className="text-[11px] text-stone-400 leading-relaxed">
                      Eastman (VL305, VL701), Scott Cao (STV-750/850), Jay Haide (l'ancienne antique varnish), Snow. Consistent spruce/maple tonewoods with antique hand varnish.
                    </p>
                  </div>

                  {/* Tier 4 */}
                  <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-1">
                    <div className="flex items-center justify-between text-stone-400 font-bold">
                      <span>Tier 4: Mass-Market Student Fiddles</span>
                      <span>$50 – $150</span>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-relaxed">
                      Skylark, Mendini, Cecilio, unbranded pressed plywood tops, spray polyurethane lacquer, dyed pearwood fingerboards, painted faux purfling.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
