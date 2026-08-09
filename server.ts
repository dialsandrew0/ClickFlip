import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Lazy-loaded Gemini AI Client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
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
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Resale analysis endpoint
app.post("/api/analyze", async (req, res) => {
  try {
    const { imageBase64, nicheId, nicheName, quickVerdictOnly, condition } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image file provided." });
    }

    const ai = getGeminiClient();

    // Clean image data prefix if present (e.g. "data:image/png;base64,")
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

    // Prepare content parts for Gemini
    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: cleanBase64,
      },
    };

    // Scale reference object calibration logic
    const scaleRef = condition?.scaleReference || "none";
    let scaleInstruction = "";
    if (scaleRef === "credit_card") {
      scaleInstruction = `
[SCALE CALIBRATION REFERENCE]: Standard Credit Card / ID Card (8.56 cm width x 5.40 cm height / 3.37 in x 2.125 in).
Calculate the exact physical width, height, and optional depth (in centimeters) of the main subject item by comparing its pixel proportions relative to the credit card in the photo. Set calibrationMethod to 'Calibrated via Standard Credit Card (85.6mm x 53.98mm)'.
`;
    } else if (scaleRef === "quarter") {
      scaleInstruction = `
[SCALE CALIBRATION REFERENCE]: Standard US Quarter Coin (2.426 cm / 24.26mm diameter).
Calculate the physical width, height, and depth (in centimeters) of the item by comparing its pixel dimensions relative to the quarter coin. Set calibrationMethod to 'Calibrated via US Quarter Coin (24.26mm diameter)'.
`;
    } else if (scaleRef === "ruler") {
      scaleInstruction = `
[SCALE CALIBRATION REFERENCE]: Physical Ruler / Measuring Tape visible in frame.
Read the scale markings directly to determine exact width, height, and depth in centimeters. Set calibrationMethod to 'Direct Scale Calibration via Ruler'.
`;
    } else {
      scaleInstruction = `
[SCALE CALIBRATION REFERENCE]: Visual Proportion Estimation.
Estimate the standard physical dimensions (width, height, depth in centimeters) based on standard object proportions and visual context. Set calibrationMethod to 'Visual Proportion Estimation'.
`;
    }

    // Construct detailed analysis guidelines depending on Niche focus and Condition
    let conditionContext = "";
    if (condition) {
      let nicheAnswersStr = "";
      if (condition.nicheSpecificAnswers && Object.keys(condition.nicheSpecificAnswers).length > 0) {
        nicheAnswersStr = "\n[Niche-Specific Diagnostic Observations]:\n" + 
          Object.entries(condition.nicheSpecificAnswers)
            .map(([qId, ans]) => `- Question Key [${qId}]: Verified User Answer: "${ans}"`)
            .join("\n");
      }

      conditionContext = `
[User-reported Condition Details]:
- Is it Functional? ${condition.functional || "unspecified"}
- Is it Complete? ${condition.complete || "unspecified"}
- Specific Wear & Damage notes: "${condition.wearNotes || "none provided"}"
${nicheAnswersStr}
`;
    }

    const userPrompt = `
Analyze the attached image of a potential resale/thrift item.
Active Specialty Focus Module: ${nicheName} (ID: ${nicheId})
Quick Verdict Mode Only: ${quickVerdictOnly ? "YES - focus on fast buy/skip and rough valuation range" : "NO - provide complete forensic details and listing tools"}

${scaleInstruction}
${conditionContext}

Your primary purpose is to act as an elite "resale intelligence layer" that starts where Google Lens stops.
1. Identify what this item is (including manufacturer, model, approximate age/period, style, material, or unique print).
2. Calculate physical dimensions (width, height, depth in cm) using the provided scale calibration reference.
3. Formulate a raw, fact-based forensic valuation range using specialty market data for this exact niche (${nicheName}). Explain your exact valuation formula in valuationMethodology.
4. Evaluate if it's a reproduction, knockoff, or authentic piece (explain signature locations or construction hallmarks to inspect).
5. Formulate a clear recommendation: BUY (great margins), SKIP (poor margin, damaged, or reproduction risk), or PONDER (requires further manual verification).
6. Generate Next Move Distribution Pathways: Create 4 tailored, actionable routes for this item across Online Marketplaces, Specialty Auction Houses, Niche Collector Communities/Forums, and Local Consignment/Antique Booths. Provide specific setup steps and ready-to-copy post/outreach copy for each.
7. Generate Staging Photo Coaching & Recipe: Provide exact backdrop, lighting recipe, shot angle coaching list, and an AI staging image prompt to produce a studio photo mockup.
`;

    const systemInstruction = `
You are FlipFindr, the ultimate God-Tier Resale Intelligence engine for professional thrifters, estate-sale hunters, dumpster divers, and antique collectors.
You specialize in evaluating vintage products, furniture, antiques, art, coin values, vintage tags, and books.
Unlike standard image search tools which merely declare "this is a chair", you diagnose the forensic value: Eames reproductions vs originals, Pyrex print identifiers, coinage grade indicators, deadwax vinyl matrix runs, vintage garment single-stitch tells, and precise trademark stamps.

NICHE VALUATION ALGORITHMS (Strictly adhere to these pricing mechanics):
- General Flipper (general): Calculate baseline from sold comps on eBay & FB Marketplace. Factor material composition, maker stamps, and condition discounts (-70% for broken/non-functional).
- Art & Period Decor (artperiod): Fine Art Auction records (LiveAuctioneers, 1stDibs). Authenticated Artist Signature baseline (+300% to 1000% premium) vs Unsigned/Reproduction plate print (-60% discount). Factor craquelure and patina.
- Numismatics (coins): Melt Value Floor (Spot Metal Weight x Purity) vs Numismatic Collector Ceiling (Sheldon Scale 1-70, PCGS/NGC price guides). Mint mark premiums ('CC', 'O', 'S') and error die varieties. Deduct 50-80% for cleaned/harshly scrubbed coins.
- Books & Vinyl (books_vinyl): Goldmine Standard (Mint, NM, VG+, VG, G+, G, F, P). Dust jacket / sleeve presence accounts for ~70% of total vintage book value. Discogs matrix runout deadwax etchings & 1st edition printing line (10 9 8 7 6 5 4 3 2 1).
- Vintage Garments (vintage_clothing): Grailed & Depop sold market formula. Single Stitch sleeve/tail premium (pre-1996 loopwheel machinery, +50% to 200% over double stitch) + Brand Tag Authority (Screen Stars, Giant, Brockum, Anvil) + Copyright Year below graphic.

SCALE MEASUREMENT CALIBRATION:
- Standard Credit Card / ID Card = 8.56 cm x 5.40 cm (3.37 in x 2.125 in). Use optical pixel proportions relative to the card to compute widthCm, heightCm, and depthCm.

NEXT MOVE ACTIONABLE PATHWAYS:
- Always generate 4 actionable routes tailored specifically to the item's niche (${nicheName}):
  1. Online Marketplace (e.g. eBay Buy-It-Now vs Mercari vs Depop vs Discogs)
  2. Specialty Auction House (e.g. Heritage Auctions, Sotheby's, EBTH, LiveAuctioneers, Goldin)
  3. Private Collector / Niche Group (e.g. Reddit r/Coins / r/VintageClothing, Facebook Collector Groups, Forum Direct Pitches)
  4. Local Consignment / Antique Mall / Pawn Partner
- Provide real, actionable setup steps and custom copy (full ready-to-copy listing, DM pitch, or consignment submission summary).

When performing analysis:
1. Ground your estimates in conservative real-world historic sold comparables.
2. If the user marks an item as "damaged", "broken", or "incomplete", drop the estimated value drastically (70-90% lower) and adjust your recommendation accordingly.
3. Be skeptical. Look for reproduction signs (pixelated prints, uniform modern hardware, synthetic materials where natural are expected) and clearly state "reproTells" for the user.
4. Output your analysis in valid JSON format following the requested schema.
`;

    // Define structural schema matching AnalysisVerdict type
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        identifiedName: {
          type: Type.STRING,
          description: "Detailed identified item name, maker, brand, and approximate model/year.",
        },
        confidence: {
          type: Type.INTEGER,
          description: "Confidence rating of the identification from 0 to 100.",
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
        valuationMethodology: {
          type: Type.STRING,
          description: "Detailed raw facts and specific formula used for valuation (e.g. 'Goldmine VG+ Discogs Sold Median (-20% jacket wear penalty)' or '90% Silver Melt Floor + New Orleans Mintmark Ceiling').",
        },
        estimatedDimensions: {
          type: Type.OBJECT,
          description: "Measured physical dimensions derived from scale reference calibration.",
          properties: {
            widthCm: { type: Type.NUMBER, description: "Measured width in centimeters." },
            heightCm: { type: Type.NUMBER, description: "Measured height in centimeters." },
            depthCm: { type: Type.NUMBER, description: "Measured depth/thickness in centimeters." },
            calibrationMethod: { type: Type.STRING, description: "Method used to calibrate scale (e.g. 'Calibrated via Standard Credit Card')." },
            rawMeasurementText: { type: Type.STRING, description: "Human readable formatted dimensions (e.g. '24.5 cm x 18.2 cm x 4.0 cm (~9.6 in x 7.2 in)')." },
          },
          required: ["widthCm", "heightCm", "calibrationMethod", "rawMeasurementText"],
        },
        reproTells: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Forensic checklist of reproduction indicators, counterfeits, or authentic hallmark locations to verify in hand.",
        },
        keyIdentifiers: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Key hallmarks, stamps, dates, or details observed in the photo.",
        },
        listingTitle: {
          type: Type.STRING,
          description: "Sellers title optimized with search keywords (Max 80 chars, uppercase first letters).",
        },
        listingKeywords: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "A list of relevant tags or keywords for listing platforms.",
        },
        suggestedListingPrice: {
          type: Type.NUMBER,
          description: "Suggested starting auction or buy-it-now listing price in USD.",
        },
        descriptionWriteup: {
          type: Type.STRING,
          description: "A professional listing description including approximate vintage, aesthetics, condition highlights, and search hooks.",
        },
        nextMoveStrategy: {
          type: Type.OBJECT,
          description: "Actionable strategic pathways and setup steps for selling/monetizing this item across platforms, auction houses, private collectors, and local consignment.",
          properties: {
            bestOverallPath: { type: Type.STRING, description: "Executive summary of the single best move for this item." },
            pathways: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "Unique slug identifier (e.g. 'online_marketplace', 'specialty_auction', 'private_collectors', 'local_consignment')." },
                  type: { type: Type.STRING, description: "One of: 'online_marketplace', 'specialty_auction', 'private_collectors', 'local_consignment'." },
                  targetPlatform: { type: Type.STRING, description: "Platform name (e.g. 'eBay / Mercari Cross-List', 'Heritage Auctions Consignment', 'r/Coins & Collector Forums')." },
                  suitabilityScore: { type: Type.INTEGER, description: "Match score from 0 to 100." },
                  estimatedPayout: { type: Type.STRING, description: "Estimated net payout string." },
                  turnaroundTime: { type: Type.STRING, description: "Timeframe string." },
                  stepsToExecute: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Step-by-step setup walkthrough.",
                  },
                  customPostCopy: { type: Type.STRING, description: "Ready-to-copy tailored post text, collector DM/email outreach draft, or submission summary." },
                  proTips: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Pro tips to maximize sale price and speed.",
                  },
                },
                required: ["id", "type", "targetPlatform", "suitabilityScore", "estimatedPayout", "turnaroundTime", "stepsToExecute", "customPostCopy", "proTips"],
              },
            },
          },
          required: ["bestOverallPath", "pathways"],
        },
        stagingPhotoGuide: {
          type: Type.OBJECT,
          description: "Coaching guidelines and lighting/backdrop recipes for photographing this item like a high-end auction house.",
          properties: {
            backdropRecommendation: { type: Type.STRING, description: "Optimal backdrop and surface." },
            lightingRecipe: { type: Type.STRING, description: "Lighting recipe instructions." },
            photoAngles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  angleName: { type: Type.STRING, description: "Shot title." },
                  coachingInstructions: { type: Type.STRING, description: "Exact coaching direction." },
                  importance: { type: Type.STRING, description: "'essential', 'high', or 'optional'." },
                },
                required: ["angleName", "coachingInstructions", "importance"],
              },
            },
            aiStagingPrompt: { type: Type.STRING, description: "Detailed text prompt describing an ultra-realistic studio-staged mockup image." },
          },
          required: ["backdropRecommendation", "lightingRecipe", "photoAngles", "aiStagingPrompt"],
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
        "nextMoveStrategy",
        "stagingPhotoGuide",
      ],
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, { text: userPrompt }] },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2, // Keep it grounded and consistent
      },
    });

    const textOutput = response.text || "{}";
    const resultJson = JSON.parse(textOutput.trim());

    // Generate accurate eBay Sold link in code to ensure perfect URL structure and safety
    const searchTerms = resultJson.identifiedName || "vintage thrift item";
    resultJson.ebaySoldSearchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(searchTerms)}&LH_Sold=1&LH_Complete=1`;

    return res.json(resultJson);
  } catch (error: any) {
    console.error("Gemini analysis failed:", error);
    return res.status(500).json({
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
    } catch (genErr) {
      console.warn("Imagen generation model fallback:", genErr);
    }

    // High quality SVG render as fallback studio mockup
    const safeTitle = (itemTitle || "Staged Showcase Item").replace(/[^a-zA-Z0-9\s-]/g, "");
    const safeBackdrop = (backdrop || "Studio Soft Lighting Set").replace(/[^a-zA-Z0-9\s-]/g, "");
    
    const svgMockup = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
      <defs>
        <radialGradient id="bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="%231e293b"/>
          <stop offset="60%" stop-color="%230f172a"/>
          <stop offset="100%" stop-color="%23020617"/>
        </radialGradient>
        <linearGradient id="pedestal" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="%23334155"/>
          <stop offset="100%" stop-color="%231e293b"/>
        </linearGradient>
      </defs>
      <rect width="600" height="600" fill="url(%23bg)"/>
      <ellipse cx="300" cy="460" rx="220" ry="40" fill="%23000" opacity="0.6"/>
      <polygon points="120,460 480,460 440,540 160,540" fill="url(%23pedestal)" stroke="%23475569" stroke-width="2"/>
      <circle cx="300" cy="300" r="110" fill="%23fbbf24" opacity="0.15"/>
      <rect x="220" y="220" width="160" height="160" rx="20" fill="%23f8fafc" stroke="%23fbbf24" stroke-width="4"/>
      <text x="300" y="295" font-family="sans-serif" font-weight="bold" font-size="28" fill="%230f172a" text-anchor="middle">STUDIO</text>
      <text x="300" y="325" font-family="sans-serif" font-weight="bold" font-size="14" fill="%23d97706" text-anchor="middle">STAGED MOCKUP</text>
      <rect x="30" y="30" width="540" height="540" fill="none" stroke="%23fbbf24" stroke-width="2" stroke-dasharray="10 6" opacity="0.4"/>
      <text x="300" y="58" font-family="sans-serif" font-size="13" font-weight="bold" fill="%23fbbf24" text-anchor="middle">AI STUDIO PHOTO STAGING PRO</text>
      <text x="300" y="510" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23f8fafc" text-anchor="middle">${safeTitle}</text>
      <text x="300" y="530" font-family="sans-serif" font-size="11" fill="%2394a3b8" text-anchor="middle">Backdrop: ${safeBackdrop}</text>
    </svg>`;

    return res.json({ stagedImageUrl: svgMockup });
  } catch (err: any) {
    console.error("Staging image route error:", err);
    return res.status(500).json({ error: "Failed to generate staged photo." });
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
