"use client";

import type { SvgSelection } from "@/hooks/useSvgHighlightSelection";
import type { HighlightColor } from "@/types/highlight";

const COLORS: { color: HighlightColor; label: string; bg: string; border: string }[] = [
  { color: "yellow", label: "Key",      bg: "rgba(250,220,153,0.95)", border: "#d4a83a" },
  { color: "red",    label: "Quotable", bg: "rgba(250,195,195,0.95)", border: "#cc7a7a" },
  { color: "blue",   label: "Inspire",  bg: "rgba(195,209,250,0.95)", border: "#7a96cc" },
];

interface Props {
  selection: SvgSelection;
  onColor: (color: HighlightColor) => void;
}

/**
 * Floating colour-picker shown after the user selects text on the SVG overlay.
 * Positioned with `position: fixed` at the screen coordinates provided by
 * useSvgHighlightSelection. `onMouseDown` uses preventDefault so that clicking
 * a button doesn't collapse the browser's text selection before the onClick fires.
 */
export function HighlightSelectionMenu({ selection, onColor }: Props) {
  return (
    <div
      className="selection-tooltip"
      style={{
        position: "fixed",
        left: selection.screenCenterX,
        top: selection.screenTopY - 46,
        transform: "translateX(-50%)",
        zIndex: 1000,
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {COLORS.map(({ color, label, bg, border }) => (
        <button
          key={color}
          onClick={() => onColor(color)}
          style={{
            background: bg,
            border: `1.5px solid ${border}`,
            borderRadius: "4px",
            padding: "3px 9px",
            fontSize: "11.5px",
            fontWeight: 600,
            cursor: "pointer",
            color: "#1a1a1a",
            fontFamily: "inherit",
            transition: "transform 0.1s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
