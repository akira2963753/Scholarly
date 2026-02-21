"use client";

import { Allotment } from "allotment";
import "allotment/dist/style.css";
import type { ReactNode } from "react";

interface Props {
  left: ReactNode;
  right: ReactNode;
}

export function AllotmentLayout({ left, right }: Props) {
  return (
    <Allotment defaultSizes={[60, 40]}>
      <Allotment.Pane minSize={360}>
        <div style={{ height: "100%", overflow: "hidden", background: "var(--surface-2)" }}>
          {left}
        </div>
      </Allotment.Pane>
      <Allotment.Pane minSize={280}>
        <div style={{ height: "100%", overflow: "hidden", background: "var(--surface)" }}>
          {right}
        </div>
      </Allotment.Pane>
    </Allotment>
  );
}
