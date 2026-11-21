import { useState, useMemo } from "react";
import { X } from "lucide-react";
import type { Material, MaterialLibraryItem } from "../types/material";
import { COLOR } from "../constants/design";
import { TextInput, addBtnStyle } from "./common";

interface MaterialsEditorProps {
  materials: Material[];
  onChange: (m: Material[]) => void;
  materialLibrary: MaterialLibraryItem[];
  onAddMaterialToLibrary: (m: MaterialLibraryItem) => void;
  materialFreq: Record<string, number>;
}
export function MaterialsEditor({ materials, onChange, materialLibrary, onAddMaterialToLibrary, materialFreq }: MaterialsEditorProps) {
  const [name, setName] = useState("");
  const [percent, setPercent] = useState("");
  const [focused, setFocused] = useState(false);

  const suggestions = useMemo(() => {
    const q = name.trim().toLowerCase();
    let pool = [...materialLibrary].sort((a, b) => (materialFreq[b.name] || 0) - (materialFreq[a.name] || 0));
    
    if (q) {
      pool = pool.filter(m => m.name.toLowerCase().includes(q) || (m.aliases || []).some(a => a.toLowerCase().includes(q)));
    }
    return pool.slice(0, 8);
  }, [name, materialLibrary, materialFreq]);

  const add = (overrideName?: string) => {
    const inputStr = typeof overrideName === 'string' ? overrideName : name;
    const n = inputStr.trim();
    if (!n) return;
    
    const lower = n.toLowerCase();
    let resolvedName = n;
    const match = materialLibrary.find(m => m.name.toLowerCase() === lower || (m.aliases || []).some(a => a.toLowerCase() === lower));
    
    if (match) {
      resolvedName = match.name;
    } else {
      const newMat = { id: crypto.randomUUID(), name: n, aliases: [] };
      onAddMaterialToLibrary(newMat);
    }

    if (materials.some(m => m.name === resolvedName)) {
       setName("");
       setPercent("");
       return;
    }

    onChange([...materials, { name: resolvedName, percent: percent === "" ? "" : Number(percent) }]);
    setName(""); setPercent("");
  };

  const remove = (idx: number) => onChange(materials.filter((_, i) => i !== idx));
  const total = materials.reduce((s, m) => s + (Number(m.percent) || 0), 0);

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {materials.map((m, i) => (
          <span key={i} style={{
            fontSize: 12.5, padding: "5px 10px", borderRadius: 5, background: COLOR.bg2,
            border: `1px solid ${COLOR.border}`, display: "flex", alignItems: "center", gap: 6,
          }}>
            {m.name} {m.percent !== "" ? `${m.percent}%` : ""}
            <X size={11} style={{ cursor: "pointer" }} onClick={() => remove(i)} />
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, position: "relative" }}>
        <div style={{ flex: 2, position: "relative" }}>
          <TextInput value={name} onChange={(e) => setName(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Material (e.g. Cotton)" />
          
          {focused && suggestions.length > 0 && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 30,
              background: COLOR.bg, border: `1px solid ${COLOR.border}`, borderRadius: 6,
              boxShadow: "0 8px 20px rgba(0,0,0,0.08)", maxHeight: 180, overflowY: "auto",
            }}>
              {suggestions.map((b) => (
                <div key={b.id} 
                  onMouseDown={(e) => e.preventDefault()} 
                  onClick={() => { add(b.name); setFocused(false); }} 
                  style={{ padding: "8px 10px", fontSize: 13, cursor: "pointer", display: "flex", justifyContent: "space-between" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = COLOR.bg2}
                  onMouseLeave={(e) => e.currentTarget.style.background = COLOR.bg}>
                  <span>{b.name}</span>
                  {materialFreq[b.name] > 0 && <span style={{ fontSize: 11, color: COLOR.subtext }}>{materialFreq[b.name]}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        <TextInput type="number" value={percent} onChange={(e) => setPercent(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()} placeholder="%" style={{ flex: 1 }} />
        <button type="button" onClick={() => add()} style={{ ...addBtnStyle, padding: "9px 12px" }}>Add</button>
      </div>
      {materials.length > 0 && total !== 100 && (
        <div style={{ fontSize: 11, color: "#B3542E", marginTop: 6 }}>
          Total {total}%
        </div>
      )}
    </div>
  );
}
