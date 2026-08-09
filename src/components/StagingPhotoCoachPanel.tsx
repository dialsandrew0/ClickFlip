import React, { useState } from "react";
import { StagingPhotoGuide, PhotoOpAngle } from "../types";
import { 
  Camera, 
  Sparkles, 
  Sun, 
  Layers, 
  CheckSquare, 
  Square, 
  Image as ImageIcon, 
  Loader2, 
  Maximize2, 
  X, 
  Download, 
  RotateCcw,
  Aperture,
  CheckCircle2
} from "lucide-react";

interface StagingPhotoCoachPanelProps {
  guide?: StagingPhotoGuide;
  itemTitle: string;
}

export default function StagingPhotoCoachPanel({ guide, itemTitle }: StagingPhotoCoachPanelProps) {
  const [checkedAngles, setCheckedAngles] = useState<Record<string, boolean>>({});
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [stagedImage, setStagedImage] = useState<string | null>(guide?.stagedImageUrl || null);
  const [isFullscreenModal, setIsFullscreenModal] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Default photo staging guidelines if scanned in offline mode
  const defaultGuide: StagingPhotoGuide = {
    backdropRecommendation: "Clean, non-reflective matte slate gray or reclaimed oak wood tabletop surface.",
    lightingRecipe: "45-degree indirect natural window light paired with a white foam-board fill reflector opposite the light source.",
    photoAngles: [
      {
        angleName: "Primary Hero 45° Perspective",
        coachingInstructions: "Position item at eye level slightly angled to reveal depth, contours, and primary aesthetic hallmarks.",
        importance: "essential"
      },
      {
        angleName: "Scale Reference & Calibration Shot",
        coachingInstructions: "Place standard Credit Card or US Quarter flat alongside the base of the item to confirm physical size.",
        importance: "essential"
      },
      {
        angleName: "Maker Stamp & Hallmark Close-Up",
        coachingInstructions: "Macro focus directly on maker stamp, serial number, deadwax matrix, or tag weave.",
        importance: "high"
      },
      {
        angleName: "Condition & Wear Transparency Shot",
        coachingInstructions: "Highlight any wear, patina, chips, or seam tears clearly so buyers trust your transparency.",
        importance: "high"
      }
    ],
    aiStagingPrompt: `High-resolution studio catalog photo of ${itemTitle}, staged professionally on a clean neutral slate background with soft diffusion window lighting and auction house presentation.`
  };

  const activeGuide = guide || defaultGuide;

  const toggleCheckAngle = (angleName: string) => {
    setCheckedAngles(prev => ({ ...prev, [angleName]: !prev[angleName] }));
  };

  const handleGenerateAIStagedPhoto = async () => {
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const res = await fetch("/api/generate-staged-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: activeGuide.aiStagingPrompt,
          itemTitle,
          backdrop: activeGuide.backdropRecommendation
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.stagedImageUrl) {
        setStagedImage(data.stagedImageUrl);
      } else {
        throw new Error("No image generated in response");
      }
    } catch (err: any) {
      console.error("Failed to generate AI staged photo:", err);
      setGenerationError("Could not generate AI staged photo. Please check network connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white text-stone-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-200 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold font-display text-stone-900">
              AI Photo Op Staging Coach & Studio Generator
            </h3>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Expert studio photography recipes & AI staged mockup visuals for <strong className="text-stone-800">{itemTitle}</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerateAIStagedPhoto}
          disabled={isGenerating}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-stone-900 via-indigo-950 to-stone-900 hover:from-stone-850 hover:to-stone-850 text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shrink-0"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Rendering AI Studio Photo...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Generate AI Staged Studio Photo</span>
            </>
          )}
        </button>
      </div>

      {generationError && (
        <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs">
          {generationError}
        </div>
      )}

      {/* AI Staged Image Render Preview Area */}
      {stagedImage && (
        <div className="bg-stone-900 text-white p-4 rounded-2xl border border-stone-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Sparkles className="w-4 h-4" />
              AI Studio Staged Showcase Render
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFullscreenModal(true)}
                className="p-1.5 hover:bg-stone-800 rounded-lg text-stone-300 hover:text-white transition-colors text-xs flex items-center gap-1"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Expand</span>
              </button>
            </div>
          </div>

          <div className="relative group rounded-xl overflow-hidden bg-stone-950 border border-stone-800 aspect-square max-w-sm mx-auto shadow-inner flex items-center justify-center">
            <img 
              src={stagedImage} 
              alt="AI Staged Studio Showcase" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsFullscreenModal(true)}
                className="px-3 py-1.5 bg-white text-stone-900 rounded-lg text-xs font-bold shadow-md cursor-pointer flex items-center gap-1"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                View High-Res
              </button>
            </div>
          </div>

          <p className="text-[11px] text-stone-400 text-center italic">
            Visual reference for buyers & catalog listings. Use as photo inspiration!
          </p>
        </div>
      )}

      {/* Photo Recipe Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Backdrop Surface */}
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
          <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            Recommended Surface & Backdrop
          </h4>
          <p className="text-xs text-stone-800 font-medium leading-relaxed">
            {activeGuide.backdropRecommendation}
          </p>
        </div>

        {/* Lighting Recipe */}
        <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 space-y-1">
          <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-amber-600" />
            Studio Lighting Recipe
          </h4>
          <p className="text-xs text-amber-950 font-medium leading-relaxed">
            {activeGuide.lightingRecipe}
          </p>
        </div>

      </div>

      {/* Interactive Photography Coaching Shot List */}
      <div>
        <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Aperture className="w-4 h-4 text-indigo-600" />
          Interactive High-Yield Photography Shot List
        </h4>

        <div className="space-y-2.5">
          {activeGuide.photoAngles.map((angle, aIdx) => {
            const isChecked = !!checkedAngles[angle.angleName];
            return (
              <div
                key={aIdx}
                onClick={() => toggleCheckAngle(angle.angleName)}
                className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all cursor-pointer ${
                  isChecked
                    ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                    : "bg-white border-stone-200 hover:border-stone-300 text-stone-800"
                }`}
              >
                <button type="button" className="shrink-0 mt-0.5 cursor-pointer">
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Square className="w-4 h-4 text-stone-400" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isChecked ? "line-through text-emerald-800" : "text-stone-900"}`}>
                      {angle.angleName}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                      angle.importance === "essential"
                        ? "bg-rose-100 text-rose-800"
                        : angle.importance === "high"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-stone-100 text-stone-600"
                    }`}>
                      {angle.importance.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    {angle.coachingInstructions}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal for Fullscreen Staged Photo Preview */}
      {isFullscreenModal && stagedImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 text-white rounded-2xl max-w-2xl w-full p-6 space-y-4 border border-stone-800 relative shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <span className="text-sm font-bold font-display text-amber-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI Studio Staged Showcase Photo — {itemTitle}
              </span>
              <button
                type="button"
                onClick={() => setIsFullscreenModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full max-h-[70vh] flex items-center justify-center bg-stone-950 rounded-xl overflow-hidden p-2">
              <img 
                src={stagedImage} 
                alt="AI Staged Fullscreen" 
                className="max-h-[65vh] w-auto object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-stone-400 pt-2 border-t border-stone-800">
              <span>Backdrop: {activeGuide.backdropRecommendation}</span>
              <button
                type="button"
                onClick={() => setIsFullscreenModal(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-xl font-bold cursor-pointer transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
