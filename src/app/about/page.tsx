import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import {
  ABOUT_PAGE_CONTENT_ID,
  ABOUT_PAGE_DEFAULTS,
} from "@/lib/about-content";
import { BRAND } from "@/lib/brand";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "About Girls in Tech",
  description: "Learn about the Girls in Tech community at Tshwane University of Technology.",
};

export default function AboutPage() {
  return (
    <Suspense fallback={<p className="account-loading">Loading About Girls in Tech…</p>}>
      <AboutContent />
    </Suspense>
  );
}

async function AboutContent() {
  await connection();
  let content: Record<keyof typeof ABOUT_PAGE_DEFAULTS, string> =
    ABOUT_PAGE_DEFAULTS;
  try {
    const savedContent = await prisma.aboutPageContent.findUnique({
      where: { id: ABOUT_PAGE_CONTENT_ID },
    });
    content = savedContent ?? ABOUT_PAGE_DEFAULTS;
  } catch (error) {
    console.error(
      "Could not load editable About page content; using the built-in copy.",
      error,
    );
  }

  return (
    <main className="events-page about-page">
      <section aria-labelledby="about-title" className="events-inner about-inner">
        <p className="eyebrow">Girls in Tech · Faculty of ICT</p>
        <h1 id="about-title">About Girls in Tech</h1>

        <section aria-label="Introduction" className="about-content-section">
          <p>{content.introduction}</p>
        </section>

        <section aria-labelledby="about-what-we-do" className="about-content-section">
          <h2 id="about-what-we-do">What we do</h2>
          <p>{content.whatWeDo}</p>
        </section>

        <section aria-label="Vision and mission" className="about-content-section about-vision-grid">
          <div>
            <h2>Our vision</h2>
            <p>{content.vision}</p>
          </div>
          <div>
            <h2>Our mission</h2>
            <p>{content.mission}</p>
          </div>
        </section>

        <section aria-labelledby="about-commitment" className="about-content-section">
          <h2 id="about-commitment">Our commitment</h2>
          <p>{content.commitment}</p>
        </section>

        <p className="about-hashtags">{BRAND.hashtags.join(" ")}</p>
        <div className="about-cta">
          <Link className="button button-navy" href="/register">
            Join GiT
          </Link>
          <Link className="button button-outline-dark" href="/mentor/register">
            Become a Mentor
          </Link>
        </div>
      </section>
    </main>
  );
}
