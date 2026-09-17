import React, { useState, useEffect } from "react";
import { ScannedItem, OfflineQueueItem, NicheConfig, ConditionAnswers } from "./types";
import { NICHE_CONFIGS } from "./nicheConfigs";
import { loadStorageData, saveStorageData } from "./utils/storage";
import FocusModuleSelector from "./components/FocusModuleSelector";
import ScannerTab from "./components/ScannerTab";
import InventoryTab from "./components/InventoryTab";
import OfflineQueueTab from "./components/OfflineQueueTab";
import DossierView from "./components/DossierView";
import DashboardView from "./components/DashboardView";
import { 
  Wifi, 
  WifiOff, 
  Layers, 
  Database, 
  FileText,
  Sparkles,
  Info,
  HelpCircle,
  TrendingUp,
  Camera,
  CheckCircle,
  FileCheck,
  X
} from "lucide-react";

export default function App() {
  const [activeNiche, setActiveNiche] = useState<NicheConfig>(NICHE_CONFIGS[0]);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);
  const [activeTab, setActiveTab] = useState<"scanner" | "dossier" | "inventory" | "dashboard" | "offline">("scanner");
  const [activeDossier, setActiveDossier] = useState<ScannedItem | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pastCorrections, setPastCorrections] = useState<{originalName: string, correctedName: string}[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Load initial data from IndexedDB with fallback migration
  useEffect(() => {
    let isMounted = true;
    async function initData() {
      const items = await loadStorageData<ScannedItem[]>("flipfindr_scanned_items", []);
      const queue = await loadStorageData<OfflineQueueItem[]>("flipfindr_offline_queue", []);
      const corrections = await loadStorageData<{originalName: string, correctedName: string}[]>("flipfindr_corrections", []);
      if (isMounted) {
        // Guarantee unique IDs across loaded items to prevent duplicate key React errors
        const seenIds = new Set<string>();
        const sanitizedItems = items.map((item, idx) => {
          let itemId = item.id;
          if (!itemId || seenIds.has(itemId)) {
            itemId = `${itemId || "scan"}-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`;
          }
          seenIds.add(itemId);
          return { ...item, id: itemId };
        });

        const seenQueueIds = new Set<string>();
        const sanitizedQueue = queue.map((qItem, idx) => {
          let qId = qItem.id;
          if (!qId || seenQueueIds.has(qId)) {
            qId = `${qId || "off"}-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`;
          }
          seenQueueIds.add(qId);
          return { ...qItem, id: qId };
        });

        setScannedItems(sanitizedItems);
        setOfflineQueue(sanitizedQueue);
        setPastCorrections(corrections || []);
      }
    }
    initData();

    // Clean up any stray localStorage keys that exceeded quota
    try {
      localStorage.removeItem("flipfindr_scanned_items");
      localStorage.removeItem("flipfindr_offline_queue");
    } catch (e) {
      console.warn("localStorage clean error:", e);
    }

    // Bind browser online/offline status listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      isMounted = false;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Save states to IndexedDB (no 5MB quota restrictions)
  const saveItems = (updatedItems: ScannedItem[]) => {
    setScannedItems(updatedItems);
    saveStorageData("flipfindr_scanned_items", updatedItems);
  };

  const saveQueue = (updatedQueue: OfflineQueueItem[]) => {
    setOfflineQueue(updatedQueue);
    saveStorageData("flipfindr_offline_queue", updatedQueue);
  };

  const saveCorrections = (updatedCorrections: {originalName: string, correctedName: string}[]) => {
    setPastCorrections(updatedCorrections);
    saveStorageData("flipfindr_corrections", updatedCorrections);
  };

  const handleCorrectItem = (id: string, newName: string) => {
    let originalName = "";
    const updatedItems = scannedItems.map(item => {
      if (item.id === id && item.verdict) {
        originalName = item.verdict.identifiedName;
        return {
          ...item,
          verdict: {
            ...item.verdict,
            identifiedName: newName
          }
        };
      }
      return item;
    });

    if (originalName && originalName !== newName) {
      saveItems(updatedItems);
      saveCorrections([...pastCorrections, { originalName, correctedName: newName }]);
      if (activeDossier?.id === id) {
        setActiveDossier(updatedItems.find(i => i.id === id) || null);
      }
      showToast(`✏️ Corrected to: ${newName}`);
    }
  };

  const handleUpdateItem = (updatedItem: ScannedItem) => {
    const updated = scannedItems.map((item) => (item.id === updatedItem.id ? updatedItem : item));
    saveItems(updated);
    if (activeDossier?.id === updatedItem.id) {
      setActiveDossier(updatedItem);
    }
    showToast("💾 Sourcing record updated");
  };

  // Select focus niche module
  const handleSelectNiche = (niche: NicheConfig) => {
    setActiveNiche(niche);
  };

  // Add a successfully appraised item
  const handleAnalysisComplete = (itemData: {
    image: string;
    additionalImages?: string[];
    nicheId: string;
    condition: ConditionAnswers;
    quickVerdictOnly: boolean;
    verdict: any;
  }) => {
    const newItem: ScannedItem = {
      id: "scan-" + Math.random().toString(36).substr(2, 9),
      image: itemData.image,
      additionalImages: itemData.additionalImages,
      nicheId: itemData.nicheId,
      detectedNicheId: itemData.verdict?.detectedNicheId,
      detectedNicheName: itemData.verdict?.detectedNicheName,
      scannedAt: new Date().toISOString(),
      condition: itemData.condition,
      quickVerdictOnly: itemData.quickVerdictOnly,
      status: "success",
      verdict: itemData.verdict,
      resaleStatus: itemData.verdict?.verdict === "BUY" ? "sourced" : "passed",
      buyPrice: itemData.condition.askingPrice,
      platformListed: "eBay",
      dateAcquired: new Date().toISOString(),
    };

    const updated = [newItem, ...scannedItems];
    saveItems(updated);
    setActiveDossier(newItem);
    setActiveTab("dossier");
    showToast(`⚡ Appraisal Complete: ${newItem.verdict?.identifiedName || "New Item"}`);
  };

  // Queue an item offline
  const handleQueueOffline = (offlineData: {
    image: string;
    additionalImages?: string[];
    condition: ConditionAnswers;
    quickVerdictOnly: boolean;
  }) => {
    const newItem: OfflineQueueItem = {
      id: "off-" + Math.random().toString(36).substr(2, 9),
      image: offlineData.image,
      additionalImages: offlineData.additionalImages,
      capturedAt: new Date().toISOString(),
      nicheId: activeNiche.id,
      condition: offlineData.condition,
      quickVerdictOnly: offlineData.quickVerdictOnly,
    };

    const updated = [...offlineQueue, newItem];
    saveQueue(updated);
    showToast("💾 Item Saved to Offline Resale Queue!");
  };

  // Delete inventory log entry
  const handleDeleteItem = (id: string) => {
    const updated = scannedItems.filter(item => item.id !== id);
    saveItems(updated);
  };

  // Load sample demo item for instant onboarding test
  const handleLoadSampleItem = () => {
    const sampleDemoItem: ScannedItem = {
      id: "scan-sample-pyrex-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
      image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'><defs><radialGradient id='bg' cx='50%' cy='40%' r='60%'><stop offset='0%' stop-color='%231e293b'/><stop offset='100%' stop-color='%230f172a'/></radialGradient></defs><rect width='600' height='600' fill='url(%23bg)'/><ellipse cx='300' cy='440' rx='200' ry='30' fill='%23000' opacity='0.5'/><rect x='160' y='200' width='280' height='180' rx='40' fill='%23fef08a' stroke='%23eab308' stroke-width='6'/><ellipse cx='300' cy='200' rx='140' ry='25' fill='%23ffffff' opacity='0.9' stroke='%23e2e8f0' stroke-width='3'/><circle cx='250' cy='290' r='18' fill='%23eab308'/><circle cx='300' cy='290' r='18' fill='%23eab308'/><circle cx='350' cy='290' r='18' fill='%23eab308'/><text x='300' y='480' font-family='sans-serif' font-weight='bold' font-size='22' fill='%23f8fafc' text-anchor='middle'>VINTAGE PYREX 1970s</text><text x='300' y='510' font-family='sans-serif' font-size='14' fill='%23fbbf24' text-anchor='middle'>Daisy %23475-B 2.5L Casserole</text></svg>",
      nicheId: "general",
      scannedAt: new Date().toISOString(),
      condition: {
        functional: "yes",
        complete: "yes",
        wearNotes: "EXCELLENT VINTAGE CONDITION. No chips or flea bites. Bright daisy pattern.",
        askingPrice: 8.00,
        scaleReference: "credit_card"
      },
      quickVerdictOnly: false,
      status: "success",
      resaleStatus: "sourced",
      buyPrice: 8.00,
      platformListed: "eBay",
      dateAcquired: new Date().toISOString(),
      verdict: {
        identifiedName: "1970s Pyrex Daisy Sunflower #475-B 2.5L Casserole Dish with Opal Lid",
        category: "Vintage Kitchenware & Collectible Glassware",
        confidence: 96,
        lowValue: 48,
        highValue: 95,
        currency: "USD",
        verdict: "BUY",
        verdictReasoning: "Strong collector demand for pristine Pyrex Daisy/Sunflower patterns. Zero chips, cracks, or pattern fading on the original opal glass lid.",
        authenticityStatus: "authentic",
        inspectionPointsToVerify: "Inspect underside base for 'PYREX Made in USA 475-B 2.5L' raised relief stamp. Verify opal glass opacity under backlight.",
        valuationMethodology: "Cross-referenced 18 historical eBay sold comps over the last 90 days for Pyrex Daisy 475-B in original opal lid condition.",
        marketRange: {
          low: 48,
          median: 72,
          high: 95,
          compsCount: 18,
          compDateRange: "Last 90 days (eBay Sold Comps)",
        },
        netEstimate: {
          salePrice: 78,
          marketplaceFee: 10.34,
          paymentProcessingFee: 2.56,
          estimatedShipping: 6.80,
          packingMaterials: 1.50,
          acquisitionCost: 8.00,
          estimatedNetProfit: 48.80,
          netMarginPercent: 63,
        },
        buyCeiling: {
          maxPurchasePrice: 28.00,
          targetMarginPercent: 40,
          logicExplanation: "Guarantees at least a $30+ net margin after typical 13.25% marketplace fees and shipping.",
        },
        riskFlags: [
          { type: "authenticity", severity: "low", message: "Embossed Pyrex maker stamp matches authentic Corning Glass Works 1970s font." },
          { type: "condition_uncertainty", severity: "low", message: "Zero dishwasher dulling (DWD); bright sunflower screen-print." },
          { type: "sell_through", severity: "low", message: "High sell-through rate (~84% within 14 days on eBay)." },
        ],
        measurementsCm: { widthCm: 22.4, heightCm: 11.2, depthCm: 22.4 },
        listingTitle: "Vintage 1970s Pyrex Daisy Sunflower #475-B 2.5L Casserole Dish w/ Opal Lid",
        listingKeywords: ["Vintage Pyrex Daisy", "Pyrex 475 B", "Sunflower Casserole Dish", "1970s Pyrex Opal Lid", "Mid Century Kitchenware"],
        suggestedListingPrice: 78,
        descriptionWriteup: "FOR SALE: Rare vintage 1970s Pyrex Daisy Sunflower #475-B 2.5L Casserole Dish complete with original opal glass lid. Features vibrant yellow daisy screen-print pattern over white milk glass base. Excellent condition with no chips, cracks, or dishwasher dulling. Measurements approximately 22.4cm x 11.2cm.",
        ebaySoldSearchUrl: "https://www.ebay.com/sch/i.html?_nkw=pyrex+daisy+475+b&_sacat=0&LH_Sold=1&LH_Complete=1",
        listings: {
          ebay: {
            title: "Vintage 1970s Pyrex Daisy Sunflower #475-B 2.5L Casserole Dish w/ Opal Lid",
            description: "FOR SALE: Vintage 1970s Pyrex Daisy Sunflower #475-B 2.5L Casserole Dish with original Opal Glass Lid.\n\nCondition: Pristine vintage condition with zero chips, cracks, or dishwasher hazing. Vibrant yellow daisy pattern.\n\nMarkings: Base stamped 'PYREX Made in USA 475-B 2.5L'.\n\nShipping: Double-boxed with heavy bubble wrap within 24 hours.",
            tags: ["Vintage Pyrex", "Pyrex Daisy", "Pyrex 475 B", "Mid Century Kitchen", "Sunflower Casserole"],
            suggestedPriceFormat: "Buy It Now at $78 with Best Offer enabled above $65",
            platformNotes: "Enable Best Offer",
          },
          poshmark: {
            title: "Vintage 1970s Pyrex Daisy 475-B 2.5L Casserole Opal Lid",
            description: "Vintage 1970s Pyrex Daisy Sunflower 2.5L casserole dish with opal glass lid. Mint vintage condition, vibrant yellow flowers, no chips.",
            tags: ["pyrex", "vintagekitchen", "midcentury", "daisy"],
            suggestedPriceFormat: "$75 Fixed Price",
            platformNotes: "Ships with 5lb Poshmark priority label",
          },
          mercari: {
            title: "Vintage Pyrex Daisy 475-B 2.5L Casserole with Lid",
            description: "Rare 1970s Pyrex Daisy casserole dish with original opal lid. No dishwasher haze or chips. Packaged securely.",
            tags: ["Pyrex", "Vintage", "Kitchenware"],
            suggestedPriceFormat: "$72 Smart Pricing ($65 floor)",
            platformNotes: "Select Mercari USPS Ground Advantage",
          },
          facebook: {
            title: "Vintage 1970s Pyrex Daisy Sunflower Casserole Dish #475-B",
            description: "Gorgeous vintage 1970s Pyrex Daisy Sunflower casserole with matching opal glass lid. 2.5L capacity. Perfect condition, no chips or fading. Asking $65 cash local pick-up.",
            tags: ["pyrex", "antiques", "vintage"],
            suggestedPriceFormat: "$65 Local Pick-up Cash",
            platformNotes: "Cross-post in local vintage home decor groups",
          },
        },
        nextMoveStrategy: {
          bestOverallPath: "List as Buy-It-Now on eBay at $78 with 'Best Offer' enabled above $65. High collector demand ensures fast 3-5 day turnaround.",
          targetPlatform: "eBay / Mercari Cross-List",
          turnaroundDays: "3-5 Days",
          priorityChecklist: [
            "Inspect base relief stamp under direct light to confirm '475-B'",
            "Wipe gently with warm water and soft cloth; never use dishwasher",
            "Photograph 5 angles: Hero with lid, base stamp macro, rim edge, pattern close-up",
            "Copy & paste the AI-optimized title and description into eBay",
            "Double-box with 2 inches of bubble wrap for safe USPS Ground Advantage dispatch",
          ],
        },
      },
    };

    saveItems([sampleDemoItem, ...scannedItems]);
    setActiveDossier(sampleDemoItem);
    setActiveTab("dossier");
    showToast("⚡ Sample 1970s Pyrex Dossier Loaded!");
  };

  // Remove individual offline draft
  const handleRemoveFromQueue = (id: string) => {
    const updated = offlineQueue.filter(item => item.id !== id);
    saveQueue(updated);
  };

  // Run synchronization for an offline draft
  const handleSyncItem = async (queueItem: OfflineQueueItem): Promise<boolean> => {
    try {
      const niche = NICHE_CONFIGS.find(n => n.id === queueItem.nicheId) || NICHE_CONFIGS[0];
      
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64: queueItem.image,
          additionalImages: queueItem.additionalImages,
          nicheId: queueItem.nicheId,
          nicheName: niche.name,
          quickVerdictOnly: queueItem.quickVerdictOnly,
          condition: queueItem.condition,
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      let data: any = null;
      if (contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch {
          data = null;
        }
      }

      if (!response.ok) {
        if (response.status === 413) {
          throw new Error("Image is too large. Please try a smaller photo or take a picture from further away.");
        }
        throw new Error(
          data?.error ||
          (response.status === 429
            ? "API Quota Exceeded. Please check your AI Studio plan and billing details, or try again later."
            : response.status === 502 || response.status === 503 || response.status === 504
            ? "Appraisal service is warming up. Please try again shortly."
            : `Analysis failed (${response.status})`)
        );
      }

      if (contentType.includes("text/html")) {
        throw new Error("Received HTML instead of JSON. The server might be restarting or unavailable. Please try again.");
      }

      if (!data) {
        throw new Error("Unable to parse appraisal results.");
      }

      // Transition draft to registered inventory
      const newItem: ScannedItem = {
        id: "scan-" + Math.random().toString(36).substr(2, 9),
        image: queueItem.image,
        additionalImages: queueItem.additionalImages,
        nicheId: data?.detectedNicheId || queueItem.nicheId,
        detectedNicheId: data?.detectedNicheId,
        detectedNicheName: data?.detectedNicheName,
        scannedAt: queueItem.capturedAt,
        condition: queueItem.condition,
        quickVerdictOnly: queueItem.quickVerdictOnly,
        status: "success",
        verdict: data,
        resaleStatus: data?.verdict === "BUY" ? "sourced" : "passed",
        buyPrice: queueItem.condition.askingPrice,
        platformListed: "eBay",
        dateAcquired: new Date().toISOString(),
      };

      // Update both lists and save
      const updatedItems = [newItem, ...scannedItems];
      const updatedQueue = offlineQueue.filter(item => item.id !== queueItem.id);
      
      saveItems(updatedItems);
      saveQueue(updatedQueue);
      return true;
    } catch (err) {
      console.error("Sync failed for item:", queueItem.id, err);
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f3ee] text-stone-900 flex flex-col selection:bg-amber-400 selection:text-stone-950">
      
      {/* Soft Warm Top Header */}
      <header className="bg-stone-900 text-stone-100 border-b border-stone-800/80 z-40 px-3 sm:px-5 py-2.5 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-mono font-bold shadow-sm">
              <Camera className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold font-display text-lg tracking-tight text-stone-100 uppercase">
                FLIP<span className="text-amber-400">FINDR</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-stone-800 text-amber-300 border border-stone-700/80 tracking-wider">
                LENS AI v2.5
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border uppercase tracking-wider ${
              isOnline 
                ? "bg-emerald-950/80 text-emerald-300 border-emerald-800/80" 
                : "bg-amber-950/80 text-amber-300 border-amber-800/80 animate-pulse"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span>{isOnline ? "Live Sync" : "Offline Lens"}</span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 space-y-4">
        
        {/* Soft Rounded Compact Navigation Bar */}
        <div className="bg-stone-900/90 p-1.5 rounded-2xl border border-stone-800 flex items-center justify-between gap-1 overflow-x-auto shadow-md backdrop-blur-md">
          <div className="flex items-center gap-1 w-full">
            <button
              onClick={() => setActiveTab("scanner")}
              className={`flex-1 py-2 px-3 text-xs font-mono font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === "scanner"
                  ? "bg-amber-400 text-stone-950 shadow-sm border border-amber-300 font-extrabold"
                  : "text-stone-400 hover:text-stone-100 hover:bg-stone-800/60"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>LENS SCANNER</span>
            </button>

            <button
              onClick={() => setActiveTab("dossier")}
              className={`flex-1 py-2 px-3 text-xs font-mono font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap relative ${
                activeTab === "dossier"
                  ? "bg-amber-400 text-stone-950 shadow-sm border border-amber-300 font-extrabold"
                  : "text-stone-400 hover:text-stone-100 hover:bg-stone-800/60"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>DOSSIER</span>
              {activeDossier && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("inventory")}
              className={`flex-1 py-2 px-3 text-xs font-mono font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap relative ${
                activeTab === "inventory"
                  ? "bg-amber-400 text-stone-950 shadow-sm border border-amber-300 font-extrabold"
                  : "text-stone-400 hover:text-stone-100 hover:bg-stone-800/60"
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>LEDGER</span>
              {scannedItems.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-md bg-stone-950 text-[10px] text-amber-300 font-mono font-black border border-stone-800">
                  {scannedItems.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex-1 py-2 px-3 text-xs font-mono font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === "dashboard"
                  ? "bg-amber-400 text-stone-950 shadow-sm border border-amber-300 font-extrabold"
                  : "text-stone-400 hover:text-stone-100 hover:bg-stone-800/60"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>DASHBOARD</span>
            </button>

            <button
              onClick={() => setActiveTab("offline")}
              className={`flex-1 py-2 px-3 text-xs font-mono font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap relative ${
                activeTab === "offline"
                  ? "bg-amber-400 text-stone-950 shadow-sm border border-amber-300 font-extrabold"
                  : "text-stone-400 hover:text-stone-100 hover:bg-stone-800/60"
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>OFFLINE</span>
              {offlineQueue.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-md bg-rose-500 text-[10px] text-white font-mono font-black animate-pulse">
                  {offlineQueue.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab View switching */}
        <div className="pt-2">
          {activeTab === "scanner" && (
            <ScannerTab
              activeNiche={activeNiche}
              onSelectNiche={handleSelectNiche}
              onAnalysisComplete={handleAnalysisComplete}
              onQueueOffline={handleQueueOffline}
              isOnline={isOnline}
              scannedItemsCount={scannedItems.length}
              totalEstValue={scannedItems.reduce((acc, item) => acc + (item.verdict?.suggestedListingPrice || 0), 0)}
              buyCount={scannedItems.filter(item => item.verdict?.verdict === "BUY").length}
              offlineQueueCount={offlineQueue.length}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onLoadSampleItem={handleLoadSampleItem}
              pastCorrections={pastCorrections}
            />
          )}

          {activeTab === "dossier" && (
            activeDossier ? (
              <DossierView
                item={activeDossier}
                onBackToScanner={() => setActiveTab("scanner")}
                onViewInventory={() => setActiveTab("inventory")}
                onDeleteItem={(id) => {
                  handleDeleteItem(id);
                  setActiveDossier(null);
                  setActiveTab("inventory");
                }}
                onCorrectItem={handleCorrectItem}
                onUpdateItem={handleUpdateItem}
              />
            ) : (
              <div className="bg-white rounded-3xl p-12 border border-stone-200 text-center max-w-xl mx-auto space-y-4 shadow-sm">
                <Sparkles className="w-10 h-10 text-amber-500 mx-auto" />
                <h3 className="text-lg font-bold text-stone-900 font-display">No Active Item Under Appraisal</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Scan an item in the Optical Lens Scanner, load the 1-Tap Demo Pyrex item, or select an entry from your Master Inventory.
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("scanner")}
                    className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs cursor-pointer shadow-md transition-colors"
                  >
                    Open Studio Camera Scanner
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadSampleItem}
                    className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 border border-amber-300 font-bold text-xs cursor-pointer transition-colors"
                  >
                    Load Demo 1970s Pyrex Item
                  </button>
                </div>
              </div>
            )
          )}

          {activeTab === "inventory" && (
            <InventoryTab 
              items={scannedItems}
              onDeleteItem={handleDeleteItem}
              onUpdateItem={handleUpdateItem}
              onLoadSampleItem={handleLoadSampleItem}
              onInspectDossier={(item) => {
                setActiveDossier(item);
                setActiveTab("dossier");
              }}
              onStartScan={() => setActiveTab("scanner")}
            />
          )}

          {activeTab === "dashboard" && (
            <DashboardView items={scannedItems} />
          )}

          {activeTab === "offline" && (
            <OfflineQueueTab
              queue={offlineQueue}
              onRemoveFromQueue={handleRemoveFromQueue}
              onSyncItem={handleSyncItem}
            />
          )}
        </div>

      </main>

      {/* Floating Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-amber-300 border border-amber-500/50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold font-mono animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Casual, Compact & Noticeable Brand Footer */}
      <footer className="mt-auto border-t border-stone-800 bg-stone-950 text-stone-300 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
          
          {/* Brand & Purpose Tagline */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-stone-100 font-bold font-display">
              <Camera className="w-4 h-4 text-amber-400" />
              <span>FlipFindr</span>
            </div>
            <span className="text-stone-700">•</span>
            <span className="text-stone-400 text-[11px]">Resale Intelligence Layer (starts where Google Lens stops)</span>
            <span className="text-stone-700">•</span>
            <span className="text-[10px] font-mono text-amber-300 bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
              v1.2.0
            </span>
          </div>

          {/* Right: Quick Capabilities & Info */}
          <div className="flex items-center gap-3 text-[11px] font-mono text-stone-400">
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] ${
              isOnline ? "bg-emerald-950/60 text-emerald-300 border-emerald-800" : "bg-amber-950/60 text-amber-300 border-amber-800"
            }`}>
              {isOnline ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-amber-400" />}
              <span>{isOnline ? "Live Cloud Appraisal Engine" : "Offline Storage Ready"}</span>
            </div>
            <span className="hidden md:inline text-stone-500">• Estate • Thrift • Vintage</span>
          </div>

        </div>
      </footer>

    </div>
  );
}
