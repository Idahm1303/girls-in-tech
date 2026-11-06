import Link from "next/link";
import { Suspense } from "react";
import { GitLogo } from "@/components/brand/git-logo";
import { AccountLinks } from "@/components/account-links";

const navigation = [
  { href: "/about", label: "About" },
  { href: "/events", label: "Events" },
  { href: "/team", label: "Our team" },
  { href: "/news", label: "News" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link aria-label="Girls in Tech home" className="brand-lockup" href="/">
          <span className="brand-mark">
            <GitLogo priority />
          </span>
          <span className="brand-name">Girls in Tech</span>
        </Link>

        <details className="mobile-menu">
          <summary aria-label="Open navigation menu">
            <span />
            <span />
            <span className="visually-hidden">Menu</span>
          </summary>
          <nav aria-label="Mobile navigation" className="mobile-nav">
            {navigation.map((item) => (
              <Link href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
            <Link href="/contact">Contact</Link>
            <Link className="mobile-join-link" href="/register">
              Join GiT
            </Link>
            <Suspense fallback={null}>
              <AccountLinks />
            </Suspense>
          </nav>
        </details>

        <nav aria-label="Main navigation" className="desktop-nav">
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
          <Link href="/contact">Contact</Link>
          <Link className="nav-join-link" href="/register">
            Join GiT <span aria-hidden="true">↗</span>
          </Link>
          <Suspense fallback={null}>
            <AccountLinks />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}
