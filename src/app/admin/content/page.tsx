import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { saveAboutPageContent, saveAboutTeamMember } from "./actions";
import { requireAdmin } from "@/lib/member-access";
import {
  ABOUT_PAGE_CONTENT_ID,
  ABOUT_PAGE_DEFAULTS,
  ABOUT_TEAM_ROLES,
  aboutTeamRoleLabels,
} from "@/lib/about-content";
import { prisma } from "@/lib/prisma";

type ContentSearchParams = Promise<{
  error?: string | string[];
  updated?: string | string[];
}>;

export default function AdminContentPage({
  searchParams,
}: {
  searchParams: ContentSearchParams;
}) {
  return (
    <Suspense fallback={<p className="account-loading">Loading content management…</p>}>
      <AdminContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AdminContent({
  searchParams,
}: {
  searchParams: ContentSearchParams;
}) {
  await connection();
  await requireAdmin();
  const [savedContent, teamMembers, query] = await Promise.all([
    prisma.aboutPageContent.findUnique({
      where: { id: ABOUT_PAGE_CONTENT_ID },
    }),
    prisma.teamMember.findMany({
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, roleTitle: true, imageUrl: true },
    }),
    searchParams,
  ]);
  const content = savedContent ?? ABOUT_PAGE_DEFAULTS;
  const error = typeof query.error === "string" ? query.error : undefined;
  const updated = typeof query.updated === "string" ? query.updated : undefined;

  return (
    <main className="dashboard-page admin-content-page">
      <section className="dashboard-inner">
        <p className="eyebrow">Girls in Tech administration</p>
        <h1>Content management</h1>
        <p className="account-intro">
          Update the public About page and the team cards shown there.
        </p>
        <p className="admin-mentor-link">
          <Link className="button button-outline-dark" href="/admin">
            Back to admin dashboard
          </Link>
        </p>
        {updated && (
          <p className="welcome-banner" role="status">
            {updated === "about" ? "About page content saved." : "Team member saved."}
          </p>
        )}
        {error && (
          <p className="form-message" role="alert">
            {error === "about-invalid"
              ? "Please complete each About page text field and keep it within the allowed length."
              : error === "team-not-found"
                ? "That team member could not be found. Refresh and try again."
                : error === "team-photo-invalid"
                  ? "Choose a valid JPG, PNG, or WebP image smaller than 2 MB."
                  : error === "team-photo-upload"
                    ? "The photo could not be uploaded. Check the Vercel Blob connection and try again."
                : "Please check the team member name, role, and photo URL."}
          </p>
        )}

        <section aria-labelledby="about-content-title" className="admin-students">
          <h2 id="about-content-title">About page text</h2>
          <form action={saveAboutPageContent} className="account-form">
            <div className="form-field">
              <label htmlFor="about-introduction">Introduction</label>
              <textarea
                id="about-introduction"
                maxLength={2000}
                name="introduction"
                required
                rows={5}
                defaultValue={content.introduction}
              />
            </div>
            <div className="form-field">
              <label htmlFor="about-what-we-do">What we do</label>
              <textarea
                id="about-what-we-do"
                maxLength={2000}
                name="whatWeDo"
                required
                rows={5}
                defaultValue={content.whatWeDo}
              />
            </div>
            <div className="form-field">
              <label htmlFor="about-commitment">Our commitment</label>
              <textarea
                id="about-commitment"
                maxLength={2000}
                name="commitment"
                required
                rows={5}
                defaultValue={content.commitment}
              />
            </div>
            <div className="form-field">
              <label htmlFor="about-vision">Vision</label>
              <textarea
                id="about-vision"
                maxLength={1000}
                name="vision"
                required
                rows={3}
                defaultValue={content.vision}
              />
            </div>
            <div className="form-field">
              <label htmlFor="about-mission">Mission</label>
              <textarea
                id="about-mission"
                maxLength={1000}
                name="mission"
                required
                rows={3}
                defaultValue={content.mission}
              />
            </div>
            <button className="button button-navy" type="submit">
              Save About page
            </button>
          </form>
        </section>

        <section aria-labelledby="about-team-title" className="admin-students">
          <h2 id="about-team-title">Meet the team</h2>
          <p className="field-hint">
            Upload to hosted storage or use an HTTPS photo URL or local public path.
            Leave the photo blank to show initials.
          </p>
          {teamMembers.length === 0 && (
            <p className="field-hint">No team members yet. Add the team profiles below.</p>
          )}
          {teamMembers.map((member) => (
            <form action={saveAboutTeamMember} className="account-form" key={member.id}>
              <input name="id" type="hidden" value={member.id} />
              <div className="form-field">
                <label htmlFor={`team-name-${member.id}`}>Name</label>
                <input
                  id={`team-name-${member.id}`}
                  maxLength={120}
                  name="name"
                  required
                  defaultValue={member.name}
                />
              </div>
              <div className="form-field">
                <label htmlFor={`team-role-${member.id}`}>Role</label>
                <select
                  defaultValue={member.roleTitle}
                  id={`team-role-${member.id}`}
                  name="roleTitle"
                  required
                >
                  {ABOUT_TEAM_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {aboutTeamRoleLabels[role]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor={`team-photo-${member.id}`}>Photo URL or local path</label>
                <input
                  id={`team-photo-${member.id}`}
                  maxLength={500}
                  name="imageUrl"
                  placeholder="/team/name.jpg"
                  defaultValue={member.imageUrl ?? ""}
                />
              </div>
              <div className="form-field">
                <label htmlFor={`team-photo-upload-${member.id}`}>Upload a photo</label>
                <input
                  accept="image/jpeg,image/png,image/webp"
                  id={`team-photo-upload-${member.id}`}
                  name="photo"
                  type="file"
                />
              </div>
              <button className="button button-outline-dark" type="submit">
                Save {member.name}
              </button>
            </form>
          ))}
          <h3>Add a team member</h3>
          <form action={saveAboutTeamMember} className="account-form">
            <div className="form-field">
              <label htmlFor="new-team-name">Name</label>
              <input id="new-team-name" maxLength={120} name="name" required />
            </div>
            <div className="form-field">
              <label htmlFor="new-team-role">Role</label>
              <select defaultValue="FACILITATOR" id="new-team-role" name="roleTitle" required>
                {ABOUT_TEAM_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {aboutTeamRoleLabels[role]}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="new-team-photo">Photo URL or local path</label>
              <input
                id="new-team-photo"
                maxLength={500}
                name="imageUrl"
                placeholder="/team/name.jpg"
              />
            </div>
            <div className="form-field">
              <label htmlFor="new-team-photo-upload">Upload a photo</label>
              <input
                accept="image/jpeg,image/png,image/webp"
                id="new-team-photo-upload"
                name="photo"
                type="file"
              />
            </div>
            <button className="button button-navy" type="submit">
              Add team member
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}
