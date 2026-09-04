"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FormEvent, useEffect, useState } from "react";

interface UserProfile {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  image: string | null;
  role: string;
  createdAt: string;
  hasPassword?: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status, update: updateSession } = useSession();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageError, setImageError] = useState(false);

  // Password fields
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  // Status banners
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/profile");
      return;
    }

    if (status === "authenticated") {
      fetch("/api/user/profile")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load profile");
          return res.json();
        })
        .then((data) => {
          if (data.user) {
            setProfile(data.user);
            setName(data.user.name || "");
            setPhone(data.user.phone || "");
            setImageUrl(data.user.image || "");
          }
        })
        .catch((err) => {
          console.error(err);
          setMessage({ type: "error", text: "Could not load profile data." });
        })
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);

    if (showPasswordSection && newPassword) {
      if (newPassword.length < 8) {
        setMessage({
          type: "error",
          text: "New password must be at least 8 characters long.",
        });
        return;
      }
      if (newPassword !== confirmPassword) {
        setMessage({
          type: "error",
          text: "New password and confirmation do not match.",
        });
        return;
      }
    }

    setSaving(true);

    try {
      const payload: {
        name: string;
        phone?: string;
        image: string;
        currentPassword?: string;
        newPassword?: string;
      } = {
        name,
        phone: phone.trim() || undefined,
        image: imageUrl.trim(),
      };

      if (showPasswordSection && newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.error || "Failed to update profile.",
        });
        setSaving(false);
        return;
      }

      setMessage({ type: "success", text: "Profile updated successfully! 🎉" });
      setProfile((prev) => (prev ? { ...prev, ...data.user } : data.user));

      // Reset password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordSection(false);

      // Trigger session update so navbar reflects changes immediately
      if (updateSession) {
        await updateSession();
      }
    } catch {
      setMessage({
        type: "error",
        text: "Network error occurred while saving profile.",
      });
    } finally {
      setSaving(false);
    }
  }

  const avatarFallback = (profile?.name || profile?.phone || profile?.email || "U")
    .slice(0, 2)
    .toUpperCase();

  const sampleAvatars = [
    "https://api.dicebear.com/7.x/bottts/svg?seed=Felix",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Luna",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=CafePlayer",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Midnight",
  ];

  if (loading || status === "loading") {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-2xl flex-col items-center justify-center px-4 py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading your profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-2xl flex-col px-4 sm:px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition"
            >
              ← Dashboard
            </Link>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
            Edit Profile
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Update your nickname, profile picture link, WhatsApp number, or password.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          Back to Lobby
        </Link>
      </div>

      {message ? (
        <div
          className={`mb-6 rounded-2xl border p-4 text-xs font-medium transition ${
            message.type === "success"
              ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
              : "border-red-200 dark:border-red-900/60 bg-red-50/90 dark:bg-red-950/40 text-red-800 dark:text-red-300"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-6 sm:p-8 shadow-sm backdrop-blur-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Preview & URL */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
            <div className="relative group">
              <div className="h-24 w-24 rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-indigo-500/20 border-2 border-white dark:border-zinc-800">
                {imageUrl && !imageError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt={name || "Profile"}
                    className="h-full w-full object-cover"
                    onError={() => setImageError(true)}
                    onLoad={() => setImageError(false)}
                  />
                ) : (
                  <span>{avatarFallback}</span>
                )}
              </div>
              {imageUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl("");
                    setImageError(false);
                  }}
                  title="Remove custom image"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center hover:bg-red-500 shadow cursor-pointer"
                >
                  ✕
                </button>
              ) : null}
            </div>

            <div className="flex-1 w-full space-y-2 text-center sm:text-left">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Profile Avatar (صورة الحساب)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Provide a direct image URL link (e.g. from Discord, Imgur, or any web link). No upload needed.
              </p>

              <div className="pt-1">
                <input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImageError(false);
                  }}
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500 transition"
                />
              </div>

              {imageError ? (
                <p className="text-[11px] text-red-500 font-medium">
                  ⚠️ Could not load image from this URL. Please check the link.
                </p>
              ) : null}

              {/* Sample avatar links */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                <span className="text-[11px] text-zinc-400">Presets:</span>
                {sampleAvatars.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setImageUrl(url);
                      setImageError(false);
                    }}
                    className="text-[11px] rounded-lg px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                  >
                    Avatar {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-4">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              <span className="mb-1.5 block">Display Name / Nickname (الاسم أو اللقب)</span>
              <input
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ahmed"
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500 transition"
              />
            </label>

            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              <span className="mb-1.5 block">WhatsApp Number (رقم الواتساب)</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 01012345678 or +201..."
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500 transition"
              />
            </label>
          </div>

          {/* Password Change Section */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Password & Security (كلمة المرور)
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Update your account password.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                {showPasswordSection ? "Cancel" : "Change Password"}
              </button>
            </div>

            {showPasswordSection ? (
              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  <span className="mb-1 block">Current Password (كلمة المرور الحالية)</span>
                  <input
                    type={showPasswords ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500 transition"
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    <span className="mb-1 block">New Password (الجديدة)</span>
                    <input
                      type={showPasswords ? "text" : "password"}
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500 transition"
                    />
                  </label>

                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    <span className="mb-1 block">Confirm Password (تأكيد)</span>
                    <input
                      type={showPasswords ? "text" : "password"}
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500 transition"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="show-profile-passwords"
                    checked={showPasswords}
                    onChange={(e) => setShowPasswords(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="show-profile-passwords"
                    className="text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer"
                  >
                    Show password characters
                  </label>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/dashboard"
              className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-4 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition disabled:opacity-60 cursor-pointer shadow-md shadow-indigo-600/20"
            >
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
