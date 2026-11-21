import {
  useState, useMemo, useEffect, useRef, useCallback,
} from "react";

/* ---------------------------------------------------------
   useAutoSave Hook (with beforeunload & force unmount save)
--------------------------------------------------------- */
export function useAutoSave<T>(
  originalData: T, 
  onSave: (dataToSave: T) => void, 
  delay: number = 700, 
  keyExtractor: (data: T) => string
) {
  const [draft, setDraft] = useState<T>(originalData);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const lastSavedData = useRef<T>(originalData);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const currentKey = keyExtractor(originalData);
  const prevKey = useRef(currentKey);

  useEffect(() => {
    if (currentKey !== prevKey.current) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setDraft(originalData);
      lastSavedData.current = originalData;
      setStatus("idle");
      prevKey.current = currentKey;
    }
  }, [currentKey, originalData]);

  const isDirty = useMemo(() => {
    return JSON.stringify(draft) !== JSON.stringify(lastSavedData.current);
  }, [draft]);

  // Unsaved Protection: Window close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty || status === "saving") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, status]);

  const triggerSave = useCallback((dataToSave: T) => {
    setStatus("saving");
    onSaveRef.current(dataToSave);
    lastSavedData.current = dataToSave;
    setStatus("saved");

    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    statusTimeoutRef.current = setTimeout(() => setStatus("idle"), 3000);
  }, []);

  useEffect(() => {
    if (!isDirty) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      triggerSave(draft);
      timeoutRef.current = null;
    }, delay);

    return () => {
      // Synchronous save on unmount if pending
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        triggerSave(draft);
        timeoutRef.current = null;
      }
    };
  }, [draft, isDirty, delay, triggerSave]);

  const forceSave = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (JSON.stringify(draft) !== JSON.stringify(lastSavedData.current)) {
      triggerSave(draft);
    }
  }, [draft, triggerSave]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        forceSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [forceSave]);

  return { draft, setDraft, status, forceSave };
}
