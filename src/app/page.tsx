import Link from "next/link";
import { auth } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = auth ? await auth.getSession().catch(() => null) : null;
  const user = session?.data?.user;
  return (
    <main style={{ maxWidth: 720, margin: "72px auto", padding: 24, fontFamily: "system-ui, sans-serif", color: "#172033" }}>
      <h1 style={{ fontSize: 32 }}>LLHelper</h1>
      {user ? <>
        <p>You are signed in as <strong>{user.email || user.name || user.id}</strong>.</p>
        <p>This preview is ready for browser-extension API testing. Keep this tab on the same preview host while testing.</p>
        <form action="/api/auth/sign-out" method="post"><button type="submit">Sign out</button></form>
      </> : <>
        <p>Sign in to LLHelper to use the browser extension.</p>
        <p><Link href="/auth/sign-in">Sign in or create a test account</Link></p>
      </>}
    </main>
  );
}
