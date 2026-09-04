"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

export default function SignupPage() {
  const router = useRouter();

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [password, setPassword] = useState("");

  // OTP states
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // Submit states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSendOtp() {
    if (!phone || phone.trim().length < 8) {
      setError("Please enter a valid phone number first.");
      return;
    }

    setError(null);
    setIsSendingOtp(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          purpose: "SIGNUP",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send verification code. Please check the phone number.");
        setIsSendingOtp(false);
        return;
      }

      setOtpSent(true);
      if (data.devOtpCode) {
        setOtpCode(data.devOtpCode);
      }
      setSuccessMessage(data.message || "Verification code sent to your phone via SMS! Check your messages 📩");

      // Start 60-second cooldown timer
      setOtpTimer(60);
      const interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setError("Network error while sending verification code.");
    } finally {
      setIsSendingOtp(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!otpSent) {
      setError("Please request an SMS verification code first.");
      return;
    }

    if (!otpCode || otpCode.trim().length !== 6) {
      setError("Please enter the 6-digit verification code received by SMS.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          phone: phone.trim(),
          otpCode: otpCode.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not create your account.");
        setIsSubmitting(false);
        return;
      }

      // Automatically sign in
      const signInResult = await signIn("credentials", {
        phoneOrEmail: phone.trim(),
        password,
        redirect: false,
      });

      setIsSubmitting(false);

      if (signInResult?.error) {
        router.push("/login");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Failed to complete signup. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center px-4 sm:px-6 py-12">
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-7 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xl border border-indigo-200/50 dark:border-indigo-800/50">
            📱
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">Create account</h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">انضم لألعاب القهوة عبر رقم الهاتف والـ SMS</p>
          </div>
        </div>

        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Enter your phone number to receive a 6-digit SMS verification code. No email required!
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            <span className="mb-1.5 block">Name / Nickname (الاسم أو اللقب)</span>
            <input
              type="text"
              name="name"
              minLength={2}
              maxLength={80}
              autoComplete="name"
              placeholder="e.g. Ahmed"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500 transition"
            />
          </label>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              <span className="mb-1.5 block">Phone Number (رقم الهاتف)</span>
              <div className="flex gap-2">
                <input
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="01012345678 or +201..."
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setOtpSent(false);
                  }}
                  className="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp || otpTimer > 0}
                  className="rounded-xl bg-indigo-600 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap shadow-xs"
                >
                  {isSendingOtp
                    ? "Sending..."
                    : otpTimer > 0
                    ? `Resend in ${otpTimer}s`
                    : otpSent
                    ? "Resend SMS"
                    : "Send SMS 📩"}
                </button>
              </div>
            </label>
            <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              Enter with or without country code (e.g. 010..., +201..., +44...)
            </p>
          </div>

          {/* 6-Digit OTP Code */}
          {otpSent ? (
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider animate-fadeIn">
              <div className="mb-1.5 flex items-center justify-between">
                <span>SMS 6-Digit Code (كود التحقق)</span>
                <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                  Code sent via SMS
                </span>
              </div>
              <input
                type="text"
                required
                maxLength={6}
                pattern="[0-9]{6}"
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-xl border border-indigo-400 dark:border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 px-3.5 py-2.5 text-center text-lg font-mono font-bold tracking-widest text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500 transition"
              />
            </label>
          ) : null}

          {/* Password */}
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            <span className="mb-1.5 block">Password (كلمة المرور)</span>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500 transition"
            />
          </label>

          {successMessage ? (
            <p className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              {successMessage}
            </p>
          ) : null}

          {error ? (
            <p className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-2.5 text-xs text-red-700 dark:text-red-300 font-medium">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || !otpSent}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-500 transition disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer shadow-md shadow-indigo-600/20"
          >
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-zinc-600 dark:text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-indigo-600 dark:text-indigo-400 underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
