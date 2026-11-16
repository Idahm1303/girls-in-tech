import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | Girls in Tech",
  description: "Contact the Girls in Tech team at the TUT Faculty of ICT.",
};

const socialLinks = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/FacultyofICT_TUT",
    platform: "instagram",
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/p/Faculty-of-ICT-Tshwane-University-of-Technology-61556755880834/",
    platform: "facebook",
  },
  {
    name: "X",
    href: "https://x.com/FacultyofICT_TUT",
    platform: "x",
  },
] as const;

type SocialPlatform = (typeof socialLinks)[number]["platform"] | "whatsapp";

function SocialIcon({ platform }: { platform: SocialPlatform }) {
  if (platform === "instagram") {
    return (
      <svg aria-hidden="true" className="social-icon social-icon-instagram" fill="none" viewBox="0 0 24 24">
        <defs>
          <linearGradient id="instagram-icon-gradient" x1="4" x2="20" y1="20" y2="4" gradientUnits="userSpaceOnUse">
            <stop stopColor="#feda75" />
            <stop offset=".45" stopColor="#fa7e1e" />
            <stop offset=".72" stopColor="#d62976" />
            <stop offset="1" stopColor="#4f5bd5" />
          </linearGradient>
        </defs>
        <rect height="16" rx="4.5" stroke="url(#instagram-icon-gradient)" strokeWidth="1.8" width="16" x="4" y="4" />
        <circle cx="12" cy="12" r="3.5" stroke="url(#instagram-icon-gradient)" strokeWidth="1.8" />
        <circle cx="17.5" cy="6.8" fill="#d62976" r="1" />
      </svg>
    );
  }

  if (platform === "facebook") {
    return (
      <svg aria-hidden="true" className="social-icon social-icon-facebook" fill="currentColor" viewBox="0 0 24 24">
        <path d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4.1 1.5-4.1 4.2v2.3H7.6v3.1h2.7v8h3.2Z" />
      </svg>
    );
  }

  if (platform === "whatsapp") {
    return (
      <svg aria-hidden="true" className="social-icon social-icon-whatsapp" fill="none" viewBox="0 0 24 24">
        <path d="M20 11.7a8 8 0 0 1-11.8 7L4 20l1.3-4A8 8 0 1 1 20 11.7Z" stroke="#25d366" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M9 8.5c.2-.4.4-.4.7-.4h.4c.2 0 .3.1.4.4l.7 1.7c.1.2.1.4-.1.6l-.5.6c-.2.2-.2.4 0 .6.5.8 1.2 1.5 2 2 .2.1.4.1.6-.1l.7-.8c.2-.2.4-.2.6-.1l1.6.8c.2.1.3.2.3.4 0 .4-.2 1.1-.7 1.5-.5.5-1.3.7-2 .6-1-.2-2.3-.9-3.5-2-1.3-1.2-2.1-2.6-2.4-3.6-.3-.9 0-1.7.5-2.2.2-.2.5-.4.7-.4Z" fill="#25d366" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="social-icon social-icon-x" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.8 5.7 22H2.5l7.3-8.4L1.8 2h6.5l4.5 6.7L18.9 2Zm-1.1 18h1.7L7.3 3.9H5.5L17.8 20Z" />
    </svg>
  );
}

export default function ContactPage() {
  return (
    <main className="contact-page">
      <section aria-labelledby="contact-title" className="contact-inner">
        <p className="eyebrow">Girls in Tech · TUT Faculty of ICT</p>
        <h1 id="contact-title">Contact us</h1>
        <p className="contact-intro">
          Get in touch with our lead organiser or follow the Faculty of ICT on
          social media.
        </p>

        <article className="contact-card">
          <h2>Lead Organiser</h2>
          <p className="contact-name">Dr. Thembeka Manetje</p>
          <dl className="contact-details">
            <div>
              <dt>Email</dt>
              <dd>
                <a href="mailto:Manetjetv@tut.ac.za">Manetjetv@tut.ac.za</a>
              </dd>
            </div>
            <div>
              <dt>Telephone</dt>
              <dd>
                <a href="tel:+27123829203">012 382 9203</a>
              </dd>
            </div>
          </dl>

          <h3>Follow the Faculty of ICT</h3>
          <ul className="contact-social-links">
            {socialLinks.map((link) => (
              <li key={link.name}>
                <a href={link.href} rel="noreferrer" target="_blank">
                  <SocialIcon platform={link.platform} />
                  {link.name}
                  <span aria-hidden="true"> ↗</span>
                </a>
              </li>
            ))}
          </ul>

          <h3>Join the Girls in Tech WhatsApp group</h3>
          <a
            href="https://chat.whatsapp.com/CqMewyvcNNz0fuxr08dWjz"
            rel="noreferrer"
            target="_blank"
            className="contact-whatsapp-link"
          >
            <SocialIcon platform="whatsapp" />
            Click here to join the group
            <span aria-hidden="true"> ↗</span>
          </a>
        </article>
      </section>
    </main>
  );
}
