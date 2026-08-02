import React, { useRef, useState } from "react";
import { Camera, Upload, X, AlertCircle, Sparkles, PenTool, RefreshCw } from "lucide-react";
import { AIPhotoNutritionEstimate, AIRequestStatus } from "../types";
import { aiService } from "../services/aiService";

interface AIPhotoUploadFormProps {
  onPhotoAnalyzed: (estimate: AIPhotoNutritionEstimate) => void;
  onSwitchToManual: () => void;
}

export const AIPhotoUploadForm: React.FC<AIPhotoUploadFormProps> = ({
  onPhotoAnalyzed,
  onSwitchToManual,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<{
    dataUrl: string;
    base64: string;
    mimeType: string;
  } | null>(null);

  const [status, setStatus] = useState<AIRequestStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Resize and convert file to clean base64 data url
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (JPEG, PNG, WebP, etc.).");
      return;
    }

    // Enforce 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Image size is too large (max 10MB). Please select a smaller photo.");
      return;
    }

    setErrorMessage("");
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) return;

      // Downscale canvas to max 1200px dimension
      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const resizedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
          const cleanBase64 = resizedDataUrl.replace(/^data:image\/\w+;base64,/, "");

          setSelectedImage({
            dataUrl: resizedDataUrl,
            base64: cleanBase64,
            mimeType: "image/jpeg",
          });
        } else {
          const cleanBase64 = src.replace(/^data:image\/\w+;base64,/, "");
          setSelectedImage({
            dataUrl: src,
            base64: cleanBase64,
            mimeType: file.type || "image/jpeg",
          });
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzePhoto = async () => {
    if (!selectedImage) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const result = await aiService.analyzeFoodImage(selectedImage.base64, selectedImage.mimeType);
      setStatus("success");
      onPhotoAnalyzed(result);
    } catch (err: any) {
      console.error("Photo analysis error:", err);
      if (err.isRateLimit) {
        setStatus("rate_limited");
      } else {
        setStatus("error");
      }
      setErrorMessage(
        err.message || "We could not confidently analyze this photo right now. Try another photo or enter food manually."
      );
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setStatus("idle");
    setErrorMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Image Upload Area */}
      {!selectedImage ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 group"
        >
          <div className="p-3 bg-white border border-slate-200 rounded-full text-emerald-600 shadow-sm group-hover:scale-105 transition">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm sm:text-base">
              Take or Upload Meal Photo
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Snap a picture of your plate or select from your gallery
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-3 py-1.5 rounded-full">
            <Upload className="w-3.5 h-3.5" />
            <span>Choose Image</span>
          </div>
        </div>
      ) : (
        /* Image Preview Box */
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900 max-h-72 flex items-center justify-center">
            <img
              src={selectedImage.dataUrl}
              alt="Meal preview"
              className="w-full h-auto object-contain max-h-72"
            />
            <button
              type="button"
              onClick={handleClearImage}
              disabled={status === "loading"}
              className="absolute top-3 right-3 p-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full transition shadow"
              title="Remove photo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={status === "loading"}
              className="flex-1 py-2.5 px-3 border border-slate-300 rounded-xl text-slate-700 font-medium text-xs sm:text-sm hover:bg-slate-50 flex items-center justify-center gap-1.5 transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Replace Photo</span>
            </button>

            <button
              type="button"
              onClick={handleAnalyzePhoto}
              disabled={status === "loading"}
              className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-50"
            >
              {status === "loading" ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Meal Photo</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Loading Banner */}
      {status === "loading" && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-900">Analyzing your meal photo...</p>
            <p className="text-xs text-emerald-700">Detecting food items, portion sizes, and calories</p>
          </div>
        </div>
      )}

      {/* Error & Rate-Limit States */}
      {(status === "error" || status === "rate_limited" || errorMessage) && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3 text-slate-800">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-900">
                {status === "rate_limited" ? "AI Service Busy" : "Photo Analysis Failed"}
              </p>
              <p className="text-amber-800 mt-0.5">
                {errorMessage || "We could not process this photo right now. Please try again or enter items manually."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/60">
            {selectedImage && (
              <button
                type="button"
                onClick={handleAnalyzePhoto}
                className="text-xs font-semibold px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
              >
                Try Again
              </button>
            )}
            <button
              type="button"
              onClick={onSwitchToManual}
              className="text-xs font-semibold px-3 py-1.5 bg-white border border-amber-300 text-amber-900 rounded-lg hover:bg-amber-100 flex items-center gap-1 transition"
            >
              <PenTool className="w-3.5 h-3.5" />
              Enter Food Manually
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
