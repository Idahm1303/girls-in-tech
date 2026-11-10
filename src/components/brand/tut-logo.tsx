import Image from "next/image";
import { BRAND } from "@/lib/brand";

type TutLogoProps = {
  className?: string;
  loading?: "eager" | "lazy";
};

export function TutLogo({ className = "", loading }: TutLogoProps) {
  return (
    <Image
      src={BRAND.logo.tutWordmark}
      alt="Tshwane University of Technology: We empower people"
      width={1012}
      height={321}
      loading={loading}
      className={className}
    />
  );
}
