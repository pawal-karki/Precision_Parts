import { useState, useRef } from "react";
import { api, getImageUrl } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export function ImageDropzone({ 
  value, 
  onChange, 
  className = "", 
  aspect = "square", // "square" | "video" | "avatar" | "rectangle"
  label = "Upload Image",
  icon = "add_a_photo",
  fallback = null
}) {
  const [uploading, setUploading] = useState(false);
  const toast = useToast();
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith("image/")) {
      toast("Please upload an image file", "error");
      return;
    }

    setUploading(true);
    try {
      const res = await api.uploadPartImage(file);
      onChange(res.imageUrl);
      toast("Image uploaded successfully", "success");
    } catch (err) {
      toast(err.message || "Upload failed", "error");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
      setUploading(false);
    }
  };

  const isAvatar = aspect === "avatar";
  
  let aspectClass = "aspect-square rounded-2xl";
  if (isAvatar) aspectClass = "aspect-square rounded-full";
  else if (aspect === "video") aspectClass = "aspect-video rounded-2xl";
  else if (aspect === "rectangle") aspectClass = "h-40 rounded-xl";

  return (
    <div className={cn("relative group w-full", className)}>
      <div className={cn(
        "w-full overflow-hidden border-2 border-dashed transition-all duration-300 flex items-center justify-center bg-surface-container-low dark:bg-neutral-800",
        aspectClass,
        value ? "border-transparent relative shadow-inner" : "border-outline-variant dark:border-neutral-700 hover:border-secondary dark:hover:border-neutral-500"
      )}>
        {value ? (
          <>
            <img 
              src={getImageUrl(value)} 
              alt="Preview" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            />
            <div className={cn(
              "absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 backdrop-blur-sm pointer-events-auto z-10",
              isAvatar && "rounded-full"
            )}>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); inputRef.current?.click(); }}
                className="px-4 py-1.5 bg-white text-black rounded-full text-[10px] font-bold shadow-lg hover:scale-105 active:scale-95 transition-all uppercase tracking-wider"
              >
                Change
              </button>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(""); }}
                className="px-4 py-1.5 bg-error text-white rounded-full text-[10px] font-bold shadow-lg hover:scale-105 active:scale-95 transition-all uppercase tracking-wider"
              >
                Remove
              </button>
            </div>
          </>
        ) : uploading ? (
          <div className="flex flex-col items-center gap-2 text-on-surface-variant dark:text-neutral-500 pointer-events-none p-4 text-center">
            <Icon name="progress_activity" className="text-3xl animate-spin text-secondary" />
          </div>
        ) : fallback ? (
          <div className="w-full h-full">
            {fallback}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-on-surface-variant dark:text-neutral-500 pointer-events-none p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-surface-container dark:bg-neutral-700 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <Icon name={icon} className="text-2xl opacity-50" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
            <span className="text-[10px] opacity-40">JPG, PNG or WebP</span>
          </div>
        )}
      </div>
      <input        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className={cn(
          "absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed",
          value ? "hidden" : "z-0"
        )}
        disabled={uploading}
      />
    </div>
  );
}
