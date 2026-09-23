"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Package, Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const json = await res.json();
        setServerError(json.error || "Login failed. Please try again.");
      }
    } catch {
      setServerError("Network error. Please check your connection.");
    }
  };

  return (
    <div className="min-h-screen bg-[#edf2ed] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#6b8a4e] rounded-2xl mb-4 shadow-lg">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#1e2e14]">Smart Inventory</h1>
          <p className="text-[#5a7040] mt-1 text-sm">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#d4ddd4] p-8">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Server error */}
            {serverError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {serverError}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-[#1e2e14]">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
                className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors
                  ${errors.email
                    ? "border-red-400 bg-red-50 focus:border-red-500"
                    : "border-[#d4ddd4] bg-white focus:border-[#6b8a4e]"
                  } text-[#1e2e14] placeholder:text-[#aab8a0]`}
                placeholder="you@company.com"
              />
              {errors.email && (
                <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-[#1e2e14]">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  {...register("password")}
                  className={`w-full px-4 py-3 pr-11 rounded-xl border text-sm outline-none transition-colors
                    ${errors.password
                      ? "border-red-400 bg-red-50 focus:border-red-500"
                      : "border-[#d4ddd4] bg-white focus:border-[#6b8a4e]"
                    } text-[#1e2e14] placeholder:text-[#aab8a0]`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a7040] hover:text-[#1e2e14] transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-600 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#6b8a4e] hover:bg-[#5a7640] disabled:opacity-60 disabled:cursor-not-allowed
                text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-4 text-center text-xs text-[#5a7040] bg-white/60 rounded-xl px-4 py-3 border border-[#d4ddd4]">
          <span className="font-medium">Demo accounts:</span> admin@smartinventory.io · warehouse@smartinventory.io · sales@smartinventory.io
          <br />
          <span className="font-medium">Password:</span> password123
        </div>
      </div>
    </div>
  );
}
