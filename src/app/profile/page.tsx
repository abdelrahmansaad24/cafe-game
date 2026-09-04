"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface UserProfileData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  hasPassword: boolean;
  createdAt: string;
}

const AVATAR_SUGGESTIONS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
  "https://api.dicebear.com/7.x/bottts/svg?seed=CafeMaster",
  "https://api.dicebear.com/7.x/bottts/svg?seed=LuckyPlayer",
];

export default function ProfilePage() {
  const router = useRouter();
  const { status, update: updateSession } = useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfileData | null>(null);

  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageLoadError, setImageLoadError] = useState(false);

  // Password fields
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      let isMounted = true;
      fetch("/api/user/profile")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load profile");
          return res.json();
        })
        .then((data) => {
          if (!isMounted) return;
          setProfile(data.user);
          setName(data.user.name || "");
          setImageUrl(data.user.image || "");
          setIsLoading(false);
        })
        .catch((err) => {
          if (!isMounted) return;
          console.error(err);
          setFeedback({ type: "error", text: "Failed to load your profile." });
          setIsLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [status, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (name.trim().length > 0 && name.trim().length < 2) {
      setFeedback({ type: "error", text: "Name must be at least 2 characters long." });
      return;
    }

    if (newPassword) {
      if (newPassword.length < 8) {
        setFeedback({ type: "error", text: "New password must be at least 8 characters long." });
        return;
      }
      if (newPassword !== confirmPassword) {
        setFeedback({ type: "error", text: "New passwords do not match." });
        return;
      }
      if (profile?.hasPassword && !currentPassword) {
        setFeedback({ type: "error", text: "Please enter your current password to set a new password." });
        return;
      }
    }

    setIsSaving(true);

    try {
      const payload: {
        name?: string;
        image?: string;
        currentPassword?: string;
        newPassword?: string;
      } = {
        name: name.trim(),
        image: imageUrl.trim(),
      };

      if (newPassword) {
        payload.newPassword = newPassword;
        if (currentPassword) {
          payload.currentPassword = currentPassword;
        }
      }

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setFeedback({ type: "error", text: data.error || "Failed to update profile." });
        setIsSaving(false);
        return;
      }

      setFeedback({ type: "success", text: "Your profile has been successfully updated!" });
      setProfile((prev) => (prev ? { ...prev, ...data.user, hasPassword: prev.hasPassword || Boolean(newPassword) } : null));

      // Reset password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordSection(false);

      // Refresh next-auth session in browser
      await updateSession({
        name: data.user.name,
        image: data.user.image,
      });

      router.refresh();
    } catch {
      setFeedback({ type: "error", text: "A network error occurred while updating profile." });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || status === "loading") {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-2xl flex-col justify-center px-4 sm:px-6 py-12">
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-8 text-center text-sm text-zinc-500">
          Loading your profile...
        </div>
      </main>
    );
  }

  const effectiveImageUrl = imageUrl.trim();

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-2xl flex-col px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
            Edit Profile
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Update your avatar picture link, display name, and password.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3.5 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {feedback ? (
        <div
          className={`mt-6 rounded-2xl border p-4 text-xs font-semibold ${
            feedback.type === "success"
              ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
              : "border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300"
          }`}
        >
          {feedback.text}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Avatar Section */}
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-6 shadow-sm backdrop-blur-md">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
            <span>🖼️</span> Profile Picture (Image Link)
          </h2>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Live Avatar Preview */}
            <div className="relative flex-shrink-0">
              <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-indigo-500/40 bg-zinc-100 dark:bg-zinc-800 shadow-md flex items-center justify-center">
                {effectiveImageUrl && !imageLoadError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={effectiveImageUrl}
                    alt={name || "Avatar"}
                    className="h-full w-full object-cover"
                    onError={() => setImageLoadError(true)}
                    onLoad={() => setImageLoadError(false)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-zinc-400">
                    <span className="text-3xl">☕</span>
                    <span className="text-[10px] font-bold mt-1 text-zinc-500 uppercase">
                      {name ? name.slice(0, 2).toUpperCase() : "CAFE"}
                    </span>
                  </div>
                )}
              </div>
              {effectiveImageUrl && !imageLoadError ? (
                <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
              ) : null}
            </div>

            <div className="flex-1 w-full space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Image URL (Direct link - no file upload)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setImageLoadError(false);
                    }}
                    placeholder="https://example.com/my-photo.jpg"
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500"
                  />
                  {imageUrl ? (
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl("");
                        setImageLoadError(false);
                      }}
                      className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
                {imageLoadError && effectiveImageUrl ? (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    ⚠️ Could not load image from this URL. Please verify the link is a direct public image address.
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    Paste any public image link (Unsplash, Discord avatar, Gravatar, Imgur, etc.).
                  </p>
                )}
              </div>

              {/* Sample Avatar Suggestions */}
              <div>
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">
                  Or pick a sample avatar:
                </span>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_SUGGESTIONS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setImageUrl(url);
                        setImageLoadError(false);
                      }}
                      className="h-8 w-8 rounded-full overflow-hidden border border-zinc-300 dark:border-zinc-700 hover:scale-110 hover:border-indigo-500 transition cursor-pointer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Avatar ${i + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Info Section */}
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-6 shadow-sm backdrop-blur-md space-y-4">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <span>👤</span> Personal Info
          </h2>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              minLength={2}
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ahmed or KingOfGames"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="flex items-center gap-2">
              <input
                type="email"
                disabled
                value={profile?.email || ""}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/60 px-3.5 py-2.5 text-sm text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
              />
              <span className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                Account
              </span>
            </div>
            <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              Email is linked to your account and game progress.
            </p>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-6 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <span>🔒</span> Security & Password
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {profile?.hasPassword
                  ? "Update your existing password"
                  : "Set a password for your account"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowPasswordSection(!showPasswordSection);
                if (showPasswordSection) {
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }
              }}
              className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              {showPasswordSection ? "Cancel Change" : "Change Password"}
            </button>
          </div>

          {showPasswordSection ? (
            <div className="mt-5 space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              {profile?.hasPassword ? (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Current Password
                  </label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500"
                  />
                </div>
              ) : null}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type your new password"
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/dashboard"
            className="rounded-xl border border-zinc-300 dark:border-zinc-700 px-5 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            {isSaving ? "Saving Changes..." : "Save Changes"}
          </button>
        </div>
      </form>
    </main>
  );
}
