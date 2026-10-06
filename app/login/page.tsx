"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Package, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "register">("signin");

  // shared
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const reset = () => {
    setName(""); setEmail(""); setPassword("");
    setError(null); setSuccess(null);
  };

  const switchTab = (t: "signin" | "register") => {
    setTab(t);
    reset();
  };

  const saveCredential = async (credEmail: string, credPassword: string, credName?: string) => {
    try {
      if (typeof window !== "undefined" && "PasswordCredential" in window) {
        const cred = new (window as any).PasswordCredential({
          id: credEmail,
          password: credPassword,
          name: credName || credEmail,
        });
        await navigator.credentials.store(cred);
      }
    } catch {
      // silently ignore — credential saving is optional
    }
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
        router.push("/");
        router.refresh();
      } else {
        setError(json.error || "Login failed. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
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
        router.push("/");
        router.refresh();
      } else {
        setError(json.error || "Registration failed. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#edf2ed] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#6b8a4e] rounded-2xl mb-4 shadow-lg">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#1e2e14]">Smart Inventory</h1>
          <p className="text-[#5a7040] mt-1 text-sm">
            {tab === "signin" ? "Sign in to your account" : "Create a new account"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#d4ddd4] overflow-hidden">

          {/* Tab switcher */}
          <div className="flex border-b border-[#d4ddd4]">
            {(["signin", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                  tab === t
                    ? "bg-white text-[#1e2e14] border-b-2 border-[#6b8a4e]"
                    : "bg-[#f7faf7] text-[#5a7040] hover:bg-[#edf2ed]"
                }`}
              >
                {t === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <div className="p-8">
            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
                {error}
              </div>
            )}

            {/* SIGN IN FORM */}
            {tab === "signin" && (
              <form id="login-form" onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#1e2e14]">Email address</label>
                  <input
                    type="email"
                    name="username"
                    autoComplete="username email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#d4ddd4] bg-white text-sm text-[#1e2e14] placeholder:text-[#aab8a0] outline-none focus:border-[#6b8a4e] transition-colors"
                    placeholder="you@company.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#1e2e14]">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-11 rounded-xl border border-[#d4ddd4] bg-white text-sm text-[#1e2e14] placeholder:text-[#aab8a0] outline-none focus:border-[#6b8a4e] transition-colors"
                      placeholder="Enter your password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a7040] hover:text-[#1e2e14] transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-[#6b8a4e] hover:bg-[#5a7640] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : "Sign In"}
                </button>
              </form>
            )}

            {/* REGISTER FORM */}
            {tab === "register" && (
              <form id="register-form" onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#1e2e14]">Full name</label>
                  <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#d4ddd4] bg-white text-sm text-[#1e2e14] placeholder:text-[#aab8a0] outline-none focus:border-[#6b8a4e] transition-colors"
                    placeholder="Your full name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#1e2e14]">Email address</label>
                  <input
                    type="email"
                    name="username"
                    autoComplete="username email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#d4ddd4] bg-white text-sm text-[#1e2e14] placeholder:text-[#aab8a0] outline-none focus:border-[#6b8a4e] transition-colors"
                    placeholder="you@company.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#1e2e14]">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-11 rounded-xl border border-[#d4ddd4] bg-white text-sm text-[#1e2e14] placeholder:text-[#aab8a0] outline-none focus:border-[#6b8a4e] transition-colors"
                      placeholder="At least 6 characters"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a7040] hover:text-[#1e2e14] transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#8a9e7a]">Minimum 6 characters. Your account will start with Staff role.</p>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-[#6b8a4e] hover:bg-[#5a7640] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : "Create Account"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Quick login (sign in tab only) */}
        {tab === "signin" && (
          <div className="mt-4 bg-white rounded-2xl border border-[#d4ddd4] px-4 py-4">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide text-center mb-3">Quick Login</p>
            <div className="flex flex-col gap-2">
              {[
                { label: "Admin", email: "admin@smartinventory.io", color: "bg-[#1e2e14] text-white hover:bg-[#2d4020]" },
                { label: "Warehouse Manager", email: "warehouse@smartinventory.io", color: "bg-[#edf2ed] text-[#1e2e14] hover:bg-[#d4e6c3]" },
                { label: "Sales Manager", email: "sales@smartinventory.io", color: "bg-[#edf2ed] text-[#1e2e14] hover:bg-[#d4e6c3]" },
              ].map(({ label, email: demoEmail, color }) => (
                <button key={demoEmail} type="button" onClick={() => fillDemo(demoEmail)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between ${color}`}>
                  <span>{label}</span>
                  <span className="opacity-60 font-normal">{demoEmail}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-3">
              Password: <span className="font-mono font-semibold">password123</span>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
