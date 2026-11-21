import React, { useState, useEffect, useRef } from "react";
import {
  X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
} from "lucide-react";
import type { ReferenceImage } from "../types/reference";

/* ---------------------------------------------------------
   Reference Board Components (Mood Board with dnd-kit)
--------------------------------------------------------- */
interface ImageViewerProps {
  images: ReferenceImage[];
  initialIndex: number;
  onClose: () => void;
}
export function ImageViewer({ images, initialIndex, onClose }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const dragStart = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") setCurrentIndex((i) => Math.max(i - 1, 0));
      else if (e.key === "ArrowRight") setCurrentIndex((i) => Math.min(i + 1, images.length - 1));
      else if (e.key === "Home") setCurrentIndex(0);
      else if (e.key === "End") setCurrentIndex(images.length - 1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, images.length]);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [currentIndex]);

  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentIndex(i => Math.max(i - 1, 0)); };
  const next = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentIndex(i => Math.min(i + 1, images.length - 1)); };

  const handleWheel = (e: React.WheelEvent) => {
    const zoomDelta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoom(z => {
      const newZoom = Math.max(0.5, Math.min(z + zoomDelta, 5));
      if (newZoom <= 1) setPan({ x: 0, y: 0 });
      return newZoom;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      hasDragged.current = false;
      dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      hasDragged.current = true;
      setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (zoom > 1) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else {
      setZoom(2);
    }
  };

  const handleContainerClick = () => {
    if (hasDragged.current) {
      hasDragged.current = false;
      return;
    }
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999, background: "rgba(17,17,17,0.92)",
      display: "flex", alignItems: "center", justifyContent: "center", animation: "simpleFade 0.2s ease"
    }}>
      <div style={{ position: "absolute", top: 20, right: 24, display: "flex", alignItems: "center", gap: 20, zIndex: 10000 }}>
        <div style={{ color: "#fff", fontSize: 13, letterSpacing: 1, opacity: 0.9, fontWeight: 500 }}>
          {currentIndex + 1} / {images.length}
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <button onClick={() => setZoom(z => Math.min(z + 0.5, 5))} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <ZoomIn color="#fff" size={24} opacity={0.9} />
          </button>
          <button onClick={() => {
            setZoom(z => {
              const n = Math.max(z - 0.5, 0.5);
              if (n <= 1) setPan({x: 0, y: 0});
              return n;
            });
          }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <ZoomOut color="#fff" size={24} opacity={0.9} />
          </button>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", marginLeft: 8, display: "flex", alignItems: "center" }}>
            <X color="#fff" size={28} opacity={0.9} />
          </button>
        </div>
      </div>
      
      {currentIndex > 0 && (
        <button onClick={prev} style={{ position: "absolute", left: 24, background: "none", border: "none", cursor: "pointer", zIndex: 10000, display: "flex", alignItems: "center" }}>
          <ChevronLeft color="#fff" size={40} opacity={0.9} />
        </button>
      )}
      
      {currentIndex < images.length - 1 && (
        <button onClick={next} style={{ position: "absolute", right: 24, background: "none", border: "none", cursor: "pointer", zIndex: 10000, display: "flex", alignItems: "center" }}>
          <ChevronRight color="#fff" size={40} opacity={0.9} />
        </button>
      )}

      <div 
        style={{ 
          width: "100%", height: "100%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
          cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default"
        }} 
        onClick={handleContainerClick}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          key={images[currentIndex].id}
          src={images[currentIndex].image}
          alt=""
          onClick={e => {
            if (hasDragged.current) {
              hasDragged.current = false;
              e.stopPropagation();
              return;
            }
            e.stopPropagation();
          }}
          onDoubleClick={handleDoubleClick}
          onDragStart={e => e.preventDefault()}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, 
            transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
            maxHeight: "85vh", maxWidth: "85vw", objectFit: "contain",
            boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
            animation: "simpleFade 0.3s ease"
          }}
        />
      </div>
    </div>
  );
}
