import Link from "next/link";
import { GitLogo } from "@/components/brand/git-logo";
import { HashtagBadges } from "@/components/brand/hashtag-badges";
import { MottoBanner } from "@/components/brand/motto-banner";
import { TutLogo } from "@/components/brand/tut-logo";
import { BRAND } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <span className="footer-git-mark">
            <GitLogo />
          </span>
          <MottoBanner className="footer-motto" />
          <HashtagBadges className="footer-hashtags" />
        </div>

        <div className="footer-institution">
          <div className="footer-tut-card">
            <TutLogo className="footer-tut-logo" />
          </div>
          <p>{BRAND.institution}</p>
          <a
            className="footer-pdf-link"
            href={BRAND.logo.tutPdf}
            rel="noreferrer"
            target="_blank"
          >
            High-resolution TUT logo (PDF)
          </a>
        </div>

        <nav aria-label="Footer navigation" className="footer-links">
          <Link href="/about">About GiT</Link>
          <Link href="/events">Events</Link>
          <Link href="/mentor/register">Become a Mentor</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/login">Member login</Link>
        </nav>
      </div>
      <div className="footer-bottom">
        <span>Made for curious minds and bold futures.</span>
        <span>© 2026 Girls in Tech · TUT Faculty of ICT</span>
      </div>
    </footer>
  );
}
