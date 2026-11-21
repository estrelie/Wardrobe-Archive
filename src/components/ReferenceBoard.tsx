import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Image as ImageIcon } from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, DragOverlay, defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReferenceImage } from "../types/reference";
import { COLOR } from "../constants/design";
import { storeDelete, storeListLoad, storeSet } from "../lib/storage";
import { fileToCompressedDataUrl } from "../lib/image";
import { ImageViewer } from "./ImageViewer";

interface ReferenceCardProps {
  refItem: ReferenceImage;
  index: number;
  updateMemo: (id: string, memo: string) => void;
  remove: (id: string) => void;
  onClick: (index: number) => void;
  setNodeRef?: (node: HTMLElement | null) => void;
  attributes?: any;
  listeners?: any;
  style?: React.CSSProperties;
  isDragging?: boolean;
  isOverlay?: boolean;
  maxImageHeight?: number;
}
const ReferenceCard = React.memo(({
  refItem, index, remove, onClick, setNodeRef, 
  attributes, listeners, style, isDragging, isOverlay, maxImageHeight = 200}
  : ReferenceCardProps) => {
  const [hover, setHover] = useState(false);

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        breakInside: "avoid", marginBottom: 16, position: "relative",
        borderRadius: 8, transition: style?.transition || "all 0.2s ease", paddingBottom: 2,
        opacity: isDragging ? 0.3 : 1,
        cursor: isOverlay ? "grabbing" : "grab",
        transform: isOverlay ? "scale(1.02)" : style?.transform,
        boxShadow: isOverlay ? "0 24px 64px rgba(0,0,0,0.15)" : "none",
        zIndex: isOverlay ? 999 : "auto"
      }}
      onMouseEnter={() => !isDragging && !isOverlay && setHover(true)}
      onMouseLeave={() => {setHover(false);}}
      {...attributes}
      {...listeners}
    >
      <div style={{ position: "relative", borderRadius: 6, overflow: "hidden" }}>
        <img 
          src={refItem.image} 
          onClick={() => onClick(index)} 
          alt=""
          style={{
  width: "100%",
  display: "block",
  maxHeight: maxImageHeight,
  objectFit: "cover",
  cursor: "zoom-in",
  transition: "transform 0.2s ease",
  transform:
    hover && !isDragging && !isOverlay
      ? "scale(1.01)"
      : "scale(1)",
}}
        />
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); remove(refItem.id); }}
          style={{
            position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: "50%",
            background: "rgba(255,255,255,0.9)", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: hover && !isDragging && !isOverlay ? 1 : 0, transition: "opacity 0.2s"
          }}
        >
          <X size={12} color={COLOR.text} />
        </button>
      </div>
    </div>
  );
});

interface SortableReferenceCardProps extends ReferenceCardProps {}
const SortableReferenceCard = React.memo((props: SortableReferenceCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.refItem.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <ReferenceCard
      {...props}
      setNodeRef={setNodeRef}
      attributes={attributes}
      listeners={listeners}
      style={style}
      isDragging={isDragging}
    />
  );
});

interface ReferenceManagerProps {
  itemId: string;
}
export const ReferenceManager = React.memo(({ itemId }: ReferenceManagerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const MAX_REFERENCE_COUNT = 6;
  const [references, setReferences] = useState<ReferenceImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const dragCounter = useRef(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  useEffect(() => {
    (async () => {
      const all = await storeListLoad<ReferenceImage>("reference:");
      const filtered = all
        .filter(r => r.itemId === itemId)
        .sort((a,b) => a.order - b.order);
      setReferences(filtered);
      setLoading(false);
    })();
  }, [itemId]);

const createRefs = async (files: File[]) => {
  const available = Math.max(
    0,
    MAX_REFERENCE_COUNT - references.length
  );
  if (available === 0) return [];
  const targetFiles = files.slice(0, available);
  const compressed = await Promise.all(
    targetFiles.map((f) =>
      fileToCompressedDataUrl(f, 1000, 0.8)
    )
  );
  return compressed.map((image, idx) => ({
    id: crypto.randomUUID(),
    itemId,
    image,
    memo: "",
    order: references.length + idx,
    createdAt: Date.now(),
  }));
};

  useEffect(() => {
  
const handlePaste = async (e: ClipboardEvent) => {
  const target = e.target as HTMLElement;
  if (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA"
  ) {
    return;
  }
  const items = e.clipboardData?.items;
  if (!items) return;
  const files: File[] = [];
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.startsWith("image")) {
      const file = items[i].getAsFile();
      if (file) files.push(file);
    }
  }
  if (
    files.length === 0 ||
    references.length >= MAX_REFERENCE_COUNT
  ) {
    return;
  }
  try {
    const newRefs = await createRefs(files);
    const next = [...references, ...newRefs].map((r, i) => ({
      ...r,
      order: i,
    }));
    setReferences(next);
    for (const r of newRefs) {
      await storeSet(
        `reference:${r.id}`,
        JSON.stringify(r)
      );
    }
  } catch (err) {
    console.error(err);
  }
};

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [references.length, itemId]); 

const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (references.length >= MAX_REFERENCE_COUNT) {
    e.target.value = "";
    return;
  }
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  try {
    const newRefs = await createRefs(files);
    const next = [...references, ...newRefs].map((r, i) => ({
      ...r,
      order: i,
    }));
    setReferences(next);
    for (const r of newRefs) {
      await storeSet(`reference:${r.id}`, JSON.stringify(r));
    }
  } catch (err) {
    console.error(err);
  }
  e.target.value = "";
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

const handleContainerDrop = async (
  e: React.DragEvent<HTMLDivElement>
) => {
  e.preventDefault();
  e.stopPropagation();
  setDragActive(false);
  dragCounter.current = 0;
  const files = Array.from(e.dataTransfer.files).filter((f) =>
    f.type.startsWith("image/")
  );
  if (references.length >= MAX_REFERENCE_COUNT) {
    return;
  }
  if (!files.length) {
    return;
  }
  try {
    const newRefs = await createRefs(files);
    const next = [...references, ...newRefs].map((r, i) => ({
      ...r,
      order: i,
    }));
    setReferences(next);
    for (const r of newRefs) {
      await storeSet(
        `reference:${r.id}`,
        JSON.stringify(r)
      );
    }
  } catch (err) {
    console.error(err);
  }
};

  const updateMemo = useCallback((id: string, memo: string) => {
    setReferences(prev => prev.map(r => r.id === id ? { ...r, memo } : r));
  }, []);

const remove = useCallback(async (id: string) => {
  const next = references
    .filter((r) => r.id !== id)
    .map((r, i) => ({
      ...r,
      order: i,
    }));
  setReferences(next);
  await storeDelete(`reference:${id}`);
  for (const r of next) {
    await storeSet(
      `reference:${r.id}`,
      JSON.stringify(r)
    );
  }
}, [references]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);
const handleDragEnd = useCallback(async (event: DragEndEvent) => {
  const { active, over } = event;
  if (over && active.id !== over.id) {
    const oldIndex = references.findIndex(
      (i) => i.id === active.id
    );
    const newIndex = references.findIndex(
      (i) => i.id === over.id
    );
    const next = arrayMove(
      references,
      oldIndex,
      newIndex
    ).map((r, i) => ({
      ...r,
      order: i,
    }));
    setReferences(next);
    for (const r of next) {
      await storeSet(
        `reference:${r.id}`,
        JSON.stringify(r)
      );
    }
  }
  setActiveId(null);
}, [references]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  if (loading) {
    return <div style={{ fontSize: 13, color: COLOR.subtext, padding: 20 }}>...</div>;
  }

  const activeRefItem = references.find(r => r.id === activeId);

  return (
    <div 
      className="fade-tab"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleContainerDrop}
      style={{
  position: "relative",
  height: 640,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
}}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
<div
style={{
  position: "relative",
  flex: 1,
  overflowY: "auto",
  columnCount: 2,
  columnGap: 16,
  paddingRight: 2,
}}
>
     {dragActive && references.length < MAX_REFERENCE_COUNT && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 1000,
          background: "rgba(250, 250, 248, 0.85)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 500, color: COLOR.text
        }}>
          Drop images here
        </div>
      )}

  <SortableContext
    items={references.map((r) => r.id)}
    strategy={rectSortingStrategy}
  >
    {references.map((ref, idx) => (
      <SortableReferenceCard
        key={ref.id}
        refItem={ref}
        index={idx}
        updateMemo={updateMemo}
        remove={remove}
        onClick={setViewerIndex}
      />
    ))}
  </SortableContext>

  {references.length < MAX_REFERENCE_COUNT && (
    <div
      onClick={() => inputRef.current?.click()}
      style={{
        breakInside: "avoid",
        marginBottom: 16,
        cursor: "pointer",
        height: 120,
        background: COLOR.bg2,
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `1px dashed ${COLOR.border}`,
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = COLOR.border;
        e.currentTarget.style.borderColor = "#fcfcfcc4";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#fcfcfc";
        e.currentTarget.style.borderColor = "#fcfcfc";
      }}
    >
      <ImageIcon
        size={20}
        color={"#0000003c"}
      />
    </div>
  )}
</div>

        <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.4" } } }) }}>
          {activeId && activeRefItem ? (
            <ReferenceCard
              refItem={activeRefItem}
              index={references.findIndex(r => r.id === activeId)}
              updateMemo={updateMemo}
              remove={remove}
              onClick={setViewerIndex}
              isOverlay={true}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
      <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: "none" }} />
      
      {viewerIndex !== null && (
        <ImageViewer 
          images={references} 
          initialIndex={viewerIndex} 
          onClose={() => setViewerIndex(null)} 
        />
      )}
    </div>
  );
});
