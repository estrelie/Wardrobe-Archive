import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import type { Category, CategoryGroup } from "../types/common";
import { CATEGORY_GROUPS, CATEGORY_GROUP_LABELS, COLOR } from "../constants/design";

interface CategoryPickerProps {
  value: Category | string;
  onChange: (category: Category) => void;
}

export function CategoryPicker({
  value,
  onChange,
}: CategoryPickerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const currentGroup =
    (Object.entries(CATEGORY_GROUPS).find(([, items]) =>
      items.includes(value as Category)
    )?.[0] as CategoryGroup) ?? "Tops";

  const [group, setGroup] = useState<CategoryGroup>(currentGroup);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const next =
      (Object.entries(CATEGORY_GROUPS).find(([, items]) =>
        items.includes(value as Category)
      )?.[0] as CategoryGroup) ?? "Tops";
    setGroup(next);
  }, [value]);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

return (
  <div
    ref={wrapperRef}
    style={{
      position: "relative",
      width: "100%",
    }}
  >
    {/* Selected */}
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      style={{
        width: "100%",
        height: 38,
        padding: "0 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        border: `1px solid ${COLOR.border}`,
        borderRadius: 8,
        background: COLOR.bg,
        cursor: "pointer",
        transition: "all .15s",
      }}
    >
      <span
        style={{
          fontSize: 13,
          color: COLOR.text,
          fontWeight: 400,
        }}
      >
        {value}
      </span>

      <ChevronDown
        size={16}
        color={COLOR.subtext}
        style={{
          transition: "transform .18s",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
        }}
      />
    </button>

    {open && (
      <div
        style={{
          position: "absolute",
          transition: "box-shadow .18s ease, border-color .18s ease",
          top: 42,
          left: 0,
          right: 0,
          zIndex: 100,

          background: COLOR.bg,
          border: "1px solid #ECECEC",
          borderRadius: 10,
          overflow: "hidden",
          boxShadow:
            "0 6px 18px rgba(0,0,0,.05)",
        }}
      >
        {/* Group */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            padding: "10px 14px 7px",
            borderBottom: "1px solid #F3F3F3",
          }}
        >
          {(Object.keys(
            CATEGORY_GROUPS
          ) as CategoryGroup[]).map((g) => {
            const active = group === g;

            return (
<button
  key={g}
  type="button"
  onClick={() => setGroup(g)}
  onMouseEnter={(e) => {
    if (!active) {
      e.currentTarget.style.color = COLOR.text;
    }
  }}
  onMouseLeave={(e) => {
    if (!active) {
      e.currentTarget.style.color = COLOR.subtext;
    }
  }}
  style={{
    background: "transparent",
    border: "none",
    padding: "2px 0",
    fontSize: 12.5,
    fontWeight: active ? 500 : 400,
    color: active ? COLOR.text : COLOR.subtext,
    cursor: "pointer",
    transition: "color .12s",
    borderBottom: active
      ? `1.5px solid ${COLOR.text}`
      : "1.5px solid transparent",
  }}
>
  {CATEGORY_GROUP_LABELS[g]}
</button>
            );
          })}
        </div>

        {/* Category */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            padding: "8px 12px 10px",
            transition: "all .18s ease",
          }}
        >
          {CATEGORY_GROUPS[group].map((category) => {
            const active = value === category;

            return (
              <button
                key={category}
                type="button"
                onClick={() => {
                  onChange(category);
                  setOpen(false);
                }}
onMouseEnter={(e) => {
  if (!active) {
    e.currentTarget.style.color = COLOR.text;
    e.currentTarget.style.background = "#F7F7F7";
    e.currentTarget.style.borderColor = "#E5E5E5";
  }
}}
onMouseLeave={(e) => {
  if (!active) {
    e.currentTarget.style.color = COLOR.subtext;
    e.currentTarget.style.background = COLOR.bg;
    e.currentTarget.style.borderColor = COLOR.border;
  }
}}
style={{
  minWidth: 94,
  height: 32,
  padding: "0 14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 6,
  cursor: "pointer",
  border: `1px solid ${
    active ? "#D9D9D9" : COLOR.border
  }`,
  background: active
    ? "#ECECEC"
    : COLOR.bg,
  color: active
    ? COLOR.text
    : COLOR.subtext,
  fontSize: 12,
  fontWeight: 400,
  whiteSpace: "nowrap",
  transition: "background .12s, border-color .12s, color .12s",
}}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>
    )}
  </div>
);
}
