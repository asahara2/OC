import type { ReactNode } from "react";

export function AdminPageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="page-heading"><h1>{title}</h1>{children}</div>;
}
