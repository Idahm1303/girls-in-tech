import Link from "next/link";
import { GitLogo } from "@/components/brand/git-logo";
import { MottoBanner } from "@/components/brand/motto-banner";
import { BRAND } from "@/lib/brand";

const highlights = [
  {
    number: "01",
    title: "Learn together",
    description:
      "Find your people, build confidence, and grow your skills in a community that has your back.",
    label: "Community",
  },
  {
    number: "02",
    title: "Make your next move",
    description:
      "Meet mentors and discover pathways into internships, learnerships, and the tech industry.",
    label: "Opportunities",
  },
  {
    number: "03",
    title: "Build what matters",
    description:
      "Bring your ideas to life, share what you know, and imagine a future without limits.",
    label: "Possibility",
  },
];

export default function Home() {
  return (
    <main>
      <section aria-labelledby="hero-title" className="hero">
        <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
        <div className="hero-orbit hero-orbit-two" aria-hidden="true" />
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="hero-institution">
              <p className="eyebrow hero-eyebrow">
                Tshwane University of Technology
                <br />
                Faculty of ICT
              </p>
            </div>
            <div className="hero-logo">
              <GitLogo priority />
              <span>Girls in Tech</span>
            </div>
            <h1 aria-label={BRAND.hashtags.join(", ")} id="hero-title">
              {BRAND.hashtags.map((hashtag) => (
                <span key={hashtag}>{hashtag}</span>
              ))}
            </h1>
            <MottoBanner className="hero-motto" />
            <p className="hero-description">
              A community for women in technology to learn boldly, find their
              people, and shape what comes next.
            </p>
            <div className="hero-actions">
              <Link className="button button-light" href="/register">
                Join GiT <span aria-hidden="true">↗</span>
              </Link>
              <Link className="button button-outline" href="/mentors">
                Find a Mentor
              </Link>
              <Link className="button button-text" href="/opportunities">
                View Opportunities <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="art-glow" />
            <div className="art-ring art-ring-outer" />
            <div className="art-ring art-ring-inner" />
            <div className="art-orbit-dot art-dot-one" />
            <div className="art-orbit-dot art-dot-two" />
            <div className="art-orbit-dot art-dot-three" />
            <div className="art-logo-card">
              <GitLogo />
              <span>GROW WITHOUT LIMITS</span>
            </div>
            <span className="art-caption art-caption-top">CURIOUS MINDS</span>
            <span className="art-caption art-caption-bottom">BOLD FUTURES</span>
          </div>
        </div>
        <div className="hero-bottom">
          <span>Learn. Connect. Create.</span>
          <span aria-hidden="true" className="hero-scroll">
            ↓
          </span>
          <span>Scroll to discover</span>
        </div>
      </section>

      <section aria-labelledby="welcome-title" className="welcome-section">
        <div className="section-heading">
          <p className="eyebrow">A space to find your people</p>
          <h2 id="welcome-title">
            Your next chapter in tech
            <br />
            <span>starts here.</span>
          </h2>
        </div>
        <div className="highlight-grid">
          {highlights.map((item) => (
            <article className="highlight-card" key={item.number}>
              <div className="card-topline">
                <span>{item.number}</span>
              </div>
              <span className="card-label">{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-label="Join the community" className="join-strip" id="join">
        <div>
          <p className="eyebrow">There&apos;s a place for you here</p>
          <h2>Let&apos;s make room for what&apos;s possible.</h2>
        </div>
        <Link className="button button-periwinkle" href="/register">
          Find your community <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </main>
  );
}
