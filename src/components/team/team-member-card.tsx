"use client";

import Image from "next/image";
import { useState } from "react";
import { getTeamMemberInitials } from "@/lib/team-avatar";

type TeamMemberCardProps = {
  name: string;
  role: string;
  imageSrc?: string | null;
  fallbackImageSrc?: string | null;
  featured?: boolean;
  portraitFraming?: "default" | "chin-clearance";
};

export function TeamMemberCard({
  name,
  role,
  imageSrc,
  fallbackImageSrc,
  featured = false,
  portraitFraming = "default",
}: TeamMemberCardProps) {
  const [imageAvailable, setImageAvailable] = useState(true);
  const [usingFallbackImage, setUsingFallbackImage] = useState(false);
  const initials = getTeamMemberInitials(name);
  const displayedImageSrc = usingFallbackImage ? fallbackImageSrc : imageSrc;

  return (
    <article className={`team-member-card${featured ? " team-member-card-featured" : ""}`}>
      <div className="team-member-copy">
        <p className="team-member-role">{role}</p>
        <h2>{name}</h2>
      </div>
      <figure className={`team-member-photo${portraitFraming === "chin-clearance" ? " team-member-photo-chin-clearance" : ""}`}>
        <div className="team-member-photo-viewport">
          {displayedImageSrc && imageAvailable ? (
            <Image
              alt={`Portrait of ${name}`}
              fill
              onError={() => {
                if (
                  !usingFallbackImage &&
                  fallbackImageSrc &&
                  fallbackImageSrc !== imageSrc
                ) {
                  setUsingFallbackImage(true);
                } else {
                  setImageAvailable(false);
                }
              }}
              sizes="300px"
              src={displayedImageSrc}
            />
          ) : (
            <div
              aria-label={`Portrait unavailable for ${name}`}
              className="team-member-avatar"
              role="img"
            >
              {initials}
            </div>
          )}
        </div>
      </figure>
    </article>
  );
}
