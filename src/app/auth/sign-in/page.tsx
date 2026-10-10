"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setBusy(true);
    try {
      const result = mode === "sign-in"
        ? await authClient.signIn.email({ email: email.trim(), password })
        : await authClient.signUp.email({ email: email.trim(), password, name: name.trim() || undefined });
      if (result.error) {
        setStatus(result.error.message || "Authentication failed. Check your details and try again.");
        return;
      }
      setStatus(mode === "sign-up" ? "Account created. Opening LLHelper…" : "Signed in. Opening LLHelper…");
      router.push("/");
      router.refresh();
    } catch {
      setStatus("Could not contact the authentication service. Check that preview authentication is configured.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f5f7fb", color: "#172033", fontFamily: "system-ui, sans-serif" }}>
      <section style={{ width: "100%", maxWidth: 420, padding: 28, border: "1px solid #dbe2ec", borderRadius: 16, background: "#fff", boxShadow: "0 12px 36px rgba(20,35,60,.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ display: "grid", placeItems: "center", width: 44, height: 44, borderRadius: 12, background: "#18233b", color: "#fff", fontWeight: 800 }}>LL</div>
          <div><h1 style={{ margin: 0, fontSize: 24 }}>LLHelper</h1><p style={{ margin: "4px 0 0", color: "#667085", fontSize: 14 }}>Sign in to use the browser extension</p></div>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button type="button" onClick={() => { setMode("sign-in"); setStatus(""); }} aria-pressed={mode === "sign-in"} style={tabStyle(mode === "sign-in")}>Sign in</button>
          <button type="button" onClick={() => { setMode("sign-up"); setStatus(""); }} aria-pressed={mode === "sign-up"} style={tabStyle(mode === "sign-up")}>Create account</button>
        </div>
        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          {mode === "sign-up" && <label style={labelStyle}>Name <input autoComplete="name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} /></label>}
          <label style={labelStyle}>Email <input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} /></label>
          <label style={labelStyle}>Password <input type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} /></label>
          <button disabled={busy} type="submit" style={{ ...primaryStyle, opacity: busy ? .65 : 1 }}>{busy ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}</button>
        </form>
        {status && <p role="status" style={{ marginTop: 16, padding: 12, borderRadius: 8, background: "#f1f5f9", fontSize: 14, lineHeight: 1.5 }}>{status}</p>}
        <p style={{ margin: "20px 0 0", color: "#667085", fontSize: 12, lineHeight: 1.5 }}>Use your LLHelper test account for preview testing. Do not enter database credentials here.</p>
      </section>
    </main>
  );
}

function tabStyle(active: boolean) {
  return { flex: 1, padding: "10px 8px", borderRadius: 8, border: "1px solid #d0d5dd", background: active ? "#e9eef8" : "#fff", color: "#172033", fontWeight: 600, cursor: "pointer" } as const;
}
const labelStyle = { display: "grid", gap: 6, fontSize: 14, fontWeight: 600 } as const;
const inputStyle = { width: "100%", boxSizing: "border-box" as const, padding: "11px 12px", border: "1px solid #cbd5e1", borderRadius: 8, font: "inherit" };
const primaryStyle = { padding: "12px 14px", border: 0, borderRadius: 8, background: "#18233b", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" } as const;
