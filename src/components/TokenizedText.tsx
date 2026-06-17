import { useMemo } from "react";
import type { TokenSegment } from "../lib/tokenizer";

// Soft, evenly-spaced background tints cycled per token. Chosen for legibility
// on a dark surface; deliberately muted so adjacent tokens stay distinct
// without the page looking like confetti.
const TINTS = [
  "rgba(59, 158, 255, 0.28)",
  "rgba(48, 164, 108, 0.28)",
  "rgba(229, 77, 46, 0.26)",
  "rgba(145, 92, 246, 0.28)",
  "rgba(255, 178, 36, 0.26)",
  "rgba(0, 184, 217, 0.26)",
];

interface Props {
  segments: TokenSegment[];
  view: "text" | "ids";
}

export default function TokenizedText({ segments, view }: Props) {
  const content = useMemo(() => {
    if (view === "ids") {
      return (
        <span className="token-ids">[{segments.map((s) => s.id).join(", ")}]</span>
      );
    }

    return segments.map((seg, i) => {
      // Preserve newlines as <br>; the container uses white-space: pre-wrap so
      // spaces inside a token stay visible under its tint.
      const display = seg.text
        .split("\n")
        .flatMap((part, idx) =>
          idx === 0 ? [part] : [<br key={`br-${i}-${idx}`} />, part]
        );

      return (
        <span
          key={i}
          className="token-chip"
          style={{ backgroundColor: TINTS[i % TINTS.length] }}
          title={`Token ID: ${seg.id}`}
        >
          {display}
        </span>
      );
    });
  }, [segments, view]);

  return <div className="token-output">{content}</div>;
}
