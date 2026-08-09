import React, { useState, useRef, useEffect } from "react";
import { NicheConfig, ConditionAnswers, ScaleReferenceType } from "../types";
import { NICHE_CONFIGS } from "../nicheConfigs";
import FocusModuleSelector from "./FocusModuleSelector";
import { 
  Camera, 
  Upload, 
  Sparkles, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  WifiOff, 
  Video, 
  X, 
  CreditCard, 
  Ruler, 
  Coins, 
  Maximize2, 
  RotateCcw, 
  Zap, 
  Aperture, 
  Check, 
  Layers, 
  Plus, 
  Trash2, 
  SlidersHorizontal, 
  ChevronDown, 
  ChevronUp, 
  FileText,
  Eye,
  Info
} from "lucide-react";

interface ScannerTabProps {
  activeNiche: NicheConfig;
  onSelectNiche?: (niche: NicheConfig) => void;
  onAnalysisComplete: (itemData: any) => void;
  onQueueOffline: (offlineItem: { image: string; condition: ConditionAnswers; quickVerdictOnly: boolean }) => void;
  isOnline: boolean;
  scannedItemsCount?: number;
  totalEstValue?: number;
  buyCount?: number;
  offlineQueueCount?: number;
  onNavigateTab?: (tab: "inventory" | "offline") => void;
  onLoadSampleItem?: () => void;
}

interface PhotoSlot {
  id: string;
  label: string;
  required?: boolean;
  image: string | null;
}

export default function ScannerTab({
  activeNiche,
  onSelectNiche,
  onAnalysisComplete,
  onQueueOffline,
  isOnline,
  scannedItemsCount = 0,
  totalEstValue = 0,
  buyCount = 0,
  offlineQueueCount = 0,
  onNavigateTab,
  onLoadSampleItem,
}: ScannerTabProps) {
  // Multi-angle photo slots
  const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>([
    { id: "hero", label: "Hero Overview", required: true, image: null },
    { id: "hallmark", label: "Stamp / Hallmark", image: null },
    { id: "defect", label: "Wear / Defect", image: null },
    { id: "scale", label: "Scale Reference", image: null },
  ]);
  const [activeSlotId, setActiveSlotId] = useState<string>("hero");

  // General App State
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisPhase, setAnalysisPhase] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isServiceUnavailable, setIsServiceUnavailable] = useState<boolean>(false);

  // Appraisal Options
  const [quickVerdictOnly, setQuickVerdictOnly] = useState<boolean>(false);
  const [queueOfflineMode, setQueueOfflineMode] = useState<boolean>(!isOnline);
  const [showSpecialtyModal, setShowSpecialtyModal] = useState<boolean>(false);

  // Scale Reference Calibration
  const [scaleReference, setScaleReference] = useState<ScaleReferenceType>("credit_card");

  // Condition Inputs
  const [conditionPreset, setConditionPreset] = useState<"mint" | "good" | "damaged" | "untested">("good");
  const [wearNotes, setWearNotes] = useState<string>("");
  const [nicheAnswers, setNicheAnswers] = useState<Record<string, string>>({});

  // Camera & Video Streaming
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Interactive Lab & Filters
  const [isUvFilterActive, setIsUvFilterActive] = useState<boolean>(false);
  const [showLabTools, setShowLabTools] = useState<boolean>(false);
  const [buyCost, setBuyCost] = useState<number>(10);
  const [targetSale, setTargetSale] = useState<number>(65);
  const [isPlayingPing, setIsPlayingPing] = useState<boolean>(false);
  const [deadwaxCode, setDeadwaxCode] = useState<string>("");
  const [decodedDeadwax, setDecodedDeadwax] = useState<string>("");
  const [garmsStitchType, setGarmsStitchType] = useState<"single" | "double">("single");

  // Active displayed image from the active slot
  const currentSlot = photoSlots.find(s => s.id === activeSlotId) || photoSlots[0];
  const primaryImage = photoSlots[0].image;

  // Sync offline toggle when system status changes
  useEffect(() => {
    if (!isOnline) {
      setQueueOfflineMode(true);
    }
  }, [isOnline]);

  // Clean camera streaming resources on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Image compressor helper
  const compressImage = (dataUrl: string, maxDimension = 1280, quality = 0.85): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            width = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const updateSlotImage = (slotId: string, imgDataUrl: string | null) => {
    setPhotoSlots(prev => prev.map(s => s.id === slotId ? { ...s, image: imgDataUrl } : s));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const rawData = reader.result as string;
      const optimized = await compressImage(rawData);
      updateSlotImage(activeSlotId, optimized);
      stopCamera();
    };
    reader.onerror = () => {
      setError("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  // Drag & drop handlers
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Ensure video element plays stream as soon as isCameraActive is set
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((e) => console.log("Video playback initial trigger:", e));
    }
  }, [isCameraActive]);

  // Camera start / stop
  const startCamera = async () => {
    setError(null);
    setIsServiceUnavailable(false);
    try {
      if (streamRef.current) stopCamera();

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch (firstErr) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setIsCameraActive(true);
      
      // Attempt immediate video binding if node exists
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error("Live WebRTC camera stream failed:", err);
      setIsCameraActive(false);
      setError(`Live WebRTC stream unavailable (${err?.message || "Permission restricted"}). Tap "Camera Snap" below to take a picture directly with your phone's native camera!`);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureSnapshot = async () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        const optimized = await compressImage(dataUrl);
        updateSlotImage(activeSlotId, optimized);
        stopCamera();

        // Automatically advance to next empty slot if present
        const nextEmpty = photoSlots.find(s => s.id !== activeSlotId && !s.image);
        if (nextEmpty) {
          setActiveSlotId(nextEmpty.id);
        }
      }
    }
  };

  const clearCurrentSlot = () => {
    updateSlotImage(activeSlotId, null);
    stopCamera();
  };

  const clearAllSlots = () => {
    setPhotoSlots(prev => prev.map(s => ({ ...s, image: null })));
    setError(null);
    setIsServiceUnavailable(false);
    stopCamera();
  };

  // Build composite image if multiple photo slots have images
  const createCompositeImageIfNeeded = async (): Promise<string> => {
    const filledSlots = photoSlots.filter(s => s.image !== null);
    if (filledSlots.length <= 1) {
      return filledSlots[0]?.image || primaryImage || "";
    }

    // Combine photos into a clean side-by-side or 2x2 grid canvas
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = filledSlots.length > 2 ? 1200 : 600;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(filledSlots[0].image!);
        return;
      }

      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let loadedCount = 0;
      const total = filledSlots.length;

      filledSlots.forEach((slot, index) => {
        const img = new Image();
        img.onload = () => {
          let x = 0, y = 0, w = 600, h = 600;
          if (total === 2) {
            x = index * 600;
            y = 0;
            w = 600;
            h = 600;
          } else if (total > 2) {
            x = (index % 2) * 600;
            y = Math.floor(index / 2) * 600;
            w = 600;
            h = 600;
          }

          ctx.drawImage(img, x, y, w, h);
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 4;
          ctx.strokeRect(x, y, w, h);

          // Draw text label overlay
          ctx.fillStyle = "rgba(0,0,0,0.75)";
          ctx.fillRect(x + 10, y + 10, 220, 36);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 16px sans-serif";
          ctx.fillText(slot.label, x + 20, y + 34);

          loadedCount++;
          if (loadedCount === total) {
            resolve(canvas.toDataURL("image/jpeg", 0.88));
          }
        };
        img.onerror = () => {
          loadedCount++;
          if (loadedCount === total) resolve(filledSlots[0].image!);
        };
        img.src = slot.image!;
      });
    });
  };

  // Run Appraisal Call
  const triggerAppraisal = async () => {
    if (!primaryImage) return;

    // Convert conditionPreset to structured ConditionAnswers
    let functionalOpt: "yes" | "no" | "untested" | "na" = "yes";
    let completeOpt: "yes" | "no" | "na" = "yes";

    if (conditionPreset === "damaged") {
      functionalOpt = "no";
      completeOpt = "no";
    } else if (conditionPreset === "untested") {
      functionalOpt = "untested";
    }

    const compiledCondition: ConditionAnswers = {
      functional: functionalOpt,
      complete: completeOpt,
      wearNotes: `${conditionPreset.toUpperCase()} CONDITION. ${wearNotes}`.trim(),
      scaleReference,
      nicheSpecificAnswers: nicheAnswers,
    };

    if (queueOfflineMode) {
      onQueueOffline({
        image: primaryImage,
        condition: compiledCondition,
        quickVerdictOnly,
      });
      clearAllSlots();
      return;
    }

    setAnalyzing(true);
    setAnalysisPhase("Packaging High-Res Visual Evidence...");
    setError(null);
    setIsServiceUnavailable(false);

    try {
      const finalImagePayload = await createCompositeImageIfNeeded();

      setAnalysisPhase(`Running ${activeNiche.name} Forensic Analysis...`);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: finalImagePayload,
          nicheId: activeNiche.id,
          nicheName: activeNiche.name,
          quickVerdictOnly,
          condition: compiledCondition,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Appraisal request failed.");
      }

      onAnalysisComplete({
        image: finalImagePayload,
        nicheId: activeNiche.id,
        condition: compiledCondition,
        quickVerdictOnly,
        verdict: data,
      });

      clearAllSlots();
    } catch (err: any) {
      console.error("Appraisal error:", err);
      const errMsg = err.message || "Network appraisal request timed out. Toggle 'Queue Offline' to save photos and appraise later.";
      setError(errMsg);
      const isUnavailable = /503|demand|UNAVAILABLE|busy|limit|rate|overload/i.test(errMsg);
      setIsServiceUnavailable(isUnavailable);
    } finally {
      setAnalyzing(false);
      setAnalysisPhase("");
    }
  };

  // Silver Resonance Ping Synthesizer
  const playSilverPing = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(1420, ctx.currentTime);
      
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(900, ctx.currentTime);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.5);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 3.6);
      
      setIsPlayingPing(true);
      setTimeout(() => setIsPlayingPing(false), 3500);
    } catch (e) {
      console.error("Audio block:", e);
    }
  };

  // Deadwax matrix decoder
  const handleDecodeDeadwax = (code: string) => {
    setDeadwaxCode(code);
    if (!code) {
      setDecodedDeadwax("");
      return;
    }
    const clean = code.trim().toUpperCase();
    if (clean.includes("SMAS") || clean.includes("11163")) {
      setDecodedDeadwax("🎯 Pink Floyd - Dark Side of the Moon (1973 First US Pressing, Capitol Jacksonville Plant)");
    } else if (clean.includes("SD") || clean.includes("7201")) {
      setDecodedDeadwax("🎯 Led Zeppelin - Led Zeppelin III (1970 Monarch Pressing with 'Do What Thou Wilt' etched)");
    } else if (clean.includes("ISBN") || clean.includes("0394")) {
      setDecodedDeadwax("🎯 Random House First Edition Hardcover (First printing, matching price $5.95 on flap)");
    } else {
      setDecodedDeadwax(`🔍 Matrix Code '${clean}' matches vintage press run stamps. Cross-referenced in Discogs.`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* 1. Compact Swiss Army Resale HUD Bar */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-3 px-4 text-stone-100 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Left: Essential HUD Numbers */}
        <div className="flex items-center gap-3 font-mono">
          <div className="flex items-center gap-1.5 bg-stone-950 px-2.5 py-1 rounded-xl border border-stone-800">
            <span className="text-[10px] text-stone-400 font-sans uppercase font-bold">Valuation:</span>
            <span className="font-extrabold text-emerald-400">${totalEstValue.toLocaleString()}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-stone-950 px-2.5 py-1 rounded-xl border border-stone-800">
            <span className="text-[10px] text-stone-400 font-sans uppercase font-bold">Scouted:</span>
            <span className="font-bold text-amber-300">{scannedItemsCount} Dossiers</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 bg-stone-950 px-2.5 py-1 rounded-xl border border-stone-800">
            <span className="text-[10px] text-stone-400 font-sans uppercase font-bold">Buy Deals:</span>
            <span className="font-bold text-indigo-300">{buyCount} / {scannedItemsCount}</span>
          </div>
        </div>

        {/* Right: Quick Action Swiss Army Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateTab?.("inventory")}
            className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700/80 flex items-center gap-1 transition-colors cursor-pointer text-[11px]"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Ledger</span> ({scannedItemsCount})
          </button>

          {offlineQueueCount > 0 && (
            <button
              type="button"
              onClick={() => onNavigateTab?.("offline")}
              className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700/80 flex items-center gap-1 transition-colors cursor-pointer text-[11px]"
            >
              <Layers className="w-3.5 h-3.5 text-rose-400" />
              <span>Offline</span> ({offlineQueueCount})
            </button>
          )}

          {onLoadSampleItem && (
            <button
              type="button"
              onClick={onLoadSampleItem}
              className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 flex items-center gap-1 transition-colors cursor-pointer text-[11px] font-bold"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>1-Tap Demo</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setQueueOfflineMode(!queueOfflineMode)}
            className={`px-2 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 font-mono text-[10px] ${
              queueOfflineMode 
                ? "bg-amber-500/20 text-amber-300 border-amber-500/50" 
                : "bg-stone-800 text-stone-400 border-stone-700"
            }`}
            title="Toggle offline draft queue"
          >
            <WifiOff className="w-3 h-3 text-amber-400" />
            <span className="hidden lg:inline">{queueOfflineMode ? "Offline Drafts" : "Online"}</span>
          </button>
        </div>

      </div>

      {/* 2. Main Studio Lens Viewfinder & Multi-Part Strip Container */}
      <div className="bg-stone-950 rounded-3xl p-4 sm:p-6 border border-stone-800 shadow-2xl relative overflow-hidden space-y-5">
        
        {/* Viewfinder Header Status Bar with Specialty Focus Selector Dropdown */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-800/80 pb-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-800 px-3 py-1.5 rounded-xl">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[10px] text-stone-400 uppercase font-mono font-bold">Specialty Focus:</span>
              <select
                value={activeNiche.id}
                onChange={(e) => {
                  const found = NICHE_CONFIGS.find(n => n.id === e.target.value);
                  if (found && onSelectNiche) onSelectNiche(found);
                }}
                className="bg-stone-950 text-amber-300 font-bold font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer pr-1"
              >
                {NICHE_CONFIGS.map(niche => (
                  <option key={niche.id} value={niche.id}>
                    {niche.id === 'auto' ? "✨ Auto-Detect Focus (AI Research Auto-Classifies)" : `${niche.name} Focus`}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowSpecialtyModal(true)}
                className="ml-1 px-2 py-0.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-mono font-semibold transition-colors cursor-pointer border border-stone-700"
                title="View or change specialty rulebooks"
              >
                Rulebook
              </button>
            </div>
            <span className="text-stone-400 font-mono text-[11px] hidden lg:inline">• Optical Evidence Lens</span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {activeNiche.id === "artperiod" && (
              <button
                type="button"
                onClick={() => setIsUvFilterActive(!isUvFilterActive)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all ${
                  isUvFilterActive ? "bg-purple-900 text-purple-200 border border-purple-500 animate-pulse" : "bg-stone-800 text-purple-300 border border-stone-700"
                }`}
              >
                ⚡ {isUvFilterActive ? "UV Lamp ON" : "UV Lamp Filter"}
              </button>
            )}

            {!isCameraActive && (
              <button
                type="button"
                onClick={startCamera}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Launch Studio Camera</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Viewfinder Frame */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative w-full rounded-2xl border-2 transition-all overflow-hidden flex flex-col items-center justify-center min-h-[360px] sm:min-h-[460px] ${
            isDragging 
              ? "border-amber-400 bg-amber-950/20" 
              : "border-stone-800 bg-stone-900"
          }`}
        >
          {/* Cyberpunk Studio Corner Brackets HUD */}
          <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-amber-400/80 pointer-events-none z-20" />
          <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-amber-400/80 pointer-events-none z-20" />
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-amber-400/80 pointer-events-none z-20" />
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-amber-400/80 pointer-events-none z-20" />
          
          {/* Center Target Crosshair */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-30">
            <div className="w-16 h-16 border border-amber-400/50 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-amber-400 rounded-full" />
            </div>
          </div>

          {/* Active Live Camera Stream */}
          {isCameraActive && (
            <div className="absolute inset-0 bg-black flex flex-col justify-between z-30">
              <video 
                ref={(el) => {
                  videoRef.current = el;
                  if (el && streamRef.current) {
                    if (el.srcObject !== streamRef.current) {
                      el.srcObject = streamRef.current;
                      el.play().catch((err) => console.log("Video auto-play catch:", err));
                    }
                  }
                }} 
                className={`w-full h-full object-cover ${
                  isUvFilterActive ? "filter hue-rotate-[275deg] saturate-[3.5] brightness-[0.7] contrast-[1.4]" : ""
                }`}
                playsInline
                autoPlay
                muted
              />

              {isUvFilterActive && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-purple-950/90 text-purple-300 px-3 py-1 rounded-full text-[10px] font-mono border border-purple-500/40 shadow-lg tracking-widest animate-pulse">
                  ⚡ WOODS LAMP UV FILTER ACTIVE
                </div>
              )}

              {/* Camera Shutter Bar */}
              <div className="absolute bottom-6 inset-x-0 flex items-center justify-center gap-6 px-6 z-40">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="p-3 bg-stone-900/90 hover:bg-stone-800 text-white rounded-full border border-stone-700 cursor-pointer shadow-lg"
                >
                  <X className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={captureSnapshot}
                  className="p-5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold shadow-xl cursor-pointer transition-transform active:scale-95"
                >
                  <Camera className="w-7 h-7" />
                </button>

                <div className="w-11" />
              </div>
            </div>
          )}

          {/* Display Current Selected Slot Image */}
          {currentSlot.image ? (
            <div className="absolute inset-0 bg-stone-950 flex items-center justify-center z-20 overflow-hidden">
              <img 
                src={currentSlot.image} 
                alt={currentSlot.label} 
                className={`w-full h-full object-contain ${
                  isUvFilterActive ? "filter hue-rotate-[275deg] saturate-[3.5] brightness-[0.7] contrast-[1.4]" : ""
                }`}
              />

              {/* Viewfinder Slot Badge */}
              <div className="absolute top-4 left-4 bg-stone-900/90 border border-stone-700 text-amber-400 px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-2">
                <Aperture className="w-3.5 h-3.5" />
                <span>{currentSlot.label} Captured</span>
              </div>

              {/* Instant 1-Tap Trigger Badge Overlay */}
              <div className="absolute bottom-4 inset-x-4 flex justify-center z-30">
                <button
                  type="button"
                  onClick={triggerAppraisal}
                  disabled={analyzing}
                  className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs sm:text-sm font-mono tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20 border border-amber-300 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 fill-stone-950 text-stone-950" />
                  <span>⚡ 1-CLICK AI APPRAISAL</span>
                </button>
              </div>

              {/* Top Right Controls */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearCurrentSlot}
                  className="p-2 bg-stone-900/90 hover:bg-stone-800 text-stone-300 hover:text-white rounded-full border border-stone-700 transition-colors cursor-pointer"
                  title="Remove this photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : !isCameraActive && (
            /* Idle Viewfinder Prompt */
            <div className="text-center p-6 flex flex-col items-center gap-4 max-w-md z-10">
              <div className="p-4 rounded-full bg-stone-900 border border-stone-800 text-amber-400 shadow-inner">
                <Camera className="w-8 h-8 animate-pulse" />
              </div>

              <div>
                <h3 className="text-sm font-bold font-display text-white">
                  Capture {currentSlot.label}
                </h3>
                <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                  Snap or upload photo for <strong className="text-stone-200">{currentSlot.label}</strong>. Position key hallmarks or details cleanly in frame.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-amber-950/90 border border-amber-800 text-amber-200 text-xs text-left leading-relaxed flex items-start gap-2 shadow-sm">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
                  title="Snap photo directly with device camera"
                >
                  <Camera className="w-4 h-4" />
                  <span>Camera Snap</span>
                </button>

                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-xs flex items-center gap-2 cursor-pointer border border-stone-700 transition-all"
                  title="Start live video stream"
                >
                  <Video className="w-4 h-4" />
                  <span>Live Stream</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs flex items-center gap-2 cursor-pointer border border-stone-700 transition-all"
                  title="Choose from device photo gallery"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload File</span>
                </button>
              </div>

              {/* Hidden File Inputs for Native Camera & Pickers */}
              <input 
                ref={nativeCameraInputRef}
                type="file" 
                accept="image/*" 
                capture="environment"
                onChange={handleFileChange}
                className="hidden" 
              />
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className="hidden" 
              />
            </div>
          )}
        </div>

        {/* Multi-Angle / Multi-Part Photo Strip */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 font-mono flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Multi-Part Evidence Capture Strip ({photoSlots.filter(s => s.image).length}/4 Captured)
            </span>
            {photoSlots.some(s => s.image !== null) && (
              <button
                type="button"
                onClick={clearAllSlots}
                className="text-[11px] text-stone-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Reset All Photos
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {photoSlots.map((slot) => {
              const isSelected = activeSlotId === slot.id;
              const hasImg = !!slot.image;

              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => {
                    setActiveSlotId(slot.id);
                    stopCamera();
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-24 relative overflow-hidden ${
                    isSelected
                      ? "bg-stone-800 border-amber-400 ring-1 ring-amber-400/50 shadow-md"
                      : "bg-stone-900/80 border-stone-800 text-stone-400 hover:bg-stone-850"
                  }`}
                >
                  {hasImg ? (
                    <div className="absolute inset-0 bg-stone-950">
                      <img src={slot.image!} alt={slot.label} className="w-full h-full object-cover opacity-80" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-stone-950 p-0.5 rounded-full">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] font-mono text-stone-500">
                        {slot.required ? "REQUIRED" : "OPTIONAL"}
                      </span>
                      <Plus className="w-3.5 h-3.5 text-stone-500" />
                    </div>
                  )}

                  <div className="relative z-10 mt-auto">
                    <span className={`text-xs font-bold block ${hasImg ? "text-white" : isSelected ? "text-amber-400" : "text-stone-300"}`}>
                      {slot.label}
                    </span>
                    <span className="text-[9px] text-stone-400 font-mono block">
                      {hasImg ? "Captured ✓" : "Tap to capture"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Streamlined Quick Condition & Appraisal Tuning Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-5">
        
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold font-display text-stone-900">
              Quick Appraisal Tuning & Scale Setup
            </h3>
          </div>
          <span className="text-xs text-stone-400 font-mono">1-Tap Preset</span>
        </div>

        {/* Scale Object Calibration Pill Selector */}
        <div>
          <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Scale Reference Object in Frame</span>
            <span className="text-[10px] text-amber-600 font-mono font-normal">Computes cm dimensions</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "credit_card", label: "Credit Card / ID", icon: <CreditCard className="w-3.5 h-3.5 text-amber-600" /> },
              { id: "quarter", label: "US Quarter Coin", icon: <Coins className="w-3.5 h-3.5 text-indigo-600" /> },
              { id: "ruler", label: "Ruler / Tape", icon: <Ruler className="w-3.5 h-3.5 text-emerald-600" /> },
              { id: "none", label: "No Scale Card", icon: <Maximize2 className="w-3.5 h-3.5 text-stone-400" /> },
            ].map((scaleOpt) => {
              const isSelected = scaleReference === scaleOpt.id;
              return (
                <button
                  key={scaleOpt.id}
                  type="button"
                  onClick={() => setScaleReference(scaleOpt.id as ScaleReferenceType)}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer text-left ${
                    isSelected
                      ? "bg-amber-50 border-amber-400 text-amber-950 font-bold shadow-xs"
                      : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  {scaleOpt.icon}
                  <span className="text-xs">{scaleOpt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Condition Preset Chips */}
        <div>
          <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">
            Item Condition State
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "good", label: "Good / Light Wear", desc: "Minor scuffs, normal age" },
              { id: "mint", label: "Mint / Like New", desc: "No defects or scratches" },
              { id: "damaged", label: "Damaged / Defective", desc: "Missing parts, chips, breaks" },
              { id: "untested", label: "Untested / As-Is", desc: "Functional status unknown" },
            ].map((cond) => {
              const isSelected = conditionPreset === cond.id;
              return (
                <button
                  key={cond.id}
                  type="button"
                  onClick={() => setConditionPreset(cond.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-stone-900 border-stone-800 text-white font-bold shadow-xs"
                      : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  <span className="text-xs block">{cond.label}</span>
                  <span className="text-[10px] opacity-75 font-normal block mt-0.5">{cond.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Wear Notes Input */}
        <div>
          <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
            Specific Wear / Hallmark Details (Optional)
          </label>
          <input
            type="text"
            value={wearNotes}
            onChange={(e) => setWearNotes(e.target.value)}
            placeholder="e.g., Sterling hallmark on back, small chip on ceramic base, original tag attached..."
            className="w-full text-xs p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-stone-50/50"
          />
        </div>

        {/* Interactive Lab Tools Accordion Drawer */}
        <div className="border-t border-stone-100 pt-3">
          <button
            type="button"
            onClick={() => setShowLabTools(!showLabTools)}
            className="w-full flex items-center justify-between text-xs font-bold text-stone-600 hover:text-stone-900 py-1 cursor-pointer"
          >
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Specialty {activeNiche.name} Lab Utilities ({showLabTools ? "Hide" : "Expand"})
            </span>
            {showLabTools ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showLabTools && (
            <div className="mt-3 p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-4 animate-fadeIn">
              
              {activeNiche.id === "general" && (
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-stone-600">Purchase Cost: <strong>${buyCost}</strong></span>
                    <span className="font-semibold text-stone-600">Target Sale: <strong>${targetSale}</strong></span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="200"
                    value={buyCost}
                    onChange={(e) => setBuyCost(Number(e.target.value))}
                    className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-800"
                  />
                  <div className="p-2.5 rounded-lg bg-stone-900 text-white text-xs flex justify-between font-mono">
                    <span>Est Net Profit: <strong className="text-emerald-400">${(targetSale - buyCost - targetSale*0.13).toFixed(2)}</strong></span>
                    <span>ROI: <strong className="text-amber-400">{(((targetSale - buyCost - targetSale*0.13)/buyCost)*100).toFixed(0)}%</strong></span>
                  </div>
                </div>
              )}

              {activeNiche.id === "artperiod" && (
                <div className="space-y-2">
                  <p className="text-xs text-stone-600">
                    Switch on the simulated Woods-Lamp UV light to reveal overpainting and glue repairs in glaze.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsUvFilterActive(!isUvFilterActive)}
                    className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer ${
                      isUvFilterActive ? "bg-purple-950 text-purple-200 border border-purple-500 animate-pulse" : "bg-purple-100 text-purple-900"
                    }`}
                  >
                    ⚡ {isUvFilterActive ? "Turn Off UV Light" : "Turn On Woods-Lamp UV Light"}
                  </button>
                </div>
              )}

              {activeNiche.id === "coins" && (
                <div className="space-y-2">
                  <p className="text-xs text-stone-600">
                    Test 90% silver coin density resonance with 1420Hz harmonic ping synthesizer.
                  </p>
                  <button
                    type="button"
                    onClick={playSilverPing}
                    disabled={isPlayingPing}
                    className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    🔊 {isPlayingPing ? "Pinging Pure Silver 1420Hz Tone..." : "Trigger Resonance Silver Ping Test"}
                  </button>
                </div>
              )}

              {activeNiche.id === "books_vinyl" && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={deadwaxCode}
                    onChange={(e) => handleDecodeDeadwax(e.target.value)}
                    placeholder="Type matrix code (e.g. SMAS-11163 or ISBN)..."
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-white"
                  />
                  {decodedDeadwax && (
                    <div className="p-2.5 bg-purple-100 text-purple-900 rounded-lg text-xs font-medium">
                      {decodedDeadwax}
                    </div>
                  )}
                </div>
              )}

              {activeNiche.id === "vintage_clothing" && (
                <div className="space-y-2">
                  <p className="text-xs text-stone-600">
                    Select stitch construction type on sleeves/hem:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setGarmsStitchType("single")}
                      className={`p-2 rounded-lg font-bold border ${garmsStitchType === "single" ? "bg-rose-100 border-rose-400 text-rose-900" : "bg-white"}`}
                    >
                      Single Stitch (Pre-1995)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGarmsStitchType("double")}
                      className={`p-2 rounded-lg font-bold border ${garmsStitchType === "double" ? "bg-stone-200 border-stone-400 text-stone-900" : "bg-white"}`}
                    >
                      Double Stitch (Modern)
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Mode Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={quickVerdictOnly}
              onChange={(e) => setQuickVerdictOnly(e.target.checked)}
              className="rounded text-amber-500 border-stone-300 w-4 h-4"
            />
            <span className="font-medium text-stone-700">Quick Verdict Only (Skip Full Listing Copy)</span>
          </label>
        </div>

        {/* Main Action Trigger Button */}
        <div className="pt-2">
          {error && isServiceUnavailable && (
            <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
              <span>API Congested (503). You can queue offline instantly!</span>
              <button
                type="button"
                onClick={() => {
                  if (primaryImage) {
                    onQueueOffline({
                      image: primaryImage,
                      condition: { functional: "yes", complete: "yes", wearNotes, scaleReference },
                      quickVerdictOnly
                    });
                    clearAllSlots();
                  }
                }}
                className="px-3 py-1 bg-amber-600 text-white rounded-lg font-bold text-xs"
              >
                Queue Offline
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={triggerAppraisal}
            disabled={!primaryImage || analyzing}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-3 cursor-pointer transition-all shadow-lg ${
              !primaryImage
                ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                : "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-400 text-stone-950 shadow-amber-500/25 active:scale-[0.99]"
            }`}
          >
            {analyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-stone-950" />
                <span>{analysisPhase || "Forensic AI Appraisal Loading..."}</span>
              </>
            ) : queueOfflineMode ? (
              <>
                <Check className="w-5 h-5" />
                <span>Save Snapshot to Offline Resale Queue</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 fill-stone-950" />
                <span>ANALYZE ITEM WITH FORENSIC RESALE AI</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Optional Specialty Focus Rulebook Modal Overlay */}
      {showSpecialtyModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="max-w-4xl w-full my-auto">
            <FocusModuleSelector
              selectedNicheId={activeNiche.id}
              onSelectNiche={(niche) => {
                if (onSelectNiche) onSelectNiche(niche);
                setShowSpecialtyModal(false);
              }}
              onClose={() => setShowSpecialtyModal(false)}
            />
          </div>
        </div>
      )}

      {/* SOFT FUTURISTIC HUD SCANNING OVERLAY MODAL */}
      {analyzing && (
        <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          <div className="max-w-lg w-full bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6 text-center text-stone-100">
            
            {/* Top Scanning Status Header */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                  AI Optical Reticle Locked
                </span>
              </div>
              <span className="text-[10px] font-mono text-stone-400 font-bold">SYSTEM: LENS AI v2.5</span>
            </div>

            {/* Target Frame Image */}
            <div className="relative aspect-square max-w-xs mx-auto rounded-2xl overflow-hidden border border-stone-700 bg-stone-950 shadow-inner">
              
              {primaryImage ? (
                <img src={primaryImage} alt="Scanning target" className="w-full h-full object-cover filter brightness-[0.9]" />
              ) : (
                <div className="w-full h-full bg-stone-900 flex items-center justify-center text-amber-400">
                  <Camera className="w-12 h-12 animate-pulse" />
                </div>
              )}

              {/* Soft Scanning Sweep Line */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent top-0 animate-[ping_2s_infinite] pointer-events-none z-30" />

              {/* Corner Brackets */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-amber-400/80 pointer-events-none z-20" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-amber-400/80 pointer-events-none z-20" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-amber-400/80 pointer-events-none z-20" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-amber-400/80 pointer-events-none z-20" />

              <div className="absolute bottom-2 inset-x-2 bg-stone-950/80 backdrop-blur-xs py-1 px-2 rounded-lg text-[10px] font-mono text-amber-300 font-bold border border-stone-800">
                PATINA & MAKER STAMP MATRIX
              </div>
            </div>

            {/* Live Telemetry Ticker Text */}
            <div className="space-y-2">
              <h3 className="text-base font-bold font-display text-stone-100 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                <span>{analysisPhase || "Forensic AI Appraisal Loading..."}</span>
              </h3>
              <p className="text-xs text-stone-400 font-mono">
                Extracting visual hallmarks, condition grade & historical sold comps...
              </p>
            </div>

            {/* Animated Progress Bar */}
            <div className="w-full bg-stone-950 rounded-full h-2 overflow-hidden border border-stone-800 p-0.5">
              <div className="bg-amber-400 h-full rounded-full animate-pulse w-full" />
            </div>

            <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest font-bold">
              ⚡ Product Dossier Materializing in seconds...
            </p>

          </div>
        </div>
      )}

    </div>
  );
}
