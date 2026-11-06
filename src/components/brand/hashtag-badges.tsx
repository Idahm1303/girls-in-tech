import { BRAND } from "@/lib/brand";

export function HashtagBadges({ className = "" }: { className?: string }) {
  return (
    <ul className={`hashtag-list ${className}`} aria-label="Girls in Tech hashtags">
      {BRAND.hashtags.map((hashtag) => (
        <li className="hashtag-badge" key={hashtag}>
          {hashtag}
        </li>
      ))}
    </ul>
  );
}
