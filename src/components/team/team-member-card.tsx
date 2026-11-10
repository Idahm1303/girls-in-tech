"use client";

import Image from "next/image";
import { useState } from "react";

type TeamMemberCardProps = {
  name: string;
  role: string;
  imageSrc?: string;
  featured?: boolean;
};

export function TeamMemberCard({
  name,
  role,
  imageSrc,
  featured = false,
}: TeamMemberCardProps) {
  const [imageAvailable, setImageAvailable] = useState(true);

  return (
    <article className={`team-member-card${featured ? " team-member-card-featured" : ""}`}>
      <div className="team-member-copy">
        <p className="team-member-role">{role}</p>
        <h2>{name}</h2>
      </div>
      {imageSrc && imageAvailable && (
        <figure className="team-member-photo">
          <Image
            alt={`Portrait of ${name}`}
            fill
            onError={() => setImageAvailable(false)}
            sizes="300px"
            src={imageSrc}
          />
        </figure>
      )}
    </article>
  );
}
