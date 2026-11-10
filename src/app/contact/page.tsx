import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | Girls in Tech",
  description: "Contact the Girls in Tech team at the TUT Faculty of ICT.",
};

const socialLinks = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/FacultyofICT_TUT",
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/p/Faculty-of-ICT-Tshwane-University-of-Technology-61556755880834/",
  },
  {
    name: "X",
    href: "https://x.com/FacultyofICT_TUT",
  },
];

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
          >
            Click here to join the group
            <span aria-hidden="true"> ↗</span>
          </a>
        </article>
      </section>
    </main>
  );
}
