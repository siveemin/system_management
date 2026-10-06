"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Package, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "register">("signin");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => { setName(""); setEmail(""); setPassword(""); setError(null); };
  const switchTab = (t: "signin" | "register") => { setTab(t); reset(); };

  const saveCredential = async (credEmail: string, credPassword: string, credName?: string) => {
    try {
      if (typeof window !== "undefined" && "PasswordCredential" in window) {
        const cred = new (window as any).PasswordCredential({
          id: credEmail, password: credPassword, name: credName || credEmail,
        });
        await navigator.credentials.store(cred);
      }
    } catch { /* optional */ }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (res.ok) {
        await saveCredential(email, password, json.user?.name);
        router.push("/"); router.refresh();
      } else {
        setError(json.error || "Login failed. Please try again.");
      }
    } catch { setError("Network error. Please check your connection."); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Please enter your full name."); return; }
    if (!email) { setError("Please enter your email address."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email, password }),
      });
      const json = await res.json();
      if (res.ok) {
        await saveCredential(email, password, name.trim());
        router.push("/"); router.refresh();
      } else {
        setError(json.error || "Registration failed. Please try again.");
      }
    } catch { setError("Network error. Please check your connection."); }
    finally { setLoading(false); }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setError(null);
  };

  const inputCls = "w-full px-4 py-4 rounded-2xl border-2 border-[#d4ddd4] bg-white text-base text-[#1e2e14] placeholder:text-[#bbc8b0] outline-none focus:border-[#6b8a4e] transition-colors";

  return (
    <div className="min-h-screen bg-[#edf2ed] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#6b8a4e] rounded-3xl mb-4 shadow-lg">
            <Package className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#1e2e14]">Smart Inventory</h1>
          <p className="text-[#5a7040] mt-1">
            {tab === "signin" ? "Sign in to continue" : "Create a new account"}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-[#d4ddd4] rounded-2xl p-1 mb-5">
          {(["signin", "register"] as const).map((t) => (
            <button key={t} onClick={() => switchTab(t)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                tab === t ? "bg-white text-[#1e2e14] shadow-sm" : "text-[#5a7040]"
              }`}>
              {t === "signin" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm mb-5">
            {error}
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#d4ddd4] p-6 space-y-4">

          {/* SIGN IN */}
          {tab === "signin" && (
            <form id="login-form" onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1e2e14] mb-2">Email</label>
                <input type="email" name="username" autoComplete="username email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className={inputCls} placeholder="you@company.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1e2e14] mb-2">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} name="password"
                    autoComplete="current-password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className={inputCls + " pr-14"} placeholder="Enter your password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#5a7040]">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#6b8a4e] hover:bg-[#5a7640] active:bg-[#4a6530] disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 text-base mt-2">
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</> : "Sign In"}
              </button>
            </form>
          )}

          {/* REGISTER */}
          {tab === "register" && (
            <form id="register-form" onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1e2e14] mb-2">Full Name</label>
                <input type="text" name="name" autoComplete="name"
                  value={name} onChange={(e) => setName(e.target.value)}
                  className={inputCls} placeholder="Your full name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1e2e14] mb-2">Email</label>
                <input type="email" name="username" autoComplete="username email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className={inputCls} placeholder="you@company.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1e2e14] mb-2">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} name="password"
                    autoComplete="new-password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className={inputCls + " pr-14"} placeholder="At least 6 characters" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#5a7040]">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-[#8a9e7a] mt-1.5 px-1">Minimum 6 characters. You will start as Staff role.</p>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#6b8a4e] hover:bg-[#5a7640] active:bg-[#4a6530] disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 text-base mt-2">
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating...</> : "Create Account"}
              </button>
            </form>
          )}
        </div>

        {/* Quick login buttons — sign in only */}
        {tab === "signin" && (
          <div className="mt-5 space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Quick Login</p>
            {[
              { label: "Admin", email: "admin@smartinventory.io", bg: "bg-[#1e2e14] text-white" },
              { label: "Warehouse Manager", email: "warehouse@smartinventory.io", bg: "bg-white text-[#1e2e14] border-2 border-[#d4ddd4]" },
              { label: "Sales Manager", email: "sales@smartinventory.io", bg: "bg-white text-[#1e2e14] border-2 border-[#d4ddd4]" },
            ].map(({ label, email: demoEmail, bg }) => (
              <button key={demoEmail} type="button" onClick={() => fillDemo(demoEmail)}
                className={`w-full py-4 px-5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-between ${bg}`}>
                <span>{label}</span>
                <span className="text-xs font-normal opacity-50">tap to fill</span>
              </button>
            ))}
            <p className="text-xs text-slate-400 text-center pt-1">
              Password: <span className="font-mono font-bold">password123</span>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
