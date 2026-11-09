"use client";

import Image from "next/image";
import { useState } from "react";

type TeamMemberCardProps = {
  name: string;
  role: string;
  imageSrc: string;
  initials: string;
  featured?: boolean;
};

export function TeamMemberCard({
  name,
  role,
  imageSrc,
  initials,
  featured = false,
}: TeamMemberCardProps) {
  const [imageAvailable, setImageAvailable] = useState(true);

  return (
    <article className={`team-member-card${featured ? " team-member-card-featured" : ""}`}>
      <div className="team-member-copy">
        <p className="team-member-role">{role}</p>
        <h2>{name}</h2>
      </div>
      <figure className="team-member-photo">
        {!imageAvailable && (
          <div aria-label={`${name}'s photo will be added soon`} className="team-photo-fallback">
            <span aria-hidden="true">{initials}</span>
            <span>Photo coming soon</span>
          </div>
        )}
        {imageAvailable && (
          <Image
            alt={`Portrait of ${name}`}
            fill
            onError={() => setImageAvailable(false)}
            sizes={featured ? "(max-width: 760px) 100vw, 360px" : "(max-width: 760px) 100vw, 33vw"}
            src={imageSrc}
          />
        )}
      </figure>
    </article>
  );
}
