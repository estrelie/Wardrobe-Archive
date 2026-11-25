import React, { useState, useRef, useEffect } from "react";
import { Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { COLOR } from "../constants/design";
import { compressFiles, fileToCompressedDataUrl, uploadNotice } from "../lib/image";

/* ---------------------------------------------------------
   Image Manager (Product Photos)
--------------------------------------------------------- */
interface ImageManagerProps {
  images: string[];
  onChange: (imgs: string[]) => void;
}

export function ImageManager({ images, onChange }: ImageManagerProps) {
const inputRef = useRef<HTMLInputElement>(null);
const [busy, setBusy] = useState(false);
const [dragActive, setDragActive] = useState(false);
/** 업로드 결과 안내 (일부 파일을 건너뛰었을 때) */
const [notice, setNotice] = useState<string | null>(null);
useEffect(() => {
  if (!notice) return;
  const t = setTimeout(() => setNotice(null), 5000);
  return () => clearTimeout(t);
}, [notice]);
/** 현재 크게 보고 있는 사진 (상세 모달 전용) */
const [previewIndex, setPreviewIndex] = useState(0);
const [imageHover, setImageHover] = useState(false);
const [hoverThumbIndex, setHoverThumbIndex] = useState<number | null>(null);
const dragCounter = useRef(0);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    try {
      const result = await compressFiles(files, MAX_IMAGE_COUNT - images.length, fileToCompressedDataUrl);
      if (result.urls.length > 0) onChange([...images, ...result.urls]);
      setNotice(uploadNotice(result, MAX_IMAGE_COUNT));
    } catch (err) {
      console.error("image processing failed", err);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };
  
const setMain = (idx: number) => {
  setPreviewIndex(idx);
};

const prevImage = () => {
  if (previewIndex > 0) {
    setPreviewIndex(previewIndex - 1);
  }
};

const nextImage = () => {
  if (previewIndex < images.length - 1) {
    setPreviewIndex(previewIndex + 1);
  }
};

const THUMB_VISIBLE_COUNT =6;
const MAX_IMAGE_COUNT = 6;

const thumbStart = Math.max(
  0,
  Math.min(
    previewIndex - Math.floor(THUMB_VISIBLE_COUNT / 2),
    Math.max(0, images.length - THUMB_VISIBLE_COUNT)
  )
);

const visibleImages = images.slice(
  thumbStart,
  thumbStart + THUMB_VISIBLE_COUNT
);

const remove = (idx: number) => {

const next = images.filter((_, i) => i !== idx);

  if (next.length === 0) {
    setPreviewIndex(0);
  } else if (previewIndex > idx) {
    setPreviewIndex(previewIndex - 1);
  } else if (previewIndex === idx) {
    setPreviewIndex(Math.min(previewIndex, next.length - 1));
  }

  onChange(next);
};

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && Array.from(e.dataTransfer.items).some(item => item.kind === 'file')) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setDragActive(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    dragCounter.current = 0;

    const all = Array.from(e.dataTransfer.files);
    const files = all.filter(f => f.type.startsWith("image/"));
    if (!all.length) return;
    setBusy(true);
    try {
      const result = await compressFiles(files, MAX_IMAGE_COUNT - images.length, fileToCompressedDataUrl);
      result.failed += all.length - files.length; // 이미지가 아닌 파일도 "읽을 수 없음"으로 안내한다
      if (result.urls.length > 0) onChange([...images, ...result.urls]);
      setNotice(uploadNotice(result, MAX_IMAGE_COUNT));
    } catch (err) {
      console.error("image processing failed", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div 
      className="fade-tab" 
style={{
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "flex-start",
  height: 640,
  flex: "0 0 auto",
  overflow: "hidden",
}}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
{dragActive && images.length < MAX_IMAGE_COUNT && (
  <div
    style={{
      position: "absolute",
      inset: 0,
      zIndex: 50,
      background: "rgba(250, 250, 248, 0.85)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 14,
      fontWeight: 500,
      color: COLOR.text,
    }}
  >
    Drop images here
  </div>
)}

<div
  onMouseEnter={() => setImageHover(true)}
  onMouseLeave={() => setImageHover(false)}

style={{
  position: "relative",
  width: "100%",
  height: 415,
  background: COLOR.bg2,
  borderRadius: 6,
  overflow: "hidden",
  flexShrink: 0,
  marginBottom: 0,
}}
>
  {images[previewIndex] ? (
    <img
      src={images[previewIndex]}
      alt=""
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        willChange: "transform",
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
      }}
    />
  ) : (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: COLOR.subtext,
        fontSize: 12,
      }}
    >
      {busy ? "..." : ""}
    </div>
  )}

{/* 이전 */}
{previewIndex > 0 && (
  <button
    type="button"
    onClick={prevImage}
    style={{
      position: "absolute",
      left: 10,
      top: "50%",
      transform: imageHover
  ? "translateY(-50%) scale(1)"
  : "translateY(-50%) scale(1)",
      width: 40,
      height: 43,
      borderRadius: "50%",
      border: "none",
      background: "rgba(0, 0, 0, 0.22)",
      backdropFilter: "blur(6px)",
      color: "#ffffffd0",
      cursor: "pointer",
      opacity: imageHover ? 1 : 0,
      transition: "opacity .2s ease, transform .2s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2,
    }}
  >
    <ChevronLeft size={20} strokeWidth={2.2} style={{ transform: "translateX(-1px)" }}/>
  </button>
)}

{/* 다음 */}
{previewIndex < images.length - 1 && (
  <button
    type="button"
    onClick={nextImage}
    style={{
      position: "absolute",
      right: 10,
      top: "50%",
      transform: imageHover
  ? "translateY(-50%) scale(1)"
  : "translateY(-50%) scale(1)",
      width: 40,
      height: 43,
      borderRadius: "50%",
      border: "none",
      background: "rgba(0, 0, 0, 0.22)",
      backdropFilter: "blur(6px)",
      color: "#ffffffd0",
      cursor: "pointer",
      opacity: imageHover ? 1 : 0,
      transition: "opacity .2s ease, transform .2s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2,
    }}
  >
    <ChevronRight size={20} strokeWidth={2.2} style={{ transform: "translateX(1px)" }}/>
  </button>
)}
</div>

<div
  style={{
    textAlign: "center",
    fontSize: 11,
    letterSpacing: 0.5,
    color: COLOR.subtext,
    marginTop: 12,
    marginBottom: 12,
    lineHeight: 1,
    flexShrink: 0,
  }}
>
  {images.length > 0
    ? `${previewIndex + 1} / ${images.length}`
    : "0 / 0"}
</div>

<div style={{
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: 6,
  paddingTop: 0,
  paddingBottom: 16,
  flexShrink: 0,
}}>

{visibleImages.map((src, localIdx) => {
  const idx = thumbStart + localIdx;

  return (
<div
  key={idx}
  onMouseEnter={() => setHoverThumbIndex(idx)}
  onMouseLeave={() => setHoverThumbIndex(null)}
  style={{
    position: "relative",
    overflow: "hidden",
    flex: "0 0 auto",
    width: 42,
    height: 54,
  }}
>
      <img
        src={src}
        alt=""
        onClick={() => setMain(idx)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: 4,
          cursor: "pointer",
          opacity: idx === previewIndex ? 1 : 0.45,
          transform: idx === previewIndex
            ? "scale(1.05)"
            : "scale(1)",
          transition:
          "opacity .18s ease, transform .18s ease, box-shadow .18s ease",
          border: "1px solid transparent",
          boxShadow: idx === previewIndex
            ? "0 4px 12px rgba(0, 0, 0, 0.12)"
            : "none",
        }}/>

<button
  type="button"
  onClick={() => remove(idx)}
  style={{
    position: "absolute",
    top: 3,
    right: 2,
    width: 16,
    height: 16,
    padding: 0,
    border: "none",
    background: "transparent",
    color: "rgba(255, 255, 255, 0.98)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    opacity: hoverThumbIndex === idx ? 1 : 0,
    transition: "opacity .15s ease",
    zIndex: 3,
    textShadow: "0 1px 3px rgba(0,0,0,.65)",
  }}
>
  <X size={10} strokeWidth={3} />
</button>

    </div>
  );
})}

{images.length < MAX_IMAGE_COUNT && (
  <button
    type="button"
    onClick={() => inputRef.current?.click()}
    style={{
      flex: "0 0 auto",
      width: 40,
      height: 50,
      border: `1px dashed ${COLOR.border}`,
      borderRadius: 4,
      background: COLOR.bg,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Plus size={16} color={COLOR.subtext} />
  </button>
)}

  <input
    ref={inputRef}
    type="file"
    accept="image/*"
    multiple
    onChange={handleFiles}
    style={{ display: "none" }}
  />
</div>
{notice && <div style={{ marginTop: 8, fontSize: 12, color: COLOR.subtext, textAlign: "center" }}>{notice}</div>}

    </div>
  );
}
