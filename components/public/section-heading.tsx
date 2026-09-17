import type { ReactNode } from "react";

export function SectionHeading({ index, label, title, children }: { index: string; label: string; title: string; children?: ReactNode }) {
  return <div className="oc-section-heading"><div><p className="oc-eyebrow"><span>{index}</span>{label}</p><h2>{title}</h2></div>{children}</div>;
}
