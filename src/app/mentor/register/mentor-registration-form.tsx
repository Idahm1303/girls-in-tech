"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import {
  MENTOR_CAMPUS_OPTIONS,
  MENTOR_CAMPUS_CONNECTIONS,
  MENTOR_CURRENT_STATUSES,
  MENTOR_EXPERIENCE_BANDS,
  MENTOR_HELP_TOPICS,
  MENTOR_INDUSTRIES,
  MENTOR_LANGUAGES,
  MENTOR_MEETING_FREQUENCIES,
  MENTOR_MEETING_TOOLS,
  MENTOR_MENTEE_GROUPS,
  MENTOR_MOTIVATION_REASONS,
  MENTOR_REFERRAL_SOURCES,
  MENTOR_SESSION_FORMAT_OPTIONS,
  MENTOR_SESSION_FORMATS,
  mentorAccountSchema,
  mentorMemberAccountSchema,
  mentorMemberApplicationSchema,
  mentorProfessionalSchema,
  mentorPreferencesSchema,
  mentorRegistrationSchema,
} from "@/lib/mentor-validation";
import { MentorAvailabilityPicker } from "../availability-picker";
import { registerMentorAction } from "./actions";

const initialState: { errors?: Record<string, string>; message?: string } = {};
const stepNames = ["Account", "Professional profile", "Preferences & consent"];
const campusNames: Record<(typeof MENTOR_CAMPUS_OPTIONS)[number], string> = {
  SOSHANGUVE: "Soshanguve",
  EMALAHLENI: "Emalahleni",
  POLOKWANE: "Polokwane",
  GIYANE: "Giyane",
  ONLINE_ONLY: "Online only",
};
const meetingNames: Record<(typeof MENTOR_MEETING_TOOLS)[number], string> = {
  TEAMS: "Teams",
  ZOOM: "Zoom",
  GOOGLE_MEET: "Google Meet",
};
const sessionNames: Record<(typeof MENTOR_SESSION_FORMATS)[number], string> = {
  ONLINE: "Online video call",
  IN_PERSON: "In person (campus)",
  BOTH: "No preference",
  PHONE_CALL: "Phone call",
  CHAT_MESSAGING: "Chat/messaging",
  NO_PREFERENCE: "No preference",
};
const experienceNames: Record<(typeof MENTOR_EXPERIENCE_BANDS)[number], string> = {
  LESS_THAN_1: "Less than 1 year",
  "1-3": "1-3 years",
  "4-6": "4-6 years",
  "7-10": "7-10 years",
  "10+": "10+ years",
};
const fieldStep: Record<string, number> = {
  name: 0,
  surname: 0,
  email: 0,
  password: 0,
  confirmPassword: 0,
  phone: 0,
  jobTitle: 1,
  company: 1,
  industry: 1,
  yearsExperience: 1,
  qualification: 1,
  isTutAlumna: 1,
  bio: 1,
  linkedinUrl: 1,
  expertise: 1,
  expertiseOther: 1,
  motivationReasons: 2,
  motivationReasonsOther: 2,
  helpWith: 2,
  helpWithOther: 2,
  currentStatus: 2,
  currentStatusOther: 2,
  sessionFormat: 2,
  meetingTool: 2,
  campuses: 2,
  maxMentees: 2,
  meetingFrequency: 2,
  menteeGroups: 2,
  languages: 2,
  languagesOther: 2,
  campusConnection: 2,
  referralSource: 2,
  referralSourceOther: 2,
  sessionLengthMinutes: 2,
  minimumNoticeHours: 2,
  availability: 2,
  motivation: 2,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="account-submit" disabled={pending} type="submit">
      {pending ? "Submitting your application…" : "Submit application"}
    </button>
  );
}

function MentorMultiSelect({
  error,
  helper,
  label,
  maxSelections,
  name,
  onChange,
  onOtherTextChange,
  options,
  otherError,
  otherLabel,
  otherText,
  selected,
}: {
  error?: string;
  helper?: string;
  label: string;
  maxSelections?: number;
  name: string;
  onChange: (value: string, checked: boolean) => void;
  onOtherTextChange?: (value: string) => void;
  options: readonly string[];
  otherError?: string;
  otherLabel?: string;
  otherText: string;
  selected: string[];
}) {
  const otherOption = options.includes("Something else") ? "Something else" : "Other";
  const showOther = options.includes(otherOption) && selected.includes(otherOption);

  return (
    <>
      <fieldset className="mentor-choice-group">
        <legend>{label}</legend>
        {helper && <p className="field-hint">{helper}</p>}
        <div className="mentor-chip-grid">
          {options.map((option) => {
            const checked = selected.includes(option);
            const limitReached = Boolean(
              maxSelections && selected.length >= maxSelections && !checked,
            );
            return (
              <label className="mentor-chip" key={option}>
                <input
                  checked={checked}
                  disabled={limitReached}
                  name={name}
                  onChange={(event) => onChange(option, event.currentTarget.checked)}
                  type="checkbox"
                  value={option}
                />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
        {error && <p className="field-error">{error}</p>}
      </fieldset>
      {showOther && (
        <div className="form-field">
          <label htmlFor={`${name}-other`}>{otherLabel ?? "Please specify"}</label>
          <input
            id={`${name}-other`}
            maxLength={120}
            name={`${name}Other`}
            onChange={(event) => onOtherTextChange?.(event.currentTarget.value)}
            value={otherText}
          />
          {otherError && <p className="field-error">{otherError}</p>}
        </div>
      )}
    </>
  );
}

function formValues(formData: FormData) {
  return {
    name: formData.get("name"),
    surname: formData.get("surname"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    phone: formData.get("phone"),
    jobTitle: formData.get("jobTitle"),
    company: formData.get("company"),
    industry: formData.get("industry"),
    yearsExperience: formData.get("yearsExperience"),
    qualification: formData.get("qualification"),
    isTutAlumna: formData.get("isTutAlumna"),
    bio: formData.get("bio"),
    linkedinUrl: formData.get("linkedinUrl"),
    expertise: formData.getAll("expertise"),
    expertiseOther: formData.get("expertiseOther") ?? "",
    sessionFormat: formData.get("sessionFormat") ?? "NO_PREFERENCE",
    meetingTool: formData.get("meetingTool"),
    campuses: formData.getAll("campuses"),
    maxMentees: formData.get("maxMentees") ?? "1",
    sessionLengthMinutes: formData.get("sessionLengthMinutes"),
    minimumNoticeHours: formData.get("minimumNoticeHours"),
    availability: formData.getAll("availability"),
    motivationReasons: formData.getAll("motivationReasons"),
    motivationReasonsOther: formData.get("motivationReasonsOther") ?? "",
    helpWith: formData.getAll("helpWith"),
    helpWithOther: formData.get("helpWithOther") ?? "",
    currentStatus: formData.get("currentStatus"),
    currentStatusOther: formData.get("currentStatusOther") ?? "",
    meetingFrequency: formData.get("meetingFrequency") ?? "",
    menteeGroups: formData.getAll("menteeGroups"),
    languages: formData.getAll("languages"),
    languagesOther: formData.get("languagesOther") ?? "",
    campusConnection: formData.get("campusConnection") ?? "",
    referralSource: formData.get("referralSource") ?? "",
    referralSourceOther: formData.get("referralSourceOther") ?? "",
    motivation: formData.get("motivation"),
    consentPublicProfile: formData.get("consentPublicProfile") === "on",
    consentCodeOfConduct: formData.get("consentCodeOfConduct") === "on",
    consentPrivacy: formData.get("consentPrivacy") === "on",
  };
}

export function MentorRegistrationForm({
  expertiseOptions,
  member,
}: {
  expertiseOptions: string[];
  member?: { name: string; surname: string; email: string };
}) {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [bioLength, setBioLength] = useState(0);
  const [motivationLength, setMotivationLength] = useState(0);
  const [photoError, setPhotoError] = useState("");
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string[]>>({});
  const [otherAnswers, setOtherAnswers] = useState<Record<string, string>>({});
  const [currentStatus, setCurrentStatus] = useState("");
  const [referralSource, setReferralSource] = useState("");

  function updateChoice(name: string, value: string, checked: boolean) {
    setSelectedChoices((current) => {
      const selected = current[name] ?? [];
      return {
        ...current,
        [name]: checked
          ? [...selected, value]
          : selected.filter((item) => item !== value),
      };
    });
  }

  const [state, formAction] = useActionState(
    async (previousState: typeof initialState, formData: FormData) => {
      const result = await registerMentorAction(previousState, formData);
      const firstError = Object.keys(result.errors ?? {})[0];
      if (firstError) setStep(fieldStep[firstError] ?? 2);
      return result;
    },
    initialState,
  );

  function validateStep(form: HTMLFormElement, currentStep: number) {
    const data = formValues(new FormData(form));
    const parsed =
      currentStep === 0
        ? (member ? mentorMemberAccountSchema : mentorAccountSchema).safeParse(data)
        : currentStep === 1
          ? mentorProfessionalSchema.safeParse(data)
          : mentorPreferencesSchema.safeParse(data);
    if (parsed.success) {
      setErrors({});
      return true;
    }

    const nextErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "form");
      nextErrors[field] ??= issue.message;
    }
    setErrors(nextErrors);
    return false;
  }

  function goNext(form: HTMLFormElement) {
    if (validateStep(form, step)) {
      setErrors({});
      setStep((current) => Math.min(current + 1, 2));
    }
  }

  function validateAll(event: FormEvent<HTMLFormElement>) {
    const data = formValues(new FormData(event.currentTarget));
    const parsed = (member ? mentorMemberApplicationSchema : mentorRegistrationSchema).safeParse(data);
    if (!parsed.success || photoError) {
      event.preventDefault();
      const nextErrors: Record<string, string> = {};
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          const field = String(issue.path[0] ?? "form");
          nextErrors[field] ??= issue.message;
        }
      }
      setErrors(nextErrors);
      if (!parsed.success) {
        setStep(fieldStep[String(parsed.error.issues[0]?.path[0] ?? "")] ?? 2);
      } else {
        setStep(1);
      }
    } else {
      setErrors({});
    }
  }

  const currentErrors = { ...state.errors, ...errors };

  return (
    <form
      action={formAction}
      className="account-form mentor-application-form"
      noValidate
      onSubmit={validateAll}
    >
      {state.message && <p className="form-message" role="alert">{state.message}</p>}
      <ol aria-label="Application progress" className="mentor-progress">
        {stepNames.map((name, index) => (
          <li aria-current={step === index ? "step" : undefined} key={name}>
            <span>{index + 1}</span>
            <span>{name}</span>
          </li>
        ))}
      </ol>

      <fieldset className="mentor-step" hidden={step !== 0}>
        <legend>Step 1: Account</legend>
        {member && (
          <p className="field-hint">
            Applying with your existing GiT account. Your student profile will be kept.
          </p>
        )}
        <div className="mentor-form-grid">
          <div className="form-field">
            <label htmlFor="mentor-name">Name</label>
            <input
              autoComplete="given-name"
              defaultValue={member?.name}
              id="mentor-name"
              name="name"
              readOnly={Boolean(member)}
              required
            />
            {currentErrors.name && <p className="field-error">{currentErrors.name}</p>}
          </div>
          <div className="form-field">
            <label htmlFor="mentor-surname">Surname</label>
            <input
              autoComplete="family-name"
              defaultValue={member?.surname}
              id="mentor-surname"
              name="surname"
              readOnly={Boolean(member)}
              required
            />
            {currentErrors.surname && <p className="field-error">{currentErrors.surname}</p>}
          </div>
        </div>
        <div className="form-field">
          <label htmlFor="mentor-email">Email</label>
          <input
            autoComplete="email"
            defaultValue={member?.email}
            id="mentor-email"
            name="email"
            readOnly={Boolean(member)}
            required
            type="email"
          />
          {currentErrors.email && <p className="field-error">{currentErrors.email}</p>}
        </div>
        {!member && <div className="form-field">
          <label htmlFor="mentor-password">Password</label>
          <div className="password-input-wrap">
            <input
              autoComplete="new-password"
              id="mentor-password"
              minLength={8}
              name="password"
              required
              type={passwordVisible ? "text" : "password"}
            />
            <button
              aria-label={passwordVisible ? "Hide password" : "Show password"}
              className="password-toggle"
              onClick={() => setPasswordVisible((visible) => !visible)}
              type="button"
            >
              {passwordVisible ? "Hide" : "Show"}
            </button>
          </div>
          {currentErrors.password && <p className="field-error">{currentErrors.password}</p>}
        </div>}
        {!member && <div className="form-field">
          <label htmlFor="mentor-confirm-password">Confirm password</label>
          <div className="password-input-wrap">
            <input
              autoComplete="new-password"
              id="mentor-confirm-password"
              name="confirmPassword"
              required
              type={confirmVisible ? "text" : "password"}
            />
            <button
              aria-label={confirmVisible ? "Hide confirmation password" : "Show confirmation password"}
              className="password-toggle"
              onClick={() => setConfirmVisible((visible) => !visible)}
              type="button"
            >
              {confirmVisible ? "Hide" : "Show"}
            </button>
          </div>
          {currentErrors.confirmPassword && <p className="field-error">{currentErrors.confirmPassword}</p>}
        </div>}
        <div className="form-field">
          <label htmlFor="mentor-phone">Cell number (admin only)</label>
          <input autoComplete="tel" id="mentor-phone" name="phone" type="tel" required />
          {currentErrors.phone && <p className="field-error">{currentErrors.phone}</p>}
        </div>
      </fieldset>

      <fieldset className="mentor-step" hidden={step !== 1}>
        <legend>Step 2: Professional profile</legend>
        <div className="form-field">
          <label htmlFor="mentor-job-title">Job title</label>
          <input id="mentor-job-title" name="jobTitle" required />
          {currentErrors.jobTitle && <p className="field-error">{currentErrors.jobTitle}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="mentor-company">Company or institution</label>
          <input id="mentor-company" name="company" required />
          {currentErrors.company && <p className="field-error">{currentErrors.company}</p>}
        </div>
        <div className="mentor-form-grid">
          <div className="form-field">
            <label htmlFor="mentor-industry">Industry</label>
            <select defaultValue="" id="mentor-industry" name="industry" required>
              <option disabled value="">Select an industry</option>
              {MENTOR_INDUSTRIES.map((industry) => <option key={industry}>{industry}</option>)}
            </select>
            {currentErrors.industry && <p className="field-error">{currentErrors.industry}</p>}
          </div>
          <div className="form-field">
            <label htmlFor="mentor-experience">Years of experience</label>
            <select defaultValue="" id="mentor-experience" name="yearsExperience" required>
              <option disabled value="">Select experience</option>
              {MENTOR_EXPERIENCE_BANDS.map((band) => (
                <option key={band} value={band}>{experienceNames[band]}</option>
              ))}
            </select>
            {currentErrors.yearsExperience && <p className="field-error">{currentErrors.yearsExperience}</p>}
          </div>
        </div>
        <div className="form-field">
          <label htmlFor="mentor-qualification">Highest qualification</label>
          <input id="mentor-qualification" name="qualification" required />
          {currentErrors.qualification && <p className="field-error">{currentErrors.qualification}</p>}
        </div>
        <fieldset className="mentor-choice-group">
          <legend>TUT alumna?</legend>
          <label><input name="isTutAlumna" required type="radio" value="yes" /> Yes</label>
          <label><input name="isTutAlumna" type="radio" value="no" /> No</label>
          {currentErrors.isTutAlumna && <p className="field-error">{currentErrors.isTutAlumna}</p>}
        </fieldset>
        <div className="form-field">
          <label htmlFor="mentor-bio">Short bio</label>
          <textarea
            id="mentor-bio"
            maxLength={600}
            name="bio"
            onChange={(event) => setBioLength(event.target.value.length)}
            required
            rows={4}
          />
          <p aria-live="polite" className="field-hint">{bioLength}/600 characters</p>
          {currentErrors.bio && <p className="field-error">{currentErrors.bio}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="mentor-linkedin">LinkedIn URL (optional)</label>
          <input id="mentor-linkedin" name="linkedinUrl" placeholder="https://www.linkedin.com/in/…" type="url" />
          {currentErrors.linkedinUrl && <p className="field-error">{currentErrors.linkedinUrl}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="mentor-photo">Profile photo (optional; add after signing in)</label>
          <input
            accept="image/jpeg,image/png,image/webp"
            id="mentor-photo"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setPhotoError(
                file && file.size > 2 * 1024 * 1024
                  ? "Choose an image smaller than 2 MB."
                  : file && !["image/jpeg", "image/png", "image/webp"].includes(file.type)
                    ? "Upload a JPG, PNG, or WebP image."
                    : "",
              );
            }}
            type="file"
          />
          <p className="field-hint">For account security, upload your photo after signing in to your mentor status page.</p>
          {photoError && <p className="field-error" role="alert">{photoError}</p>}
        </div>
        <MentorMultiSelect
          error={currentErrors.expertise}
          helper="Choose up to 3 areas."
          label="Area of expertise (required)"
          maxSelections={3}
          name="expertise"
          onChange={(value, checked) => updateChoice("expertise", value, checked)}
          onOtherTextChange={(value) => setOtherAnswers((current) => ({ ...current, expertise: value }))}
          options={expertiseOptions}
          otherError={currentErrors.expertiseOther}
          otherText={otherAnswers.expertise ?? ""}
          selected={selectedChoices.expertise ?? []}
        />
      </fieldset>

      <fieldset className="mentor-step" hidden={step !== 2}>
        <legend>Step 3: Mentoring preferences and consent</legend>
        <section aria-labelledby="mentor-about-title" className="mentor-about-section">
          <h3 id="mentor-about-title">About your mentoring</h3>
          <MentorMultiSelect
            error={currentErrors.motivationReasons}
            helper="A little about what you hope to get out of it. Select all that apply."
            label="What makes you want to mentor? (required)"
            name="motivationReasons"
            onChange={(value, checked) => updateChoice("motivationReasons", value, checked)}
            onOtherTextChange={(value) => setOtherAnswers((current) => ({ ...current, motivationReasons: value }))}
            options={MENTOR_MOTIVATION_REASONS}
            otherError={currentErrors.motivationReasonsOther}
            otherLabel="Please tell us a little more"
            otherText={otherAnswers.motivationReasons ?? ""}
            selected={selectedChoices.motivationReasons ?? []}
          />
          <MentorMultiSelect
            error={currentErrors.helpWith}
            helper="Choose the conversations you'd enjoy having as a mentor."
            label="What would you like to help someone with? (required)"
            name="helpWith"
            onChange={(value, checked) => updateChoice("helpWith", value, checked)}
            onOtherTextChange={(value) => setOtherAnswers((current) => ({ ...current, helpWith: value }))}
            options={MENTOR_HELP_TOPICS}
            otherError={currentErrors.helpWithOther}
            otherLabel="Please describe the other topic"
            otherText={otherAnswers.helpWith ?? ""}
            selected={selectedChoices.helpWith ?? []}
          />
          <div className="form-field">
            <label htmlFor="mentor-current-status">Current status (required)</label>
            <select
              defaultValue=""
              id="mentor-current-status"
              name="currentStatus"
              onChange={(event) => setCurrentStatus(event.currentTarget.value)}
            >
              <option disabled value="">Select your current status</option>
              {MENTOR_CURRENT_STATUSES.map((status) => <option key={status}>{status}</option>)}
            </select>
            {currentErrors.currentStatus && <p className="field-error">{currentErrors.currentStatus}</p>}
          </div>
          {currentStatus === "Other" && (
            <div className="form-field">
              <label htmlFor="mentor-current-status-other">Please describe your current status</label>
              <input id="mentor-current-status-other" maxLength={120} name="currentStatusOther" />
              {currentErrors.currentStatusOther && <p className="field-error">{currentErrors.currentStatusOther}</p>}
            </div>
          )}
        <div className="form-field">
          <label htmlFor="mentor-format">Preferred session format</label>
          <select defaultValue="NO_PREFERENCE" id="mentor-format" name="sessionFormat">
            {MENTOR_SESSION_FORMAT_OPTIONS.map((format) => (
              <option key={format} value={format}>{sessionNames[format]}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="mentor-meeting-tool">Preferred meeting tool</label>
          <select defaultValue="" id="mentor-meeting-tool" name="meetingTool" required>
            <option disabled value="">Select a tool</option>
            {MENTOR_MEETING_TOOLS.map((tool) => (
              <option key={tool} value={tool}>{meetingNames[tool]}</option>
            ))}
          </select>
          {currentErrors.meetingTool && <p className="field-error">{currentErrors.meetingTool}</p>}
        </div>
        <fieldset className="mentor-choice-group">
          <legend>Campuses I can support</legend>
          <div className="mentor-chip-grid">
            {MENTOR_CAMPUS_OPTIONS.map((campus) => (
              <label className="mentor-chip" key={campus}>
                <input name="campuses" type="checkbox" value={campus} />
                <span>{campusNames[campus]}</span>
              </label>
            ))}
          </div>
          {currentErrors.campuses && <p className="field-error">{currentErrors.campuses}</p>}
        </fieldset>
        <div className="form-field">
          <label htmlFor="mentor-max-mentees">How many mentees can you take at a time?</label>
          <select defaultValue="1" id="mentor-max-mentees" name="maxMentees">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="5">4-5</option>
          </select>
          {currentErrors.maxMentees && <p className="field-error">{currentErrors.maxMentees}</p>}
        </div>
          <div className="form-field">
            <label htmlFor="mentor-meeting-frequency">How often can you meet a mentee?</label>
            <select defaultValue="" id="mentor-meeting-frequency" name="meetingFrequency">
              <option value="">Select a frequency (optional)</option>
              {MENTOR_MEETING_FREQUENCIES.map((frequency) => <option key={frequency}>{frequency}</option>)}
            </select>
            {currentErrors.meetingFrequency && <p className="field-error">{currentErrors.meetingFrequency}</p>}
          </div>
          <MentorMultiSelect
            error={currentErrors.menteeGroups}
            label="Who would you like to mentor?"
            name="menteeGroups"
            onChange={(value, checked) => updateChoice("menteeGroups", value, checked)}
            options={MENTOR_MENTEE_GROUPS}
            otherText=""
            selected={selectedChoices.menteeGroups ?? []}
          />
          <MentorMultiSelect
            error={currentErrors.languages}
            label="Languages you can mentor in"
            name="languages"
            onChange={(value, checked) => updateChoice("languages", value, checked)}
            onOtherTextChange={(value) => setOtherAnswers((current) => ({ ...current, languages: value }))}
            options={MENTOR_LANGUAGES}
            otherError={currentErrors.languagesOther}
            otherLabel="Please specify another language"
            otherText={otherAnswers.languages ?? ""}
            selected={selectedChoices.languages ?? []}
          />
          <div className="form-field">
            <label htmlFor="mentor-campus-connection">Campus connection</label>
            <select defaultValue="" id="mentor-campus-connection" name="campusConnection">
              <option value="">Select a campus (optional)</option>
              {MENTOR_CAMPUS_CONNECTIONS.map((campus) => <option key={campus}>{campus}</option>)}
            </select>
            {currentErrors.campusConnection && <p className="field-error">{currentErrors.campusConnection}</p>}
          </div>
          <div className="form-field">
            <label htmlFor="mentor-referral-source">How did you hear about GiT?</label>
            <select
              defaultValue=""
              id="mentor-referral-source"
              name="referralSource"
              onChange={(event) => setReferralSource(event.currentTarget.value)}
            >
              <option value="">Select an option (optional)</option>
              {MENTOR_REFERRAL_SOURCES.map((source) => <option key={source}>{source}</option>)}
            </select>
            {currentErrors.referralSource && <p className="field-error">{currentErrors.referralSource}</p>}
          </div>
          {referralSource === "Other" && (
            <div className="form-field">
              <label htmlFor="mentor-referral-source-other">Please specify</label>
              <input id="mentor-referral-source-other" maxLength={120} name="referralSourceOther" />
              {currentErrors.referralSourceOther && <p className="field-error">{currentErrors.referralSourceOther}</p>}
            </div>
          )}
        </section>
        <fieldset className="mentor-choice-group">
          <legend>Usual availability (select day and time)</legend>
          <h3>Mentor on your terms.</h3>
          <p className="field-hint">
            Choose a schedule that works for you. You can change your availability and session settings anytime.
          </p>
          <h4>When would you like to mentor?</h4>
          <MentorAvailabilityPicker />
          {currentErrors.sessionLengthMinutes && (
            <p className="field-error">{currentErrors.sessionLengthMinutes}</p>
          )}
          {currentErrors.minimumNoticeHours && (
            <p className="field-error">{currentErrors.minimumNoticeHours}</p>
          )}
          {currentErrors.availability && <p className="field-error">{currentErrors.availability}</p>}
        </fieldset>
        <div className="form-field">
          <label htmlFor="mentor-motivation">Why do you want to mentor girls in tech? (admin only)</label>
          <textarea
            id="mentor-motivation"
            maxLength={500}
            name="motivation"
            onChange={(event) => setMotivationLength(event.target.value.length)}
            required
            rows={4}
          />
          <p aria-live="polite" className="field-hint">{motivationLength}/500 characters</p>
          {currentErrors.motivation && <p className="field-error">{currentErrors.motivation}</p>}
        </div>
        <div className="mentor-consents">
          <label className="consent-field">
            <input name="consentPublicProfile" required type="checkbox" />
            <span>I agree to my name, photo, job title and bio being shown to GiT members.</span>
          </label>
          {currentErrors.consentPublicProfile && <p className="field-error">{currentErrors.consentPublicProfile}</p>}
          <label className="consent-field">
            <input name="consentCodeOfConduct" required type="checkbox" />
            <span>I agree to the <Link href="/mentor/code-of-conduct" target="_blank">GiT mentor code of conduct</Link>.</span>
          </label>
          {currentErrors.consentCodeOfConduct && <p className="field-error">{currentErrors.consentCodeOfConduct}</p>}
          <label className="consent-field">
            <input name="consentPrivacy" required type="checkbox" />
            <span>I agree to the GiT privacy notice (POPIA).</span>
          </label>
          {currentErrors.consentPrivacy && <p className="field-error">{currentErrors.consentPrivacy}</p>}
        </div>
      </fieldset>

      <div className="mentor-form-controls">
        {step > 0 && (
          <button className="button button-outline-dark" onClick={() => setStep((current) => current - 1)} type="button">
            Back
          </button>
        )}
        {step < 2 ? (
          <button
            className="account-submit"
            onClick={(event) => goNext(event.currentTarget.form!)}
            type="button"
          >
            Continue to {stepNames[step + 1]}
          </button>
        ) : (
          <SubmitButton />
        )}
      </div>
      {step === 2 && state.errors?.form && <p className="form-message" role="alert">{state.errors.form}</p>}
    </form>
  );
}
