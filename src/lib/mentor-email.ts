import "server-only";

export async function sendMentorEmail(to: string, subject: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY and RESEND_FROM_EMAIL are required to send mentor emails.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  if (!response.ok) {
    throw new Error(`Resend returned ${response.status} while sending mentor email.`);
  }
}

export async function sendMentorEmails(
  messages: Array<{ to: string; subject: string; text: string }>,
) {
  const results = await Promise.allSettled(
    messages.map(({ to, subject, text }) => sendMentorEmail(to, subject, text)),
  );
  for (const [index, result] of results.entries()) {
    if (result.status === "rejected") {
      console.error("Mentor email delivery failed", {
        recipient: messages[index]?.to,
        error: result.reason,
      });
    }
  }
}
