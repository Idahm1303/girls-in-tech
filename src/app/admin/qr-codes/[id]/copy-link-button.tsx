"use client";

import { useState } from "react";

export function CopyQrLinkButton({ link }: { link: string }) {
  const [message, setMessage] = useState("");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setMessage("Link copied.");
    } catch {
      setMessage("Could not copy the link. Copy it from the text field.");
    }
  }

  return (
    <div className="qr-copy-control">
      <button className="button button-outline-dark" onClick={copyLink} type="button">
        Copy link
      </button>
      <span aria-live="polite" className="field-hint">{message}</span>
    </div>
  );
}

export function PrintQrPosterButton() {
  return (
    <button
      className="button button-outline-dark qr-no-print"
      onClick={() => window.print()}
      type="button"
    >
      Print A4 poster
    </button>
  );
}
