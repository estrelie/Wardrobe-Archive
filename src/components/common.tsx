import React from "react";
import { X } from "lucide-react";
import { COLOR } from "../constants/design";

/* ---------------------------------------------------------
   Building blocks
--------------------------------------------------------- */
interface IconBtnProps {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}
export function IconBtn({ children, onClick, active }: IconBtnProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "7px 11px", fontSize: 13, fontWeight: 500,
        color: active ? COLOR.text : COLOR.subtext,
        background: active ? COLOR.bg2 : "transparent",
        border: `1px solid ${active ? COLOR.border : "transparent"}`,
        borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = COLOR.bg2; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      {children}
    </button>
  );
}

interface ActiveChipProps {
  label: string;
  onRemove: () => void;
  icon?: React.ReactNode;
}
export function ActiveChip({ label, onRemove, icon }: ActiveChipProps) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: 29, gap: 8, padding: "0px 14px",
      background: COLOR.bg2, border: `1px solid ${COLOR.border}`, borderRadius: 20,
      fontSize: 12.5, color: COLOR.text, animation: "simpleFade 0.2s ease"
    }}>
      {icon}
      {label}
      <button onClick={onRemove} style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "none", border: "none", padding: 0, cursor: "pointer", color: COLOR.subtext
      }}>
        <X size={11} />
      </button>
    </div>
  );
}

interface FieldProps {
  label: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  horizontal?: boolean;
}

export function Field({
  label,
  style,
  children,
  horizontal = false,
}: FieldProps) {
  if (horizontal) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "90px 1fr",
          alignItems: "center",
          columnGap: 14,
          marginBottom: 16,
          ...style,
        }}
      >
<div
  style={{
    fontSize: 12,
    fontWeight: 500,
    color: "#757575",
    textTransform: "lowercase",
    paddingLeft: 5,
    display: "flex",
    alignItems: "center",
    height: 40,
    textAlign: "left",
  }}
>
  {label}
</div>
<div
  style={{
    paddingRight: 1,
  }}
>
  {children}
</div>
      </div>
    );
  }

  return (
    <div
      style={{
        marginBottom: 20,
        ...style,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "#757575",
          letterSpacing: "0.02em",
          textTransform: "lowercase",
          marginBottom: 7,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}


export const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "9px 10px",
  fontSize: 14, color: COLOR.text, background: COLOR.bg,
  border: `1px solid ${COLOR.border}`, borderRadius: 6, outline: "none",
  fontFamily: "inherit",
};

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export function TextInput(props: TextInputProps) {
  return (
    <>
      <style>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
          appearance: textfield;
        }
      `}</style>
      <input
        {...props}
        style={{
          ...inputStyle,
          ...(props.style || {}),
        }}
      />
    </>
  );
}

export function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  minRows = 4,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  minRows?: number;
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const resize = React.useCallback(() => {
    if (!ref.current) return;
    ref.current.style.height = "0px";
    ref.current.style.height = `${ref.current.scrollHeight}px`;
  }, []);
  React.useLayoutEffect(() => {
    resize();
  }, [value, resize]);

  return (
    <textarea
      ref={ref}
      value={value}
      placeholder={placeholder}
      rows={minRows}
      onChange={(e) => {
        onChange(e);
        resize();
      }}
      style={{
        width: "100%",
        resize: "none",
        overflow: "hidden",
        border: `1px solid ${COLOR.border}`,
        borderRadius: 8,
        padding: "12px 14px",
        fontSize: 14,
        lineHeight: 1.5,
        fontFamily: "inherit",
        color: COLOR.text,
        background: COLOR.bg,
        outline: "none",
        boxSizing: "border-box",
      }}
    />
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}
export function Select(props: SelectProps) {
  return <select {...props} style={{ ...inputStyle, ...(props.style || {}) }}>{props.children}</select>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 450,
        color: COLOR.text,
        margin: "20px 0 20px",
      }}
    >
      {children}
    </div>
  );
}

export function StatBox({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
        border: `1px solid ${COLOR.border}`,
        borderRadius: 6,
        padding: "14px 12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ fontSize: 11, color: COLOR.subtext, marginBottom: 10, textAlign: "center", }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6, }}>
        <div style={{ fontSize: 15, fontWeight: 430, color: COLOR.text, }}>
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 11.5, color: COLOR.subtext, }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}
export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 26 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 500, color: COLOR.text, marginBottom: 6 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13.5, color: COLOR.subtext }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ padding: "60px 0", textAlign: "center", color: COLOR.subtext, fontSize: 13.5, gridColumn: "1 / -1" }}>
      {text}
    </div>
  );
}

export const addBtnStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", fontSize: 13,
  border: `1px solid ${COLOR.border}`, borderRadius: 6, background: COLOR.bg, cursor: "pointer",
};


interface MediaTabsProps {
  active: string;
  onChange: (tab: string) => void;
}
export function MediaTabs({ active, onChange }: MediaTabsProps) {
  return (
    <div style={{ display: "flex", gap: 16, borderBottom: `1px solid ${COLOR.border}`, marginBottom: 16 }}>
      {["Photos", "Reference"].map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab.toLowerCase())}
          style={{
            background: "none", border: "none", padding: "0 4px 8px", cursor: "pointer",
            fontSize: 13, fontWeight: active === tab.toLowerCase() ? 500 : 400,
            color: active === tab.toLowerCase() ? COLOR.text : COLOR.subtext,
            borderBottom: active === tab.toLowerCase() ? `2px solid ${COLOR.text}` : "2px solid transparent",
            marginBottom: "-1px",
            textTransform: "capitalize",
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
