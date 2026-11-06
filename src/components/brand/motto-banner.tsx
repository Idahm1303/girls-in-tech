import { BRAND } from "@/lib/brand";

export function MottoBanner({ className = "" }: { className?: string }) {
  return <p className={className}>{BRAND.motto}</p>;
}
