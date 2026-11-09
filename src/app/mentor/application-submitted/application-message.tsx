"use client";

import { useEffect, useState } from "react";

export function ApplicationSubmittedMessage() {
  const [name, setName] = useState("there");

  useEffect(() => {
    let active = true;
    void fetch("/mentor/application-submitted/flash", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const result: { name?: string } = await response.json();
        if (active && result.name) setName(result.name);
      })
      .catch((error: unknown) => {
        console.error("Could not read the mentor application confirmation.", error);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <p className="account-intro">
      Thank you, {name}. Your application is under review. We will email you
      once a GiT admin has made a decision.
    </p>
  );
}
