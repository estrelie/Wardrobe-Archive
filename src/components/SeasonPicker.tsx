import type { Season } from "../types/common";
import { COLOR, SEASONS } from "../constants/design";

interface SeasonPickerProps {
  value: Season[];
  onChange: (val: Season[]) => void;
}

export function SeasonPicker({ value, onChange }: SeasonPickerProps) {
  const toggle = (s: Season) => {
    const set = new Set(value);
    set.has(s) ? set.delete(s) : set.add(s);
    onChange(Array.from(set));
  };
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      {SEASONS.map((s) => (
<button
  key={s}
  type="button"
  onClick={() => toggle(s)}
onMouseEnter={(e) => {
  if (!value.includes(s)) {
    e.currentTarget.style.color = COLOR.text;
  }
}}
onMouseLeave={(e) => {
  if (!value.includes(s)) {
    e.currentTarget.style.color = COLOR.subtext;
  }
}}
style={{
  padding: "7px 12px",
  fontSize: 12.5,
  borderRadius: 6,
  cursor: "pointer",
  background: value.includes(s) ? "#ECECEC" : COLOR.bg,
  border: `1px solid ${value.includes(s) ? "#D9D9D9" : COLOR.border}`,
  color: value.includes(s) ? COLOR.text : COLOR.subtext,
  transition: "all .10s",
}}
>
  {s}
</button>
      ))}
    </div>
  );
}
