import { NicheConfig } from "./types";

export const NICHE_CONFIGS: NicheConfig[] = [
  {
    id: "auto",
    name: "Auto-Detect Specialty",
    icon: "Sparkles",
    accentColor: "amber",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    borderColor: "border-amber-500",
    description: "AI research automatically detects domain, hallmarks, and valuation rules during scan.",
    evidencePrompt: "Auto-detect item domain, hallmark locations, material composition, and valuation formula.",
    checklist: [
      "AI classifies item category & specialty domain automatically",
      "Locates hallmark stamps, maker signatures, or tags",
      "Calibrates physical dimensions via scale card",
      "Evaluates reproduction risk & generates sales strategy"
    ],
    valuationRubric: "Auto-selected valuation algorithm based on detected category.",
    sampleComps: "eBay sold, Discogs, Heritage Auctions, Grailed, PCGS",
    questions: []
  },
  {
    id: "general",
    name: "General Flipper",
    icon: "Layers",
    accentColor: "emerald",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    borderColor: "border-emerald-500",
    description: "Multi-purpose triage for dumpster finds, garage sales, and unclassified junk.",
    evidencePrompt: "Look for manufacturer names, model numbers, patent markings, and overall material weight.",
    checklist: [
      "Brand names, stamped logo, or serial plates",
      "Patent dates, model/SKU numbers, or country of origin",
      "Material composition (brass, solid wood, cast iron, plastics)",
      "Signs of repair, replacement parts, or non-original screws"
    ],
    valuationRubric: "Weigh condition heavily. Broken items value decreases 70%+. Check sold comps with matching condition filters.",
    sampleComps: "eBay sold items, Mercari listings, local Facebook Marketplace",
    questions: [
      {
        id: "weight_composition",
        label: "Weight / Composition Feel",
        options: ["Heavy & Solid Metal", "Stamped Plastic", "Solid Hardwood", "Veneer/MDF Particle Board", "Cheap Alloy/Pewter"]
      },
      {
        id: "brand_logo",
        label: "Visible Brand Stamp or Logo?",
        options: ["Crisp & Clear Stamp", "Faded / Damaged Label", "No Branding Found"]
      }
    ]
  },
  {
    id: "artperiod",
    name: "Art & Decor",
    icon: "Palette",
    accentColor: "amber",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    borderColor: "border-amber-500",
    description: "Specialized analysis for paintings, mid-century furniture, pottery, and art glassware.",
    evidencePrompt: "Focus on artist signatures, maker marks, material aging (patina, craquelure), and base wear.",
    checklist: [
      "Artist signature, monogram, or gallery labels on rear",
      "Maker's mark, studio stamp, or embossed numbers on base",
      "Authentic age cues: craquelure in oil, bottom-wear on pottery, oxidation on metal",
      "Reproduction indicators: pixelated print dots, fresh clay bottoms, uniform modern screws"
    ],
    valuationRubric: "Signatures can amplify value by 10x. Maker attribution on furniture must match construction tells (dovetails, hardware age).",
    sampleComps: "LiveAuctioneers, 1stDibs, eBay completed fine art",
    questions: [
      {
        id: "artist_signature",
        label: "Artist Signature Status",
        options: ["Hand-Signed by Artist", "Printed/Plate Signature", "Monogrammed / Embossed", "No Signature Found"]
      },
      {
        id: "decor_cues",
        label: "Physical Age Indicators",
        options: ["Organic Craquelure (Paint cracks)", "Authentic Patina/Oxidation", "Bottom base wear (Pre-modern)", "Looks completely pristine/New"]
      }
    ]
  },
  {
    id: "coins",
    name: "Numismatics",
    icon: "Coins",
    accentColor: "indigo",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    borderColor: "border-indigo-500",
    description: "Focus on coins, silver bullion, tokens, and vintage paper currency.",
    evidencePrompt: "Capture both obverse (front) and reverse (back) faces clearly. Examine mint marks and wear grade.",
    checklist: [
      "Year of minting and mint mark letter (e.g. 'S', 'CC', 'O', 'D')",
      "Metal composition (silver rings differently; look for copper edge line in clad coins)",
      "Grade indicators: detail remaining in feathers, hair, or lettering edges",
      "Error variations: double-dies, off-center strikes, or clipped planchets"
    ],
    valuationRubric: "Melt value vs numismatic collector value. Melt values are floor price; grade condition defines the ceiling.",
    sampleComps: "PCGS Price Guide, NGC Coin, eBay sold graded coins",
    questions: [
      {
        id: "mint_mark",
        label: "Mint Mark Present?",
        options: ["Yes - visible letter stamp", "No Mint Mark (Philadelphia)", "Heavily worn / Indistinct"]
      },
      {
        id: "coin_edge",
        label: "Coin Edge Style",
        options: ["Reeded Edge (Grooved)", "Smooth / Plain Edge", "Lettered Edge (Embossed text)", "Copper clad layers visible on edge"]
      }
    ]
  },
  {
    id: "books_vinyl",
    name: "Books & Vinyl",
    icon: "Music",
    accentColor: "purple",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    borderColor: "border-purple-500",
    description: "Analysis for rare books, first editions, vintage vinyl records, and cassette tapes.",
    evidencePrompt: "Capture copyright page with printing numbers, barcode/ISBN, matrix runout numbers, or record label.",
    checklist: [
      "First edition indicators: full '1 2 3 4 5 6' number line, or direct first printing statement",
      "Matrix runout/deadwax inscriptions on vinyl (catalogue number + pressing engineer initials)",
      "Dust jacket presence and price block (not clipped)",
      "Vinyl sleeve or media condition (scratches, scuffs, mold, spindle wear)"
    ],
    valuationRubric: "Dust jackets make up 70% of book value. Vinyl grade is strictly determined by Goldmine standards (NM, VG+, VG).",
    sampleComps: "Discogs sold history, AbeBooks completed, eBay sold records",
    questions: [
      {
        id: "sleeve_jacket",
        label: "Original Jacket / Sleeve Status",
        options: ["Completely Intact & Crisp", "Torn, taped, or heavily stained", "Missing completely", "N/A"]
      },
      {
        id: "runout_matrix",
        label: "Deadwax Matrix / Book Printing Line",
        options: ["First printing number line present", "Later printing/edition numbering", "Runout Deadwax etching found", "None found"]
      }
    ]
  },
  {
    id: "vintage_clothing",
    name: "Vintage Garms",
    icon: "Shirt",
    accentColor: "rose",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    borderColor: "border-rose-500",
    description: "Identify true vintage clothing, streetwear tees, tags, and designer fabrics.",
    evidencePrompt: "Examine the neck tags, brand styling, hem stitching (single vs double), and zipper manufacturer.",
    checklist: [
      "Tag design & origin (Made in USA, single-stitch sleeves indicating pre-1995)",
      "Zipper brand (Talon, YKK, Scovill, Ideal) and metal composition",
      "Stitching type: raw hems, single stitch, overlock, double-needle",
      "Fabric content, copyright years below graphic, or paper care tags"
    ],
    valuationRubric: "Brand + single stitch graphic tees hold high premium. Condition issues like fading or paper-thin wear can sometimes enhance value, but pit stains or tears deduct value.",
    sampleComps: "Grailed, Depop sold listings, eBay vintage listings",
    questions: [
      {
        id: "hem_stitch",
        label: "Sleeve & Bottom Hem Stitching",
        options: ["Single Stitch (Classic pre-1995)", "Double Stitch (Modern standard)", "Overlocked / Raw Edge", "Blind Hem"]
      },
      {
        id: "tag_brand",
        label: "Brand Neck Tag Design",
        options: ["Vintage Made in USA style", "Modern screenprinted neck tag", "Paper / care tag with modern barcode", "Tag cut off or missing"]
      }
    ]
  }
];

export function getNicheConfig(id: string): NicheConfig {
  return NICHE_CONFIGS.find(c => c.id === id) || NICHE_CONFIGS[0];
}
