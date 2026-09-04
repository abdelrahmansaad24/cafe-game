"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP flow states
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // Submit states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSendOtp() {
    if (!phone || phone.trim().length < 8) {
      setError("Please enter your registered WhatsApp phone number.");
      return;
    }

    setError(null);
    setIsSendingOtp(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not send verification code. Please check your number.");
        setIsSendingOtp(false);
        return;
      }

      setOtpSent(true);
      if (data.devOtpCode) {
        setOtpCode(data.devOtpCode);
      }

      // Start 60s cooldown timer
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
      setError("Network error occurred while requesting code.");
    } finally {
      setIsSendingOtp(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!otpSent) {
      setError("Please request a WhatsApp verification code first.");
      return;
    }

    if (otpCode.trim().length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          otpCode: otpCode.trim(),
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not reset password. Please verify the code.");
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch {
      setError("Network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center px-4 sm:px-6 py-12">
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-7 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xl border border-indigo-200/50 dark:border-indigo-800/50">
            📱
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">Reset Password</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">استعادة كلمة المرور عبر رسالة SMS</p>
          </div>
        </div>

        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Enter your registered phone number to receive a 6-digit SMS verification code.
        </p>

        {success ? (
          <div className="mt-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-2xl">
              ✅
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Password Reset Successfully!
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Your password has been changed. Redirecting to sign in page...
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition shadow-md shadow-indigo-600/20"
              >
                Sign in now →
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {/* Phone input with Send Code */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                <span className="mb-1.5 block">Phone Number (رقم الهاتف)</span>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    required
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
                      ? `${otpTimer}s`
                      : otpSent
                      ? "Resend Code"
                      : "Send SMS 📩"}
                  </button>
                </div>
              </label>
            </div>

            {/* OTP Code and New Password fields reveal once code is sent */}
            {otpSent ? (
              <div className="space-y-4 pt-2 border-t border-zinc-200 dark:border-zinc-800 animate-fadeIn">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
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

                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  <span className="mb-1.5 block">New Password (كلمة المرور الجديدة)</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    maxLength={128}
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500 transition"
                  />
                </label>

                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  <span className="mb-1.5 block">Confirm New Password</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    maxLength={128}
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500 transition"
                  />
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show-passwords"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="show-passwords" className="text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
                    Show passwords
                  </label>
                </div>
              </div>
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
              {isSubmitting ? "Resetting Password..." : "Reset Password"}
            </button>

            <p className="mt-4 text-center text-xs text-zinc-600 dark:text-zinc-400">
              Remember your password?{" "}
              <Link href="/login" className="font-bold text-indigo-600 dark:text-indigo-400 underline">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
