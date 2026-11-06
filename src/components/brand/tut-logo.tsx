"use client";

import Image from "next/image";
import { useState } from "react";
import { BRAND } from "@/lib/brand";

export function TutLogo({ className = "" }: { className?: string }) {
  const [imageUnavailable, setImageUnavailable] = useState(false);

  if (imageUnavailable) {
    return (
      <span
        aria-label="Tshwane University of Technology logo image not yet supplied"
        className={`tut-logo-fallback ${className}`}
      >
        TUT
      </span>
    );
  }

  return (
    <Image
      src={BRAND.logo.tut}
      alt="Tshwane University of Technology logo"
      width={366}
      height={375}
      unoptimized
      loading="eager"
      className={className}
      onError={() => setImageUnavailable(true)}
    />
  );
}
