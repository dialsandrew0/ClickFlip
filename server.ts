import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Helper to reliably parse and sanitize Base64 data URIs
function parseBase64Image(dataUriOrBase64: string): { mimeType: string; data: string } {
  let mimeType = "image/jpeg";
  let data = String(dataUriOrBase64 || "").trim();

  if (data.startsWith("data:")) {
    const commaIndex = data.indexOf(",");
    if (commaIndex !== -1) {
      const header = data.slice(0, commaIndex);
      const mimeMatch = header.match(/data:([^;]+)/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
      data = data.slice(commaIndex + 1).trim();
    }
  }

  return { mimeType, data };
}

// Lazy-loaded Gemini AI Client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    let apiKey = process.env.GEMINI_API_KEY;

    // Fallback: Check AI Studio dev environment JSON if process.env was not populated
    if (!apiKey) {
      try {
        const devEnvPath = path.resolve(process.cwd(), "../.dev.env.json");
        if (fs.existsSync(devEnvPath)) {
          const devEnv = JSON.parse(fs.readFileSync(devEnvPath, "utf-8"));
          if (devEnv?.GEMINI_API_KEY) {
            apiKey = devEnv.GEMINI_API_KEY;
            process.env.GEMINI_API_KEY = apiKey;
          }
        }
      } catch {
        // Continue to check other sources
      }
    }

    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not configured in environment variables. " +
        "Please add your GEMINI_API_KEY in the Settings > Secrets panel of AI Studio."
      );
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const app = express();
const PORT = 3000;

// Increase limit to accommodate base64 image uploads from the camera scanner
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

// Prevent HTML error pages from body parsing failures
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err?.type === "entity.too.large") {
    return res.status(413).json({
      error: "Image payload is too large. Please capture or upload a smaller image.",
    });
  }
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      error: "Malformed JSON payload in request.",
    });
  }
  next(err);
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Resale analysis endpoint
app.post("/api/analyze", async (req, res) => {
  try {
    const { imageBase64, additionalImages, nicheId, nicheName, quickVerdictOnly, condition, pastCorrections } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image file provided." });
    }

    const ai = getGeminiClient();

    // Clean image data prefix if present and detect MIME type
    const parsedHero = parseBase64Image(imageBase64);

    // Prepare content parts for Gemini
    const parts: any[] = [
      {
        inlineData: {
          mimeType: parsedHero.mimeType,
          data: parsedHero.data,
        },
      }
    ];

    // Add any additional photos (maker mark, flaw, scale card)
    if (Array.isArray(additionalImages)) {
      for (const extraImg of additionalImages) {
        if (typeof extraImg === "string" && extraImg.length > 50) {
          const parsedExtra = parseBase64Image(extraImg);
          parts.push({
            inlineData: {
              mimeType: parsedExtra.mimeType,
              data: parsedExtra.data,
            },
          });
        }
      }
    }

    let correctionsContext = "";
    if (pastCorrections && Array.isArray(pastCorrections) && pastCorrections.length > 0) {
      correctionsContext = `
[CORRECTION MEMORY - IMPORTANT]:
The user has previously corrected misidentifications for similar items. You MUST adhere to these corrections if the item matches:
${pastCorrections.map(c => `- Previously misidentified as "${c.originalName}" -> Corrected to "${c.correctedName}"`).join('\n')}
`;
    }

    // Scale reference object calibration logic
    const scaleRef = condition?.scaleReference || "none";
    let scaleInstruction = "";
    if (scaleRef === "credit_card") {
      scaleInstruction = `
[SCALE CALIBRATION REFERENCE]: Standard Credit Card / ID Card (8.56 cm width x 5.40 cm height).
Calculate the physical width, height, and optional depth in centimeters by comparing its proportions relative to the card in the photo.
`;
    } else if (scaleRef === "quarter") {
      scaleInstruction = `
[SCALE CALIBRATION REFERENCE]: Standard US Quarter Coin (2.426 cm / 24.26mm diameter).
Calculate physical dimensions in centimeters relative to the quarter coin.
`;
    } else if (scaleRef === "ruler") {
      scaleInstruction = `
[SCALE CALIBRATION REFERENCE]: Physical Ruler / Measuring Tape visible in frame.
Read scale markings to calculate exact dimensions in centimeters.
`;
    }

    // Context from user-supplied notes / asking price
    let userContextNotes = "";
    if (condition?.askingPrice) {
      userContextNotes += `\n- Asking / Acquisition Price: $${condition.askingPrice}`;
    }
    if (condition?.suspectedBrand) {
      userContextNotes += `\n- Suspected Brand / Era by User: "${condition.suspectedBrand}"`;
    }
    if (condition?.userNotes) {
      userContextNotes += `\n- User Note / Target Inquiry: "${condition.userNotes}"`;
    }

    // Condition context
    let conditionContext = "";
    if (condition) {
      conditionContext = `
[User-reported Condition Details]:
- Functional Status: ${condition.functional || "unspecified"}
- Completeness: ${condition.complete || "unspecified"}
- Specific Wear & Damage notes: "${condition.wearNotes || "none provided"}"
${userContextNotes}
`;
    }

    const userPrompt = `
Analyze the attached photo(s) of this resale or thrift item.
Active Category: ${nicheName || "General Collectible"} (ID: ${nicheId || "auto"})
Quick Verdict Mode: ${quickVerdictOnly ? "YES - prioritize fast valuation, auto-determined focus category, and buy/pass decision" : "NO - provide complete valuation and listing generator"}

${scaleInstruction}
${conditionContext}
${correctionsContext}

Your purpose is to provide an EVIDENCE-GRADE resale research appraisal:
0. FOCUS CATEGORY DETERMINATION:
   - Carefully examine the visual hallmarks and determine which focus specialty category best classifies this item:
     * 'instruments': Musical Instruments & Pro Audio (electric & acoustic guitars, basses, tube amplifiers, effects pedals, synthesizers, keyboards, brass, woodwinds, violins, cellos, drums, cymbals, vintage studio gear)
     * 'artperiod': Art & Decor (paintings, studio pottery, mid-century furniture, vintage art glass, porcelain)
     * 'coins': Numismatics (coins, silver bullion, tokens, paper currency)
     * 'books_vinyl': Books & Vinyl (rare books, first printings, vinyl records, audio media, vintage ephemera)
     * 'vintage_clothing': Vintage Garms (vintage clothing, single-stitch tees, vintage denim, designer apparel)
     * 'general': General Flipper (electronics, tools, mechanical items, toys, unclassified collectibles)
   - Set 'detectedNicheId' to one of: 'instruments', 'artperiod', 'coins', 'books_vinyl', 'vintage_clothing', or 'general'.
   - Set 'detectedNicheName' to the human title (e.g. 'Musical Instruments', 'Art & Decor', 'Numismatics', 'Books & Vinyl', 'Vintage Garms', 'General Flipper').

SPECIALTY FORENSIC KNOWLEDGE FOR MUSICAL INSTRUMENTS & AUDIO GEAR:
- GUITARS & BASSES (ELECTRIC & ACOUSTIC):
  * Fender: Pre-CBS (pre-1965, clay dots, spaghetti logo, small headstock, nitrocellulose lacquer), CBS era (1965-1981, transition/black logo, pearl dots, F-plate, 3-bolt neck 1971-81), Dan Smith/Fullerton reissues (1982-1984), Japanese JV/E-series Fujigen (1982-1987). Inspect neck heel date stamps, pot codes (e.g. CTS 137YYWW = 137 [CTS] + year + week), grey/black pickup bobbins.
  * Gibson: Golden Era (1950s-1960s, PAF sticker vs Patent No. sticker, inked serials, Brazilian rosewood boards, holly headstock veneer, ABR-1 bridge without retaining wire), Norlin Era (1969-1985, pancake bodies, 3-piece maple necks, neck volute, large headstock, stamped serial with Made in USA). CRITICAL: Examine the back of the headstock/neck junction for smile fracture repairs (headstock breaks immediately reduce market value by 40-50%). Spot "Chibson" counterfeits: 3-screw truss rod cover (authentic Gibson has 2 screws), metric slotted bridge posts, lack of fret binding nibs.
  * Acoustic Guitars (Martin, Gibson, Guild): Martin serial lookup for exact year; pre-war herringbone trim, Brazilian rosewood (pre-1969) vs Indian rosewood, Adirondack red spruce vs Sitka, hide glue construction, scalloped forward-shifted X-bracing. Inspect bridge belly bulge, bridge lifting, and neck reset necessity (action height at 12th fret). Lawsuit era copies (Ibanez, Tokai, Greco, Burny, Takamine).
- BRASS & WOODWINDS:
  * Selmer Paris saxophones (Mark VI legendary serial lookup ~54,000 to ~230,000, five-digit serials command peak collector comps; Balanced Action, Super Action 80), original lacquer percentage, bell engraving crispness, matching neck serial numbers, pad condition.
  * Conn: 6M (Naked Lady / Lady in the Face engraving), 10M tenor, New Wonder.
  * Bach: Mt. Vernon NY vs early Elkhart vs Corporation bell stamps on Stradivarius trumpets.
  * Clarinets: Buffet Crampon R13 (check Grenadilla wood grain for hairline cracks between trill keys).
- SYNTHESIZERS, KEYS & PRO AUDIO:
  * Analogs: Moog Minimoog Model D (oscillator board revisions, clear vs textured pitch wheels), Roland Juno-60 vs Juno-106 (test for failing 80017A VCF/VCA voice chips), Jupiter-8, TR-808/909, Sequential Prophet-5 (Rev 2 SSM vs Rev 3 Curtis CEM).
  * Keys: Fender Rhodes Mark I vs II (wooden vs plastic harp hammers, flat top vs rounded), Wurlitzer 200 vs 200A.
  * Pedals: Klon Centaur (gold/silver, horsie vs non-horsie, gooped PCB), original TS808 Tube Screamer (JRC4558D op-amp chip), vintage Electro-Harmonix Big Muff Pi (Triangle, Ram's Head, Violet, Russian Sovtek).
  * Amps: Fender Tweed (1950s), Blackface (1964-1967, AB763 circuit), Silverface (1968 drip-edge transition), Marshall Plexi & JCM800 (horizontal vs vertical input jacks, Drake/Dagnall transformers).
- BOWED STRINGS & MASTER/TRADE VIOLINS & BOWS (GOD-TIER FORENSICS):
  * THE FACSIMILE LABEL REALITY MATRIX:
    - 99.9% of violins bearing labels like "Antonius Stradivarius Cremonensis Faciebat Anno 1716", "Joseph Guarnerius fecit Cremonae anno 1734 IHS", "Nicolaus Amatus Cremonen.", or "Jacobus Stainer in Absam prope Oenipontum" are NOT authentic Cremonese masterworks. They are 19th/early-20th century workshop trade models (Germany, France, Bohemia, Saxony).
    - McKinley Tariff Act Deciphering:
      • Pre-1890: No country of origin printed on the label (often genuine 19th century Saxon/Bohemian/Mittenwald/French trade).
      • 1890 - 1920: Marked with only country name in English (e.g. "Germany", "France", "Bavaria", "Czechoslovakia").
      • Post-1921: Marked strictly with "Made in Germany", "Made in France", or "Made in Czecho-Slovakia".
      • Printing & Ink: Halftone dotted pattern = modern 20th/21st century photolithography copy; copperplate/woodblock letterpress with heavy ink bite into laid rag paper = genuine 18th/19th century printing.
  * MAKER & WORKSHOP VALUATION TIERS:
    - Tier 1: Master Trade & Signed Luthiers ($3,000 - $25,000+): Ernst Heinrich Roth (1920s Markneukirchen with stamped EHR brand on back & numbered label), Heinrich Theodor Heberlein Jr., Paul Knorr, John Juzek "Master Art" (Prague, two-piece flame back, rich varnish), Charles Jean-Baptiste Collin-Mézin (Paris, signed in pencil on inner back), Marc Laberte, Honoré Derazey, Neuner & Hornsteiner (Mittenwald).
    - Tier 2: Quality European Workshop Fiddles ($600 - $3,000): J.T.L. (Jérôme Thibouville-Lamy: Medio-Fino, Compagnon, Mansuy, Breton Brevete), Schönbach / Luby Czech workshops, Lyon & Healy / Sears Roebuck early imports, Jackson-Guldan, Juzek commercial models.
    - Tier 3: Modern Bench-Made Asian Luthiers ($500 - $2,500): Eastman (VL305, VL701), Scott Cao (STV-750/850), Jay Haide (l'ancienne antique varnish), Snow.
    - Tier 4: Mass-Market Student Fiddles ($50 - $150): Skylark, Mendini, Cecilio, unbranded pressed plywood, spray polyurethane, painted faux purfling.
  * ANATOMICAL FORENSICS (THE 5 GOLDEN TESTS):
    1. Purfling: Real hand-inlaid 3-ply wood (two black dyed strips sandwiching white maple) set into a carved perimeter channel with mitered "bee-sting" corners vs. ink-painted or scratched faux lines (painted purfling is the instant hallmark of an entry-level student box under $100).
    2. Tonewood & Flame Figure: Tight, straight, even vertical annual rings on alpine/Carpathian spruce top plate; high-density "tiger flame" curl figure on two-piece bookmatched or one-piece maple back, ribs, and scroll.
    3. Interior Corner Blocks & Linings: 4 solid triangular spruce corner blocks and continuous spruce/willow rib linings visible through f-holes (Saxon/Bohemian trade shortcuts often omit internal blocks).
    4. Scroll & Pegbox Volute: Deep symmetrical hand carving where the fluting extends completely into the throat of the pegbox. Peg hole bushings (indicate professional luthier care and player pedigree).
    5. Varnish: Luminous, transparent golden-amber or reddish-brown oil/spirit varnish with natural micro-craquelure and honest playing wear vs. thick, opaque, glass-hard modern polyurethane.
  * STRUCTURAL CRACK DESTRUCTION & VALUE DISCOUNT PENALTIES:
    - Soundpost Crack on Back: CATASTROPHIC (-50% to -75% market value discount due to constant 15 lb string pressure; requires internal soundpost patch).
    - Soundpost Crack on Top: Severe (-30% to -40% value discount; requires internal cleats).
    - Bass Bar Crack: Significant (-25% to -35% value discount; requires top removal to repair).
    - Pegbox / Cheek Crack: Moderate (-20% to -30% value discount; requires cheek patch/bushing).
    - Neck Button Break: Moderate (-20% to -30% value discount; requires ebony collar graft).
    - Rib / Plate Seam Separation: Benign (normal hide glue drying; easily reglued by luthier for $40-$80, minimal 0-5% value loss).
  * BOW FORENSICS (THE HIDDEN WEALTH IN VIOLIN CASES):
    - Wood Species: Brazilian Pernambuco (Caesalpinia echinata - dense, orange-brown, CITES Appendix I, highly resonant, $1,000-$50,000+) vs. Brazilwood ($50-$200) vs. Carbon Fiber.
    - Maker Stamps: Stamped above the frog or under the frog: French (Tourte, Peccatte, Sartory, Lamy, Voirin, Tubbs, Vigneron, Maline) and German (Nürnberger, H.R. Pfretzschner, Bausch, Hoyer, Dürrschmidt, Knopf, Seifert).
    - Mountings: Nickel-silver ($50-$300) vs. Solid Sterling Silver ($1,000-$10,000) vs. 14k/18k Gold & Tortoiseshell ($10,000-$60,000+).
    - Frog Eye: Parisian Eye (mother-of-pearl dot encased in nickel/silver ring) vs. single pearl dot vs. plain ebony.
    - Head/Tip Condition: Intact bone/ivory plate vs. hairline fracture in head mortise (head crack destroys 80%+ of bow value).
  * Populate 'violinForensics' when evaluating any violin, viola, cello, double bass, or bow.
- DRUMS & PERCUSSION:
  * Ludwig Keystone badge (1960s pre-serial and serial), Blue/Olive badge (1970s), Supraphonic 400 (chrome-over-brass vs Ludalloy aluminum), 3-ply shells with solid maple re-rings. Gretsch Round Badge, Slingerland Radio King. Vintage Zildjian cymbals (K Zildjian Istanbul stamps with crescent moon & Arabic script command massive premiums; Avedis trans stamps, hollow logo, weights in grams).
- VALUATION BENCHMARKING:
  * Strongly benchmark against Reverb Price Guide sold transactions, eBay sold listings, and vintage dealer guides. Check for original hard shell case (OHSC) presence.

1. IDENTIFICATION:
   - Identify the exact item name, manufacturer/brand, approximate era/decade, model, or pattern name.
   - Assign a realistic confidence percentage (0-100) and explain why in confidenceReason.
2. MARKET RANGE:
   - Provide realistic, conservative 'low', 'median', and 'high' estimated resale prices in USD based on historical sold comp data.
   - State 'numberOfComps' (conservative estimate of similar sold records, typically 5 to 20) and 'compDateRange' (e.g., 'Last 90 Days').
3. NET ESTIMATE (Fee Deduction Formula):
   - 'salePrice': equal to median resale price.
   - 'marketplaceFee': calculate platform cut (~13% standard).
   - 'paymentFee': calculate payment processing fee (~3%).
   - 'shippingCost': realistic buyer or seller shipping cost ($5 - $25 based on size/weight).
   - 'packingCost': estimated box/bubble wrap cost ($1 - $3).
   - 'acquisitionCost': ${condition?.askingPrice ? Number(condition.askingPrice) : 0}.
   - 'netProfit': salePrice minus all fees, shipping, packing, and acquisitionCost.
4. BUY CEILING:
   - Calculate 'buyCeiling': maximum purchase price to ensure a healthy resale margin (e.g. at least 50% net profit or 2.5x-3x ROI).
5. RISK FLAGS:
   - Evaluate 'reproductionRisk' (low, medium, high).
   - 'conditionUncertainty' (low, medium, high).
   - 'authenticityConcerns' (low, medium, high).
   - 'slowSellThrough' (low, medium, high).
   - 'notes': 2-3 specific in-person verification checks (hallmarks, seams, magnet test, tag stitching, etc.).
6. NEXT MOVE STRATEGY:
   - Set 'primaryAction': strictly one of 'list_now', 'lot_it', 'hold_research', 'pass'.
   - 'actionTitle': concise headline (e.g. "List Now on eBay", "Lot It with Similar Mid-Century Glassware", "Pass — Margin Too Thin").
   - 'actionReason': 1-2 sentence honest explanation of why this action was recommended.
   - 'targetPlatform': best marketplace or venue.
   - 'recommendedPriceFormat': 'buy_it_now', 'auction', or 'local_cash'.
   - 'suggestedTargetPrice': listing price.
   - 'bundleTheme': if lot_it is chosen, describe the bundle theme.
   - 'estimatedTurnaroundTime': e.g. "3-7 Days".
   - 'bestOverallPath': summary of strategy.
7. LISTINGS GENERATOR:
   - Ready-to-copy listing tailored for 'ebay', 'reverb', 'poshmark', 'facebookMarketplace', and 'mercari'.
   - Each with 'title' (keyword-rich, max 80 chars), 'description' (clean bulleted details & condition writeup), 'keywords' (array of tags), 'suggestedPrice', and 'priceFormat'.
8. CHECKLIST TELLS & STAGING:
   - 'reproTells': specific counterfeit or modern reproduction tells.
   - 'keyIdentifiers': hallmarks, stamps, material cues.
   - 'stagingPhotoGuide': recommendations for lighting, backdrop, and essential angles to photograph.
`;

    const systemInstruction = `
You are FlipFindr, an evidence-grounded resale research assistant for professional pickers, estate sale sourcers, and antique dealers.
Provide transparent, honest, conservative market evaluations based on historical sold marketplace comparables.
Never invent fake comps, exaggerated valuations, or unearned confidence.
If an item is damaged, common, or has high reproduction risk, state so candidly and recommend 'pass' or 'lot_it' if margins are too narrow after fees and shipping.
Output strictly valid JSON matching the provided schema.
`;

    // Define structural schema matching AnalysisVerdict type
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        detectedNicheId: {
          type: Type.STRING,
          description: "Focus specialty niche ID: 'instruments', 'artperiod', 'coins', 'books_vinyl', 'vintage_clothing', or 'general'.",
        },
        detectedNicheName: {
          type: Type.STRING,
          description: "Focus specialty niche display name (e.g., 'Musical Instruments', 'Art & Decor', 'Numismatics', 'Books & Vinyl', 'Vintage Garms', 'General Flipper').",
        },
        identifiedName: {
          type: Type.STRING,
          description: "Detailed identified item name, maker, brand, and approximate model/year.",
        },
        category: {
          type: Type.STRING,
          description: "Resale category (e.g., 'Vintage Glassware', 'Numismatics', 'Audio Equipment', 'Apparel').",
        },
        makerBrand: {
          type: Type.STRING,
          description: "Identified maker or manufacturer brand.",
        },
        approximateEra: {
          type: Type.STRING,
          description: "Approximate decade or period of manufacture (e.g. '1970s', 'Mid-Century Modern', '1990s', 'Victorian').",
        },
        confidence: {
          type: Type.INTEGER,
          description: "Confidence rating of the identification from 0 to 100.",
        },
        confidenceReason: {
          type: Type.STRING,
          description: "Brief reason justifying the confidence level.",
        },
        lowValue: {
          type: Type.NUMBER,
          description: "Conservative estimated market low price (USD).",
        },
        highValue: {
          type: Type.NUMBER,
          description: "Conservative estimated market high price (USD).",
        },
        currency: {
          type: Type.STRING,
          description: "Currency code, defaults to 'USD'.",
        },
        verdict: {
          type: Type.STRING,
          description: "Actionable recommendation: 'BUY', 'SKIP', or 'PONDER'.",
        },
        verdictReasoning: {
          type: Type.STRING,
          description: "Detailed explanation of why this verdict was reached.",
        },
        valuationMethodology: {
          type: Type.STRING,
          description: "Facts and formulas used for valuation (e.g. 'Historical 90-day eBay sold comps median with deduction for condition wear').",
        },
        reproTells: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Checklist of reproduction indicators or counterfeit warnings to verify in hand.",
        },
        keyIdentifiers: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Key hallmarks, stamps, dates, or details observed in the photo.",
        },
        listingTitle: {
          type: Type.STRING,
          description: "Primary listing title optimized with keywords (Max 80 chars).",
        },
        listingKeywords: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Search keywords or tags.",
        },
        suggestedListingPrice: {
          type: Type.NUMBER,
          description: "Recommended listing price in USD.",
        },
        descriptionWriteup: {
          type: Type.STRING,
          description: "A professional listing description.",
        },
        marketRange: {
          type: Type.OBJECT,
          description: "Evidence-based market range data.",
          properties: {
            low: { type: Type.NUMBER },
            median: { type: Type.NUMBER },
            high: { type: Type.NUMBER },
            numberOfComps: { type: Type.INTEGER, description: "Number of comps used to estimate (5-20)" },
            compDateRange: { type: Type.STRING, description: "E.g., 'Last 90 Days'" },
          },
          required: ["low", "median", "high", "numberOfComps", "compDateRange"]
        },
        netEstimate: {
          type: Type.OBJECT,
          description: "Estimated net payout accounting for platform fees and shipping.",
          properties: {
            salePrice: { type: Type.NUMBER },
            marketplaceFee: { type: Type.NUMBER },
            paymentFee: { type: Type.NUMBER },
            shippingCost: { type: Type.NUMBER },
            packingCost: { type: Type.NUMBER },
            acquisitionCost: { type: Type.NUMBER },
            netProfit: { type: Type.NUMBER }
          },
          required: ["salePrice", "marketplaceFee", "paymentFee", "shippingCost", "packingCost", "netProfit"]
        },
        buyCeiling: { type: Type.NUMBER, description: "Maximum recommended purchase price to maintain target margins." },
        riskFlags: {
          type: Type.OBJECT,
          description: "Analysis of various risk factors.",
          properties: {
            reproductionRisk: { type: Type.STRING, description: "'low', 'medium', or 'high'" },
            conditionUncertainty: { type: Type.STRING, description: "'low', 'medium', or 'high'" },
            authenticityConcerns: { type: Type.STRING, description: "'low', 'medium', or 'high'" },
            slowSellThrough: { type: Type.STRING, description: "'low', 'medium', or 'high'" },
            notes: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["reproductionRisk", "conditionUncertainty", "authenticityConcerns", "slowSellThrough", "notes"]
        },
        nextMoveStrategy: {
          type: Type.OBJECT,
          description: "Actionable strategic recommendation for selling or monetizing this item.",
          properties: {
            primaryAction: { type: Type.STRING, description: "One of: 'list_now', 'lot_it', 'hold_research', 'pass'" },
            actionTitle: { type: Type.STRING, description: "Headline of the next action." },
            actionReason: { type: Type.STRING, description: "Explanation of why this action was chosen." },
            targetPlatform: { type: Type.STRING, description: "Recommended platform (e.g. 'eBay', 'Facebook Marketplace', 'Poshmark')." },
            recommendedPriceFormat: { type: Type.STRING, description: "'buy_it_now', 'auction', or 'local_cash'" },
            suggestedTargetPrice: { type: Type.NUMBER, description: "Target price for this action." },
            bundleTheme: { type: Type.STRING, description: "Theme for lotting, if applicable." },
            estimatedTurnaroundTime: { type: Type.STRING, description: "Estimated time to sell." },
            bestOverallPath: { type: Type.STRING, description: "Overall strategy summary." },
          },
          required: ["primaryAction", "actionTitle", "actionReason", "bestOverallPath"]
        },
        listings: {
          type: Type.OBJECT,
          description: "Platform tailored listing kits.",
          properties: {
            ebay: { 
              type: Type.OBJECT, 
              properties: { 
                title: { type: Type.STRING }, 
                description: { type: Type.STRING }, 
                keywords: { type: Type.ARRAY, items: { type: Type.STRING } }, 
                suggestedPrice: { type: Type.NUMBER },
                priceFormat: { type: Type.STRING }
              },
              required: ["title", "description", "keywords", "suggestedPrice"]
            },
            reverb: { 
              type: Type.OBJECT, 
              description: "Listing kit specialized for Reverb (instruments, synths, audio gear, pedals).",
              properties: { 
                title: { type: Type.STRING }, 
                description: { type: Type.STRING }, 
                keywords: { type: Type.ARRAY, items: { type: Type.STRING } }, 
                suggestedPrice: { type: Type.NUMBER },
                priceFormat: { type: Type.STRING }
              },
              required: ["title", "description", "keywords", "suggestedPrice"]
            },
            poshmark: { 
              type: Type.OBJECT, 
              properties: { 
                title: { type: Type.STRING }, 
                description: { type: Type.STRING }, 
                keywords: { type: Type.ARRAY, items: { type: Type.STRING } }, 
                suggestedPrice: { type: Type.NUMBER },
                priceFormat: { type: Type.STRING }
              },
              required: ["title", "description", "keywords", "suggestedPrice"]
            },
            facebookMarketplace: { 
              type: Type.OBJECT, 
              properties: { 
                title: { type: Type.STRING }, 
                description: { type: Type.STRING }, 
                keywords: { type: Type.ARRAY, items: { type: Type.STRING } }, 
                suggestedPrice: { type: Type.NUMBER },
                priceFormat: { type: Type.STRING }
              },
              required: ["title", "description", "keywords", "suggestedPrice"]
            },
            mercari: { 
              type: Type.OBJECT, 
              properties: { 
                title: { type: Type.STRING }, 
                description: { type: Type.STRING }, 
                keywords: { type: Type.ARRAY, items: { type: Type.STRING } }, 
                suggestedPrice: { type: Type.NUMBER },
                priceFormat: { type: Type.STRING }
              },
              required: ["title", "description", "keywords", "suggestedPrice"]
            }
          },
          required: ["ebay", "poshmark", "facebookMarketplace", "mercari"]
        },
        stagingPhotoGuide: {
          type: Type.OBJECT,
          description: "Photography coaching for item.",
          properties: {
            backdropRecommendation: { type: Type.STRING },
            lightingRecipe: { type: Type.STRING },
            photoAngles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  angleName: { type: Type.STRING },
                  coachingInstructions: { type: Type.STRING },
                  importance: { type: Type.STRING },
                },
                required: ["angleName", "coachingInstructions", "importance"],
              },
            },
          },
          required: ["backdropRecommendation", "lightingRecipe", "photoAngles"],
        },
        violinForensics: {
          type: Type.OBJECT,
          description: "Dedicated forensic appraisal for violins, violas, cellos, double basses, and bows.",
          properties: {
            isViolinOrBowedString: { type: Type.BOOLEAN },
            instrumentType: { type: Type.STRING },
            probableOrigin: { type: Type.STRING },
            probableEra: { type: Type.STRING },
            labelAnalysis: {
              type: Type.OBJECT,
              properties: {
                transcription: { type: Type.STRING },
                verdict: { type: Type.STRING },
                explanation: { type: Type.STRING },
                tariffActEra: { type: Type.STRING },
              },
            },
            purflingAssessment: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                qualityNotes: { type: Type.STRING },
              },
            },
            tonewoodFlameGrade: { type: Type.STRING },
            crackSeverityMap: {
              type: Type.OBJECT,
              properties: {
                hasSoundpostCrack: { type: Type.BOOLEAN },
                hasBassBarCrack: { type: Type.BOOLEAN },
                hasPegboxCheekCrack: { type: Type.BOOLEAN },
                hasNeckButtonDamage: { type: Type.BOOLEAN },
                hasOpenSeams: { type: Type.BOOLEAN },
                valueDiscountPercent: { type: Type.NUMBER },
                luthierRepairEstimate: { type: Type.STRING },
              },
            },
            bowEvaluation: {
              type: Type.OBJECT,
              properties: {
                included: { type: Type.BOOLEAN },
                stickWood: { type: Type.STRING },
                fittingsMetal: { type: Type.STRING },
                frogEyeStyle: { type: Type.STRING },
                probableMakerOrWorkshop: { type: Type.STRING },
                headCondition: { type: Type.STRING },
                estimatedBowValue: { type: Type.NUMBER },
              },
            },
            makerTiersBenchmarked: { type: Type.STRING },
          },
        },
      },
      required: [
        "identifiedName",
        "confidence",
        "lowValue",
        "highValue",
        "currency",
        "verdict",
        "valuationMethodology",
        "reproTells",
        "keyIdentifiers",
        "listingTitle",
        "listingKeywords",
        "suggestedListingPrice",
        "descriptionWriteup",
        "marketRange",
        "netEstimate",
        "buyCeiling",
        "riskFlags",
        "nextMoveStrategy",
        "listings"
      ],
    };

    // Helper for calling Gemini API with rapid failover across standard models
    async function callGeminiWithRetryAndFallback(
      genAi: GoogleGenAI,
      requestParams: {
        contents: any;
        config: any;
      }
    ) {
      // Candidate models for multimodal vision tasks (prioritizing fastest and most reliable)
      const candidateModels = [
        "gemini-flash-latest",
        "gemini-2.5-flash",
        "gemini-3.5-flash-lite",
        "gemini-3.8-flash",
      ];
      let lastError: any = null;

      for (const model of candidateModels) {
        try {
          console.log(`[Gemini API] Requesting model: ${model}...`);
          const response = await genAi.models.generateContent({
            model,
            ...requestParams,
          });

          let textContent = "";
          try {
            textContent = response?.text || "";
          } catch {
            textContent = response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          }

          if (textContent && textContent.trim().length > 0) {
            console.log(`[Gemini API] Successfully received response from ${model}`);
            return response;
          }
        } catch (err: any) {
          lastError = err;
          const errStr = String(err?.message || err);
          console.warn(`[Gemini API] Model ${model} encountered error: ${errStr}.`);
        }
      }

      throw lastError || new Error("Gemini API models currently unavailable after trying candidate models.");
    }

    function extractAndParseJson(raw: string): any {
      let cleaned = raw.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
      }
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }
      return JSON.parse(cleaned);
    }

    let response: any;
    try {
      response = await callGeminiWithRetryAndFallback(ai, {
        contents: { parts: [...parts, { text: userPrompt }] },
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.2,
        },
      });
    } catch (apiErr: any) {
      console.warn("Gemini API call failed after retries:", apiErr);
      const errMsg = String(apiErr?.message || apiErr);
      
      if (errMsg.includes("resource_exhausted") || errMsg.includes("quota")) {
        return res.status(429).json({
          error: "API Quota Exceeded. Please check your AI Studio plan and billing details, or try again later.",
          status: "RESOURCE_EXHAUSTED",
        });
      }

      // Return 422 instead of 503 so Nginx reverse proxy does not intercept with warmup.html
      return res.status(422).json({
        error: "AI appraisal service is currently experiencing high demand or could not process this image. Please try again shortly, or save this scan to your Offline Queue.",
        status: "UNAVAILABLE",
      });
    }

    let resultJson: any;
    try {
      const textOutput = response.text || "{}";
      resultJson = extractAndParseJson(textOutput);
    } catch (parseErr) {
      console.warn("Failed to parse model JSON output:", parseErr);
      return res.status(422).json({
        error: "Failed to parse appraisal response. Please try again.",
      });
    }

    // Generate accurate eBay, Reverb, and Tarisio Sold links in code for user verification
    const searchTerms = resultJson.identifiedName || "vintage thrift item";
    resultJson.ebaySoldSearchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(searchTerms)}&LH_Sold=1&LH_Complete=1`;
    resultJson.reverbSoldSearchUrl = `https://reverb.com/marketplace?query=${encodeURIComponent(searchTerms)}&show_only_sold=true`;

    const isViolinOrBowed = 
      resultJson.violinForensics?.isViolinOrBowedString ||
      /violin|viola|cello|fiddle|bow|strad|guarner/i.test(searchTerms) ||
      /violin|viola|cello|fiddle|bow/i.test(resultJson.category || "");

    if (isViolinOrBowed) {
      const queryName = resultJson.makerBrand || resultJson.identifiedName || "violin";
      resultJson.tarisioSearchUrl = `https://tarisio.com/cozio-archive/price-history/?maker=${encodeURIComponent(queryName)}`;
    }

    return res.json(resultJson);
  } catch (error: any) {
    console.error("Gemini analysis failed:", error);
    return res.status(422).json({
      error: error.message || "An unexpected error occurred during item analysis.",
    });
  }
});

// AI Photo Staging Endpoint
app.post("/api/generate-staged-image", async (req, res) => {
  try {
    const { prompt, itemTitle, backdrop } = req.body;
    if (!prompt && !itemTitle) {
      return res.status(400).json({ error: "Missing staging prompt or item title." });
    }

    const ai = getGeminiClient();
    const finalPrompt = prompt || `Studio catalog photo of ${itemTitle}, staged professionally on ${backdrop || "a clean neutral luxury studio backdrop"} with soft diffusion lighting, high resolution auction catalog style.`;

    try {
      // Attempt image generation via Imagen model if supported by API key
      const imgRes = await ai.models.generateImages({
        model: "imagen-3.0-generate-002",
        prompt: finalPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: "image/jpeg",
          aspectRatio: "1:1",
        },
      });

      if (imgRes?.generatedImages?.[0]?.image?.imageBytes) {
        const b64 = imgRes.generatedImages[0].image.imageBytes;
        return res.json({ stagedImageUrl: `data:image/jpeg;base64,${b64}` });
      }
      return res.status(422).json({ error: "No image was returned by the generator." });
    } catch (genErr: any) {
      console.warn("Imagen generation error:", genErr);
      const errMsg = String(genErr?.message || genErr);
      if (errMsg.includes("resource_exhausted") || errMsg.includes("quota")) {
        return res.status(429).json({ error: "API Quota Exceeded. Please check your AI Studio plan and billing details, or try again later." });
      }
      return res.status(422).json({ error: "AI studio staging generator is temporarily unavailable." });
    }
  } catch (err: any) {
    console.error("Staging image route error:", err);
    return res.status(422).json({ error: "Failed to generate staged photo." });
  }
});

// Setup dev server with Vite or production file serving
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    // Import dynamically to keep dependencies clean in production
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[FlipFindr Server] Running at http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
});
