import React, { useState, useRef, useEffect } from "react";
import { NicheConfig, ConditionAnswers, ScaleReferenceType } from "../types";
import { NICHE_CONFIGS } from "../nicheConfigs";
import { IconMap } from "./FocusModuleSelector";
import {
  Camera,
  Upload,
  RefreshCw,
  Zap,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
  CreditCard,
  Ruler,
  Coins,
  Sparkles,
  ArrowRight,
  WifiOff,
  Clock,
  Layers,
  HelpCircle,
  FlipHorizontal
} from "lucide-react";

interface ScannerTabProps {
  activeNiche: NicheConfig;
  onSelectNiche?: (niche: NicheConfig) => void;
  onAnalysisComplete: (itemData: any) => void;
  onQueueOffline: (offlineItem: {
    image: string;
    additionalImages?: string[];
    condition: ConditionAnswers;
    quickVerdictOnly: boolean;
  }) => void;
  isOnline: boolean;
  scannedItemsCount?: number;
  totalEstValue?: number;
  buyCount?: number;
  offlineQueueCount?: number;
  onNavigateTab?: (tab: "inventory" | "offline" | "dossier") => void;
  onLoadSampleItem?: () => void;
  pastCorrections?: { originalName: string; correctedName: string }[];
}

interface PhotoSlot {
  id: "hero" | "hallmark" | "flaw" | "scale";
  title: string;
  subtitle: string;
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
  offlineQueueCount = 0,
  onNavigateTab,
  onLoadSampleItem,
  pastCorrections = [],
}: ScannerTabProps) {
  // Multi-angle photo capture slots
  const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>([
    { id: "hero", title: "Main Photo", subtitle: "Full item in clear light", required: true, image: null },
    { id: "hallmark", title: "Maker Mark / Tag", subtitle: "Logo, stamp, or label", image: null },
    { id: "flaw", title: "Condition / Flaw", subtitle: "Wear, chips, or seam details", image: null },
    { id: "scale", title: "Scale Card", subtitle: "Card or quarter beside item", image: null },
  ]);
  const [activeSlotId, setActiveSlotId] = useState<"hero" | "hallmark" | "flaw" | "scale">("hero");

  // Camera stream state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [torchActive, setTorchActive] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);

  // Analysis state
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisElapsed, setAnalysisElapsed] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [quickVerdictOnly, setQuickVerdictOnly] = useState<boolean>(false);

  // Optional Context Drawer
  const [showContextDrawer, setShowContextDrawer] = useState<boolean>(false);
  const [askingPrice, setAskingPrice] = useState<string>("");
  const [suspectedBrand, setSuspectedBrand] = useState<string>("");
  const [conditionQuality, setConditionQuality] = useState<"mint" | "good" | "flawed" | "parts">("good");
  const [wearNotes, setWearNotes] = useState<string>("");
  const [scaleReference, setScaleReference] = useState<ScaleReferenceType>("credit_card");

  // Drag-and-drop state
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera helper
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setTorchActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Timer while analyzing
  useEffect(() => {
    let timer: any;
    if (analyzing) {
      setAnalysisElapsed(0);
      timer = setInterval(() => {
        setAnalysisElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      setAnalysisElapsed(0);
    }
    return () => clearInterval(timer);
  }, [analyzing]);

  // Client-side image compressor & downscaler
  const compressImage = (dataUrl: string, maxDimension = 800, quality = 0.7): Promise<string> => {
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

  // Start video camera
  const startCamera = async (facing: "environment" | "user" = cameraFacing) => {
    stopCamera();
    setError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
      setCameraFacing(facing);

      // Check if torch/flashlight is supported
      const track = stream.getVideoTracks()[0];
      const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as any;
      setHasTorch(Boolean(capabilities?.torch));
    } catch (err: any) {
      console.warn("Camera access error:", err);
      setIsCameraActive(false);
      // If camera access fails (e.g., iframe permission or denied), trigger file input
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === "environment" ? "user" : "environment";
    startCamera(nextFacing);
  };

  const toggleTorch = async () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      try {
        await (track as any).applyConstraints({
          advanced: [{ torch: !torchActive }],
        });
        setTorchActive(!torchActive);
      } catch (e) {
        console.warn("Torch toggle error:", e);
      }
    }
  };

  // Capture frame from active video stream
  const captureFrame = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawDataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const compressed = await compressImage(rawDataUrl);

    setPhotoSlots((prev) =>
      prev.map((slot) => (slot.id === activeSlotId ? { ...slot, image: compressed } : slot))
    );

    // Auto-advance to next empty slot
    const currentIndex = photoSlots.findIndex((s) => s.id === activeSlotId);
    const nextSlot = photoSlots.find((s, idx) => idx > currentIndex && !s.image);
    if (nextSlot) {
      setActiveSlotId(nextSlot.id);
    } else {
      stopCamera();
    }
  };

  // Process uploaded file
  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPG, PNG, WebP).");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const rawDataUrl = e.target?.result as string;
      const compressed = await compressImage(rawDataUrl);
      setPhotoSlots((prev) =>
        prev.map((slot) => (slot.id === activeSlotId ? { ...slot, image: compressed } : slot))
      );

      // Auto-advance to next empty slot if hero is filled
      if (activeSlotId === "hero") {
        const nextEmpty = photoSlots.find((s) => s.id !== "hero" && !s.image);
        if (nextEmpty) setActiveSlotId(nextEmpty.id);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Remove photo from slot
  const clearSlot = (slotId: string) => {
    setPhotoSlots((prev) =>
      prev.map((slot) => (slot.id === slotId ? { ...slot, image: null } : slot))
    );
  };

  // Execute Resale Appraisal Analysis
  const handleAnalyze = async () => {
    const heroSlot = photoSlots.find((s) => s.id === "hero");
    if (!heroSlot?.image) {
      setError("Please capture or upload at least the main photo before analyzing.");
      return;
    }

    // Collect additional photos
    const additionalImages = photoSlots
      .filter((s) => s.id !== "hero" && s.image)
      .map((s) => s.image as string);

    // Build structured condition object
    const conditionPayload: ConditionAnswers = {
      functional: conditionQuality === "parts" ? "no" : conditionQuality === "mint" ? "yes" : "untested",
      complete: conditionQuality === "parts" ? "no" : "yes",
      wearNotes: wearNotes.trim() || `Condition rated as ${conditionQuality}`,
      askingPrice: askingPrice ? parseFloat(askingPrice) : undefined,
      suspectedBrand: suspectedBrand.trim() || undefined,
      userNotes: wearNotes.trim() || undefined,
      scaleReference: scaleReference,
    };

    const isQuick = quickVerdictOnly;
    const nicheToSend = isQuick ? "auto" : activeNiche.id;
    const nicheNameToSend = isQuick ? "Auto-Detect (Determine focus category)" : activeNiche.name;

    // If offline, save directly to queue
    if (!isOnline) {
      onQueueOffline({
        image: heroSlot.image,
        additionalImages,
        condition: conditionPayload,
        quickVerdictOnly: isQuick,
      });
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const requestPayload = JSON.stringify({
        imageBase64: heroSlot.image,
        additionalImages,
        nicheId: nicheToSend,
        nicheName: nicheNameToSend,
        quickVerdictOnly: isQuick,
        condition: conditionPayload,
        pastCorrections,
      });

      const sendAnalysisRequest = async (attempt: number): Promise<any> => {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: requestPayload,
        });

        const contentType = response.headers.get("content-type") || "";

        // If response is HTML (Vite fallback or Nginx warmup page), auto-retry once after 1.5s
        if (contentType.includes("text/html")) {
          if (attempt < 2) {
            await new Promise((res) => setTimeout(res, 1500));
            return sendAnalysisRequest(attempt + 1);
          }
          throw new Error(
            "The appraisal server is currently warming up. Please tap 'Retry Analysis' in a moment, or save to your Offline Queue."
          );
        }

        let data: any = null;
        if (contentType.includes("application/json")) {
          try {
            data = await response.json();
          } catch {
            data = null;
          }
        }

        // Check HTTP errors
        if (!response.ok) {
          if (response.status === 413) {
            throw new Error("Image is too large. Please try a smaller photo or take a picture from further away.");
          }
          
          const errorMsg =
            data?.error ||
            (response.status === 429
              ? "API Quota Exceeded. Please check your AI Studio plan and billing details, or try again later."
              : response.status === 502 || response.status === 503 || response.status === 504
              ? "Appraisal service is warming up or experiencing high demand. Please try again in a few seconds, or save to your Offline Queue."
              : `Analysis failed (${response.status})`);
          throw new Error(errorMsg);
        }

        if (!data) {
          throw new Error("Unable to parse appraisal results. Please try again or queue offline.");
        }

        return data;
      };

      const data = await sendAnalysisRequest(1);

      // If AI determined a focus category during quick search, update active niche
      let resolvedNicheId = activeNiche.id;
      if (data.detectedNicheId) {
        resolvedNicheId = data.detectedNicheId;
        const matchedNiche = NICHE_CONFIGS.find((n) => n.id === data.detectedNicheId);
        if (matchedNiche && onSelectNiche) {
          onSelectNiche(matchedNiche);
        }
      }

      onAnalysisComplete({
        image: heroSlot.image,
        additionalImages,
        nicheId: resolvedNicheId,
        condition: conditionPayload,
        quickVerdictOnly: isQuick,
        verdict: data,
      });
    } catch (err: any) {
      console.error("Analysis request failed:", err);
      setError(
        err.message ||
          "AI appraisal service is currently experiencing high demand. You can retry or save this scan to your Offline Queue."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // Save to offline queue manually
  const handleSaveToOfflineQueue = () => {
    const heroSlot = photoSlots.find((s) => s.id === "hero");
    if (!heroSlot?.image) {
      setError("Please capture or upload a photo first.");
      return;
    }

    const additionalImages = photoSlots
      .filter((s) => s.id !== "hero" && s.image)
      .map((s) => s.image as string);

    const conditionPayload: ConditionAnswers = {
      functional: conditionQuality === "parts" ? "no" : "yes",
      complete: "yes",
      wearNotes: wearNotes.trim(),
      askingPrice: askingPrice ? parseFloat(askingPrice) : undefined,
      suspectedBrand: suspectedBrand.trim() || undefined,
      userNotes: wearNotes.trim() || undefined,
      scaleReference: scaleReference,
    };

    onQueueOffline({
      image: heroSlot.image,
      additionalImages,
      condition: conditionPayload,
      quickVerdictOnly,
    });
    setError(null);
  };

  const heroImage = photoSlots[0].image;

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Category Ribbon */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto py-0.5 no-scrollbar">
          <span className="text-[11px] font-mono font-bold text-stone-400 uppercase tracking-wider pl-1 whitespace-nowrap">
            Focus:
          </span>

          {/* Quick Search Auto-Detect Button */}
          <button
            onClick={() => setQuickVerdictOnly(!quickVerdictOnly)}
            className={`px-2.5 py-1 rounded-xl text-xs font-mono font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 border ${
              quickVerdictOnly
                ? "bg-amber-400 text-stone-950 font-bold border-amber-300 shadow-sm"
                : "bg-stone-950/80 text-amber-300 border-amber-500/40 hover:bg-amber-400/10"
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Auto-Detect (Quick Search)</span>
          </button>

          {NICHE_CONFIGS.map((niche) => {
            const isSelected = !quickVerdictOnly && niche.id === activeNiche.id;
            const IconComponent = IconMap[niche.icon] || Layers;
            return (
              <button
                key={niche.id}
                onClick={() => {
                  setQuickVerdictOnly(false);
                  if (onSelectNiche) onSelectNiche(niche);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-mono font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-amber-400 text-stone-950 font-bold shadow-sm"
                    : "bg-stone-800/80 text-stone-300 hover:bg-stone-700 hover:text-stone-100"
                }`}
              >
                <IconComponent className="w-3.5 h-3.5" />
                <span>{niche.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Camera / Capture Stage */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative bg-stone-900 border-2 rounded-3xl overflow-hidden transition-all shadow-lg ${
          isDragging ? "border-amber-400 bg-stone-900/90 scale-[1.01]" : "border-stone-800"
        }`}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />

        {/* Live Camera View */}
        {isCameraActive ? (
          <div className="relative aspect-square sm:aspect-[4/3] bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="w-full h-full object-cover"
            />

            {/* Target Reticle Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-amber-400/60 rounded-2xl relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-400 -mt-1 -ml-1" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-400 -mt-1 -mr-1" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-400 -mb-1 -ml-1" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-400 -mb-1 -mr-1" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[11px] font-mono text-amber-300/80 bg-stone-950/70 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    Align {photoSlots.find((s) => s.id === activeSlotId)?.title}
                  </span>
                </div>
              </div>
            </div>

            {/* In-Camera Control Toolbar */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-auto">
              <button
                onClick={stopCamera}
                className="p-2 rounded-full bg-stone-950/80 text-stone-200 hover:text-white border border-stone-700 backdrop-blur-sm cursor-pointer"
                title="Cancel Camera"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                {hasTorch && (
                  <button
                    onClick={toggleTorch}
                    className={`p-2 rounded-full border backdrop-blur-sm cursor-pointer ${
                      torchActive
                        ? "bg-amber-400 text-stone-950 border-amber-300"
                        : "bg-stone-950/80 text-stone-200 border-stone-700"
                    }`}
                    title="Flashlight Toggle"
                  >
                    <Zap className="w-5 h-5" />
                  </button>
                )}

                <button
                  onClick={toggleCameraFacing}
                  className="p-2 rounded-full bg-stone-950/80 text-stone-200 hover:text-white border border-stone-700 backdrop-blur-sm cursor-pointer"
                  title="Switch Front/Rear Camera"
                >
                  <FlipHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Bottom Shutter Action */}
            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center pointer-events-auto">
              <button
                onClick={captureFrame}
                className="w-16 h-16 rounded-full bg-amber-400 hover:bg-amber-300 active:scale-95 text-stone-950 flex items-center justify-center border-4 border-stone-950/70 shadow-2xl transition-all cursor-pointer z-10"
                title="Capture Photo"
              >
                <div className="w-6 h-6 rounded-full bg-stone-950" />
              </button>
              
              <button
                onClick={() => {
                  stopCamera();
                  fileInputRef.current?.click();
                }}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-stone-950/80 text-stone-200 hover:text-white border border-stone-700 backdrop-blur-sm cursor-pointer z-10 flex items-center justify-center"
                title="Upload Photo from Device"
              >
                <Upload className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : photoSlots.find((s) => s.id === activeSlotId)?.image ? (
          /* Preview Display */
          <div className="relative aspect-square sm:aspect-[4/3] bg-stone-950 flex items-center justify-center">
            <img
              src={photoSlots.find((s) => s.id === activeSlotId)?.image!}
              alt="Item Preview"
              className="w-full h-full object-contain"
            />

            {/* Overlay Badge */}
            <div className="absolute top-3 left-3 bg-stone-950/80 backdrop-blur-md px-3 py-1 rounded-xl border border-stone-800 text-xs font-mono text-stone-200 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Viewing: {photoSlots.find((s) => s.id === activeSlotId)?.title}</span>
            </div>

            {/* Quick Retake or Upload replacement */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <button
                onClick={() => startCamera()}
                className="px-3 py-1.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-200 text-xs font-mono font-medium border border-stone-700 shadow-md backdrop-blur-md flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Retake</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-200 text-xs font-mono font-medium border border-stone-700 shadow-md backdrop-blur-md flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Replace</span>
              </button>
            </div>
          </div>
        ) : (
          /* Empty Initial Dropzone */
          <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-4 aspect-square sm:aspect-[4/3]">
            <div className="w-16 h-16 rounded-3xl bg-amber-400/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-1">
              <Camera className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-stone-100 font-display">
                {activeSlotId === "hero" ? "Capture Item for Resale Appraisal" : `Add ${photoSlots.find((s) => s.id === activeSlotId)?.title}`}
              </h3>
              <p className="text-xs text-stone-400 mt-1 max-w-sm">
                {activeSlotId === "hero" 
                  ? "Take a clean photo or drop an image. We'll research sold comps, calculate net margins, and write your listing."
                  : `Capture or upload the ${photoSlots.find((s) => s.id === activeSlotId)?.title.toLowerCase()} photo.`}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => startCamera("environment")}
                className="px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-mono font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Open Camera</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-mono font-medium text-xs flex items-center gap-2 border border-stone-700 shadow-sm transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4 text-stone-400" />
                <span>Upload Photo</span>
              </button>
            </div>

            {onLoadSampleItem && (
              <button
                onClick={onLoadSampleItem}
                className="text-[11px] font-mono text-stone-400 hover:text-amber-300 underline underline-offset-4 pt-3 transition-colors cursor-pointer"
              >
                Or load sample 1970s Pyrex casserole dish
              </button>
            )}
          </div>
        )}

        {/* Multi-angle Photo Slot Bar */}
        <div className="bg-stone-950/95 border-t border-stone-800/80 p-2.5 px-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">
              Evidence Photos ({photoSlots.filter((s) => s.image).length}/4)
            </span>
            <span className="text-[10px] font-mono text-stone-400">
              {activeSlotId === "hero" ? "Slot: Main Item" : `Slot: ${photoSlots.find((s) => s.id === activeSlotId)?.title}`}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {photoSlots.map((slot) => {
              const isSelected = slot.id === activeSlotId;
              const hasImage = Boolean(slot.image);

              return (
                <div
                  key={slot.id}
                  onClick={() => {
                    setActiveSlotId(slot.id);
                  }}
                  className={`relative rounded-xl p-1.5 border transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
                    isSelected
                      ? "border-amber-400 bg-amber-400/10 shadow-sm"
                      : "border-stone-800 bg-stone-900 hover:border-stone-700"
                  }`}
                >
                  {hasImage ? (
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-1">
                      <img
                        src={slot.image!}
                        alt={slot.title}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearSlot(slot.id);
                        }}
                        className="absolute top-1 right-1 p-0.5 rounded-full bg-stone-950/80 text-stone-300 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full aspect-square rounded-lg border border-dashed border-stone-800 flex items-center justify-center text-stone-400 mb-1">
                      <Camera className="w-4 h-4" />
                    </div>
                  )}

                  <span className="text-[10px] font-mono font-bold text-stone-200 truncate w-full">
                    {slot.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Optional Context Drawer (Asking Price, Brand, Condition) */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => setShowContextDrawer(!showContextDrawer)}
          className="w-full px-4 py-3 flex items-center justify-between text-left cursor-pointer hover:bg-stone-850 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono font-bold text-stone-200 uppercase tracking-wider">
              Add Field Context (Optional)
            </span>
            {askingPrice && (
              <span className="px-2 py-0.5 rounded-md bg-stone-800 text-[10px] font-mono text-amber-300 border border-stone-700">
                ${askingPrice} Buy-in
              </span>
            )}
          </div>
          {showContextDrawer ? (
            <ChevronUp className="w-4 h-4 text-stone-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-stone-400" />
          )}
        </button>

        {showContextDrawer && (
          <div className="px-4 pb-4 pt-1 border-t border-stone-800/80 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Buy-in Price */}
              <div>
                <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider mb-1">
                  Asking / Purchase Price ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-stone-400 font-mono text-xs">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="e.g. 5.00"
                    value={askingPrice}
                    onChange={(e) => setAskingPrice(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Suspected Brand */}
              <div>
                <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider mb-1">
                  Suspected Maker / Brand / Era
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pyrex, Mid-Century, Le Creuset"
                  value={suspectedBrand}
                  onChange={(e) => setSuspectedBrand(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Condition Toggle */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider mb-1">
                Observed Condition
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "mint", label: "Mint / Pristine" },
                  { id: "good", label: "Good Vintage" },
                  { id: "flawed", label: "Wear / Flawed" },
                  { id: "parts", label: "Parts / Scrap" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setConditionQuality(item.id as any)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-mono transition-all text-center cursor-pointer border ${
                      conditionQuality === item.id
                        ? "bg-amber-400 text-stone-950 font-bold border-amber-300"
                        : "bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scale Calibration Reference */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider mb-1">
                Scale Reference in Photo
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "credit_card", label: "Credit Card", icon: <CreditCard className="w-3 h-3" /> },
                  { id: "quarter", label: "Quarter Coin", icon: <Coins className="w-3 h-3" /> },
                  { id: "ruler", label: "Ruler / Tape", icon: <Ruler className="w-3 h-3" /> },
                  { id: "none", label: "Visual Est.", icon: <HelpCircle className="w-3 h-3" /> },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setScaleReference(item.id as ScaleReferenceType)}
                    className={`py-1.5 px-2 rounded-xl text-[10px] font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                      scaleReference === item.id
                        ? "bg-amber-400 text-stone-950 font-bold border-amber-300"
                        : "bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Specific Notes */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider mb-1">
                Specific Wear / Notes / Inquiries
              </label>
              <input
                type="text"
                placeholder="e.g. Small flea bite on rim, untested mechanism, missing power cord"
                value={wearNotes}
                onChange={(e) => setWearNotes(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-xs font-mono focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Error Message Banner (Honest, Actionable) */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-800/80 text-rose-200 space-y-2 text-xs font-mono shadow-sm">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block text-rose-100">Appraisal Notice:</span>
              <p className="text-stone-300 mt-0.5">{error}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleAnalyze}
              className="px-3 py-1 rounded-xl bg-rose-800 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry Analysis</span>
            </button>
            <button
              onClick={handleSaveToOfflineQueue}
              className="px-3 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <WifiOff className="w-3 h-3 text-amber-400" />
              <span>Save to Offline Queue</span>
            </button>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="space-y-2">
        {/* Quick Search Mode Helper Info */}
        {quickVerdictOnly && (
          <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-500/30 text-amber-200 text-xs font-mono flex items-center gap-2 shadow-sm">
            <Zap className="w-4 h-4 text-amber-400 shrink-0 fill-amber-400" />
            <span>
              <strong>Quick Search Active:</strong> The app will automatically determine whether this item is Art, Coins, Books/Vinyl, Vintage Clothing, or General Goods on scan.
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Main Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !heroImage}
            className={`flex-1 py-3.5 px-4 rounded-2xl font-mono font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
              analyzing || !heroImage
                ? "bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700/50"
                : "bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-stone-950 border border-amber-300"
            }`}
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-stone-950" />
                <span>
                  {quickVerdictOnly
                    ? `Determining Category & Valuing Comps... (${analysisElapsed}s)`
                    : `Researching Sold Comps & Valuation... (${analysisElapsed}s)`}
                </span>
              </>
            ) : !isOnline ? (
              <>
                <WifiOff className="w-4 h-4 text-stone-950" />
                <span>Save to Offline Queue (No Internet)</span>
              </>
            ) : quickVerdictOnly ? (
              <>
                <Zap className="w-4 h-4 text-stone-950 fill-stone-950" />
                <span>Quick Search (App Determines Category)</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-stone-950" />
                <span>Run Evidence Appraisal ({activeNiche.name})</span>
              </>
            )}
          </button>

          {/* Offline Save Icon Button */}
          {heroImage && (
            <button
              onClick={handleSaveToOfflineQueue}
              title="Save draft to Offline Queue"
              className="p-3.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 cursor-pointer"
            >
              <WifiOff className="w-4 h-4 text-amber-400" />
            </button>
          )}
        </div>

        {/* Quick Verdict Mode Switch */}
        <div className="flex items-center justify-between px-2 text-[11px] font-mono text-stone-400">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={quickVerdictOnly}
              onChange={(e) => setQuickVerdictOnly(e.target.checked)}
              className="rounded bg-stone-900 border-stone-700 text-amber-400 focus:ring-0 cursor-pointer"
            />
            <span>Quick Search Mode (App determines focus category automatically)</span>
          </label>

          {offlineQueueCount > 0 && onNavigateTab && (
            <button
              onClick={() => onNavigateTab("offline")}
              className="text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{offlineQueueCount} drafts waiting</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
