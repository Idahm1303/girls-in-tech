import Link from "next/link";
import { auth, signOut } from "@/../auth";

async function logout() {
  "use server";
  await signOut({ redirectTo: "/" });
}

export async function AccountLinks() {
  const session = await auth();
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
