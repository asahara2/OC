import type { SVGProps } from "react";

export function ArrowIcon({ diagonal = false, ...props }: SVGProps<SVGSVGElement> & { diagonal?: boolean }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h15m-6-6 6 6-6 6"} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

export function Emblem(props: SVGProps<SVGSVGElement>) {
  return <svg width="42" height="36" viewBox="0 0 64 48" fill="none" aria-hidden="true" {...props}>
    <ellipse cx="23" cy="24" rx="16" ry="19" transform="rotate(-30 23 24)" stroke="currentColor" strokeWidth="1.2" />
    <ellipse cx="41" cy="24" rx="16" ry="19" transform="rotate(30 41 24)" stroke="currentColor" strokeWidth="1.2" />
    <path d="M3 33C16 42 51 31 61 13" stroke="currentColor" strokeWidth=".8" />
    <circle cx="32" cy="24" r="2" fill="currentColor" />
  </svg>;
}
