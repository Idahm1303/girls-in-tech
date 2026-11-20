import Link from "next/link";
import { connection } from "next/server";
import type { Session } from "next-auth";
import { auth, signOut } from "@/../auth";

async function logout() {
  "use server";
  await signOut({ redirectTo: "/" });
}

export async function AccountLinks() {
  await connection();
  let session: Session | null = null;
  try {
    session = await auth();
  } catch (error) {
    console.error(
      "Could not read the session for site navigation; rendering signed-out links.",
      error,
    );
  }

  if (!session?.user) {
    return (
      <Link href="/login">Log in</Link>
    );
  }

  return (
    <>
      <Link href="/dashboard">Dashboard</Link>
      <form action={logout}>
        <button className="nav-logout" type="submit">
          Log out
        </button>
      </form>
    </>
  );
}
