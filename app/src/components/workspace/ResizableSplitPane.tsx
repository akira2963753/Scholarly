"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

// Dynamically import the Allotment wrapper to avoid SSR DOM issues
const AllotmentLayout = dynamic(
  () => import("./AllotmentLayout").then((m) => m.AllotmentLayout),
  { ssr: false }
);

interface Props {
  left: ReactNode;
  right: ReactNode;
}

export function ResizableSplitPane({ left, right }: Props) {
  return (
    <div style={{ height: "100%", overflow: "hidden" }}>
      <AllotmentLayout left={left} right={right} />
    </div>
  );
}
