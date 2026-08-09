import React, { useState, useEffect } from "react";
import { ScannedItem, OfflineQueueItem, NicheConfig, ConditionAnswers } from "./types";
import { NICHE_CONFIGS } from "./nicheConfigs";
import { loadStorageData, saveStorageData } from "./utils/storage";
import FocusModuleSelector from "./components/FocusModuleSelector";
import ScannerTab from "./components/ScannerTab";
import InventoryTab from "./components/InventoryTab";
import OfflineQueueTab from "./components/OfflineQueueTab";
import DossierView from "./components/DossierView";
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
  const [activeTab, setActiveTab] = useState<"scanner" | "dossier" | "inventory" | "offline">("scanner");
  const [activeDossier, setActiveDossier] = useState<ScannedItem | null>(null);
  const [showDossierModal, setShowDossierModal] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
      if (isMounted) {
        setScannedItems(items);
        setOfflineQueue(queue);
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

  // Select focus niche module
  const handleSelectNiche = (niche: NicheConfig) => {
    setActiveNiche(niche);
  };

  // Add a successfully appraised item
  const handleAnalysisComplete = (itemData: {
    image: string;
    nicheId: string;
    condition: ConditionAnswers;
    quickVerdictOnly: boolean;
    verdict: any;
  }) => {
    const newItem: ScannedItem = {
      id: "scan-" + Math.random().toString(36).substr(2, 9),
      image: itemData.image,
      nicheId: itemData.nicheId,
      scannedAt: new Date().toISOString(),
      condition: itemData.condition,
      quickVerdictOnly: itemData.quickVerdictOnly,
      status: "success",
      verdict: itemData.verdict,
    };

    const updated = [newItem, ...scannedItems];
    saveItems(updated);
    setActiveDossier(newItem);
    setShowDossierModal(true);
    setActiveTab("dossier"); // Automatically focus dedicated dossier review page!
    showToast(`⚡ Forensic Appraisal Complete: ${newItem.verdict?.identifiedName || "New Item"}`);
  };

  // Queue an item offline
  const handleQueueOffline = (offlineData: {
    image: string;
    condition: ConditionAnswers;
    quickVerdictOnly: boolean;
  }) => {
    const newItem: OfflineQueueItem = {
      id: "off-" + Math.random().toString(36).substr(2, 9),
      image: offlineData.image,
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
      id: "scan-sample-pyrex",
      image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'><defs><radialGradient id='bg' cx='50%' cy='40%' r='60%'><stop offset='0%' stop-color='%231e293b'/><stop offset='100%' stop-color='%230f172a'/></radialGradient></defs><rect width='600' height='600' fill='url(%23bg)'/><ellipse cx='300' cy='440' rx='200' ry='30' fill='%23000' opacity='0.5'/><rect x='160' y='200' width='280' height='180' rx='40' fill='%23fef08a' stroke='%23eab308' stroke-width='6'/><ellipse cx='300' cy='200' rx='140' ry='25' fill='%23ffffff' opacity='0.9' stroke='%23e2e8f0' stroke-width='3'/><circle cx='250' cy='290' r='18' fill='%23eab308'/><circle cx='300' cy='290' r='18' fill='%23eab308'/><circle cx='350' cy='290' r='18' fill='%23eab308'/><text x='300' y='480' font-family='sans-serif' font-weight='bold' font-size='22' fill='%23f8fafc' text-anchor='middle'>VINTAGE PYREX 1970s</text><text x='300' y='510' font-family='sans-serif' font-size='14' fill='%23fbbf24' text-anchor='middle'>Daisy %23475-B 2.5L Casserole</text></svg>",
      nicheId: "general",
      scannedAt: new Date().toISOString(),
      condition: {
        functional: "yes",
        complete: "yes",
        wearNotes: "EXCELLENT VINTAGE CONDITION. No chips or flea bites. Bright daisy pattern.",
        scaleReference: "credit_card"
      },
      quickVerdictOnly: false,
      status: "success",
      verdict: {
        identifiedName: "1970s Pyrex Daisy Sunflower #475-B 2.5L Casserole Dish with Opal Lid",
        category: "Vintage Kitchenware & Collectible Glassware",
        confidence: 96,
        confidenceScore: 96,
        lowValue: 48,
        highValue: 95,
        currency: "USD",
        verdict: "BUY",
        verdictReasoning: "Strong collector demand for pristine Pyrex Daisy/Sunflower patterns. Zero chips or pattern fading on the opal lid.",
        authenticityStatus: "authentic",
        inspectionPointsToVerify: "Inspect underside base for 'PYREX Made in USA 475-B 2.5L' raised relief mark. Verify opal glass transparency under backlighting.",
        valuationMethodology: "Cross-referenced 18 historical eBay sold comps over the last 90 days for Pyrex Daisy 475-B in original opal lid condition.",
        measurementsCm: { widthCm: 22.4, heightCm: 11.2, depthCm: 22.4 },
        reproTells: ["Verify milk glass opacity; authentic 1970s Pyrex has substantial weight and warm cream translucency under light."],
        keyIdentifiers: ["PYREX Made in USA 475-B 2.5L relief stamp on base", "Original Opal Glass Lid"],
        listingTitle: "Vintage 1970s Pyrex Daisy Sunflower #475-B 2.5L Casserole Dish w/ Opal Lid",
        listingKeywords: ["Vintage Pyrex Daisy", "Pyrex 475 B", "Sunflower Casserole Dish", "1970s Pyrex Opal Lid", "Mid Century Kitchenware"],
        suggestedListingPrice: 78,
        descriptionWriteup: "FOR SALE: Rare vintage 1970s Pyrex Daisy Sunflower #475-B 2.5L Casserole Dish complete with original opal glass lid. Features vibrant yellow daisy screen-print pattern over white milk glass base. Excellent condition with no chips, cracks, or dishwasher dulling. Measurements approximately 22.4cm x 11.2cm.",
        ebaySoldSearchUrl: "https://www.ebay.com/sch/i.html?_nkw=pyrex+daisy+475+b&_sacat=0&LH_Sold=1&LH_Complete=1",
        nextMoveStrategy: {
          bestOverallPath: "List as Buy-It-Now on eBay with 'Best Offer' enabled or cross-list to Mercari. High collector demand ensures fast 3-5 day turnaround.",
          pathways: [
            {
              id: "online_marketplace",
              type: "online_marketplace",
              targetPlatform: "eBay / Mercari Cross-List",
              suitabilityScore: 96,
              estimatedPayout: "$62.80 net after platform fees",
              turnaroundTime: "2-5 Days",
              stepsToExecute: [
                "Create Buy-It-Now listing at $78 with 'Best Offer' enabled above $65",
                "Copy & paste the AI-optimized listing title and description into eBay",
                "Ship in double-boxed heavy bubble wrap via USPS Ground Advantage"
              ],
              customPostCopy: "FOR SALE: Vintage 1970s Pyrex Daisy Sunflower #475-B 2.5L Casserole Dish with Opal Glass Lid.\n\nPristine condition. No chips, flea bites, or pattern fading. Carefully packed with heavy double-box protection for safe 24-hour shipping dispatch.",
              proTips: [
                "Add 'Mid-Century Modern MCM' to eBay search tags for 35% higher view impressions",
                "Promote listing at 3% ad rate on eBay"
              ]
            },
            {
              id: "private_collectors",
              type: "private_collectors",
              targetPlatform: "Pyrex Collector Groups & Reddit r/Pyrex_Love",
              suitabilityScore: 90,
              estimatedPayout: "$70.00 zero platform fee",
              turnaroundTime: "1-2 Days",
              stepsToExecute: [
                "Post tagged timestamp photo in Pyrex Passion collector group",
                "Accept payment via PayPal Goods & Services"
              ],
              customPostCopy: "[FS] Vintage 1970s Pyrex Daisy 475-B 2.5L with Opal Lid. Asking $70 shipped CONUS. Pristine, zero dishwasher haze. PM for photos!",
              proTips: ["Collectors appreciate backlight photos proving zero pattern scratches"]
            }
          ]
        },
        stagingPhotoGuide: {
          backdropRecommendation: "Clean reclaimed oak butcher block or neutral matte slate tabletop.",
          lightingRecipe: "45-degree indirect natural window light with white foam board shadow reflector.",
          photoAngles: [
            { angleName: "Hero 45° Angle with Lid", coachingInstructions: "Show casserole with opal lid angled toward light source.", importance: "essential" },
            { angleName: "Base Relief Stamp Macro", coachingInstructions: "Close-up macro of 'PYREX 475-B 2.5L' raised relief stamp.", importance: "essential" }
          ],
          aiStagingPrompt: "Studio catalog photo of vintage 1970s yellow Pyrex Daisy casserole dish staged on a clean warm butcher block kitchen counter with soft morning sunlight."
        }
      }
    };

    saveItems([sampleDemoItem, ...scannedItems]);
    setActiveDossier(sampleDemoItem);
    setShowDossierModal(true);
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
          nicheId: queueItem.nicheId,
          nicheName: niche.name,
          quickVerdictOnly: queueItem.quickVerdictOnly,
          condition: queueItem.condition,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      // Transition draft to registered inventory
      const newItem: ScannedItem = {
        id: "scan-" + Math.random().toString(36).substr(2, 9),
        image: queueItem.image,
        nicheId: queueItem.nicheId,
        scannedAt: queueItem.capturedAt,
        condition: queueItem.condition,
        quickVerdictOnly: queueItem.quickVerdictOnly,
        status: "success",
        verdict: data,
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
              onLoadSampleItem={handleLoadSampleItem}
              onInspectDossier={(item) => {
                setActiveDossier(item);
                setShowDossierModal(true);
                setActiveTab("dossier");
              }}
            />
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

      {/* SOFT MATERIALIZING PRODUCT INFO DOSSIER POPUP OVERLAY MODAL */}
      {showDossierModal && activeDossier && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 overflow-y-auto animate-in fade-in duration-300">
          <div className="relative bg-stone-900 border border-stone-800 shadow-2xl rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-y-auto my-auto p-4 sm:p-6 animate-in zoom-in-95 duration-300 space-y-4 text-stone-100">
            
            {/* Top Sticky Header Bar */}
            <div className="sticky -top-4 -mx-4 -mt-4 sm:-top-6 sm:-mx-6 sm:-mt-6 z-30 bg-stone-950/95 backdrop-blur-md px-4 sm:px-6 py-3.5 border-b border-stone-800 flex items-center justify-between gap-3 shadow-md rounded-t-3xl">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ⚡ Product Dossier Materialized
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDossierModal(false);
                    setActiveTab("scanner");
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Scan Next Item</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDossierModal(false)}
                  className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 cursor-pointer transition-colors"
                  title="Close Product Info Popup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Product Info / Dossier View Content */}
            <div className="pt-2">
              <DossierView
                item={activeDossier}
                onBackToScanner={() => {
                  setShowDossierModal(false);
                  setActiveTab("scanner");
                }}
                onViewInventory={() => {
                  setShowDossierModal(false);
                  setActiveTab("inventory");
                }}
                onDeleteItem={(id) => {
                  handleDeleteItem(id);
                  setActiveDossier(null);
                  setShowDossierModal(false);
                }}
              />
            </div>

          </div>
        </div>
      )}

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
