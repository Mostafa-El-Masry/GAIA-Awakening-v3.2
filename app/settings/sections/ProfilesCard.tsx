"use client";

import { useEffect, useState } from "react";
import { useAuthSnapshot } from "@/lib/auth-client";
import {
  getItem,
  setItem,
  waitForUserStorage,
  subscribe,
} from "@/lib/user-storage";
import {
  createAdminPermissionSet,
  createEmptyPermissionSet,
  type PermissionSet,
  getCreatorAdminEmail,
} from "@/config/permissions";

type SavedProfile = {
  email: string;
  name: string;
  savedAt: string;
  role?: "Creator" | "User"; // Creator or regular User
  permissions: PermissionSet;
};

const PROFILES_KEY = "gaia.saved-profiles";
const LOCAL_PROFILES_KEY = "gaia.saved-profiles.local"; // localStorage backup

export default function ProfilesCard() {
  const { profile, status } = useAuthSnapshot();
  const [profiles, setProfiles] = useState<SavedProfile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editingCurrentProfile, setEditingCurrentProfile] = useState(false);
  const [currentProfileName, setCurrentProfileName] = useState("");

  const currentEmail = profile?.email ?? status?.email ?? null;
  const currentName = profile?.name?.trim() ?? null;

  // Get saved name for current email if it exists
  const savedCurrentProfile = profiles.find((p) => p.email === currentEmail);
  const isCreator = currentEmail?.toLowerCase() === getCreatorAdminEmail();
  // Show saved name, or "Creator" for admin, or "(not set)" for others
  const displayName =
    savedCurrentProfile?.name || (isCreator ? "Creator" : null);

  // Load saved profiles on mount and subscribe to updates
  useEffect(() => {
    let cancelled = false;

    const loadProfiles = async () => {
      await waitForUserStorage();
      if (cancelled) return;

      // Try to load from Supabase first
      const raw = getItem(PROFILES_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as SavedProfile[];
          setProfiles(parsed);
          // Also backup to localStorage
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(parsed));
          }
          return;
        } catch {
          // Fall through to localStorage
        }
      }

      // Fall back to localStorage if Supabase fails
      if (typeof window !== "undefined") {
        const localRaw = localStorage.getItem(LOCAL_PROFILES_KEY);
        if (localRaw) {
          try {
            const parsed = JSON.parse(localRaw) as SavedProfile[];
            setProfiles(parsed);
            return;
          } catch {
            setProfiles([]);
          }
        }
      }
    };

    loadProfiles();

    // Subscribe to storage changes from other devices/tabs
    const unsubscribe = subscribe(({ key, value }) => {
      if (key !== PROFILES_KEY || cancelled) return;
      if (value) {
        try {
          const parsed = JSON.parse(value) as SavedProfile[];
          setProfiles(parsed);
          // Also backup to localStorage
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(parsed));
          }
        } catch {
          setProfiles([]);
        }
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const saveCurrentProfile = () => {
    if (!currentEmail || !newName.trim()) return;

    const isCreator = currentEmail.toLowerCase() === getCreatorAdminEmail();
    const newProfile: SavedProfile = {
      email: currentEmail,
      name: newName.trim(),
      savedAt: new Date().toISOString(),
      role: isCreator ? "Creator" : "User",
      permissions: isCreator
        ? createAdminPermissionSet()
        : createEmptyPermissionSet(),
    };

    const updated = [
      newProfile,
      ...profiles.filter((p) => p.email !== currentEmail),
    ];
    setProfiles(updated);
    setItem(PROFILES_KEY, JSON.stringify(updated));
    // Backup to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(updated));
    }
    setNewName("");
    setShowForm(false);
  };

  const removeProfile = (email: string) => {
    const updated = profiles.filter((p) => p.email !== email);
    setProfiles(updated);
    setItem(PROFILES_KEY, JSON.stringify(updated));
    // Backup to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(updated));
    }
  };

  const startEditingProfile = (email: string, currentName: string) => {
    setEditingEmail(email);
    setEditName(currentName);
  };

  const saveEditedProfile = (email: string) => {
    if (!editName.trim()) return;

    const updated = profiles.map((p) =>
      p.email === email ? { ...p, name: editName.trim() } : p
    );
    setProfiles(updated);
    setItem(PROFILES_KEY, JSON.stringify(updated));
    // Backup to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(updated));
    }
    setEditingEmail(null);
    setEditName("");
  };

  const cancelEditingProfile = () => {
    setEditingEmail(null);
    setEditName("");
  };

  const startEditingCurrentProfile = () => {
    setEditingCurrentProfile(true);
    setCurrentProfileName(displayName || "");
  };

  const saveCurrentProfileName = () => {
    if (!currentProfileName.trim() || !currentEmail) return;

    const isCreator = currentEmail.toLowerCase() === getCreatorAdminEmail();
    const newProfile: SavedProfile = {
      email: currentEmail,
      name: currentProfileName.trim(),
      savedAt: new Date().toISOString(),
      role: isCreator ? "Creator" : "User",
      permissions: isCreator
        ? createAdminPermissionSet()
        : createEmptyPermissionSet(),
    };

    const updated = [
      newProfile,
      ...profiles.filter((p) => p.email !== currentEmail),
    ];
    setProfiles(updated);
    setItem(PROFILES_KEY, JSON.stringify(updated));
    // Backup to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(updated));
    }
    setEditingCurrentProfile(false);
    setCurrentProfileName("");
  };

  const cancelEditingCurrentProfile = () => {
    setEditingCurrentProfile(false);
    setCurrentProfileName("");
  };

  return (
    <section className="space-y-3 rounded-lg border gaia-border p-4">
      <h2 className="font-medium">Saved User Profiles</h2>
      <p className="text-sm gaia-muted">
        Save your profile information for quick access across sessions.
      </p>

      {currentEmail && (
        <div className="mt-4 rounded-md bg-blue-500/10 border border-blue-400/30 p-3">
          <div className="text-sm font-medium mb-2">Current Profile</div>
          <div className="text-xs gaia-muted space-y-2">
            <div>Email: {currentEmail}</div>
            {editingCurrentProfile ? (
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-medium block mb-1">
                    Name:
                  </label>
                  <input
                    type="text"
                    value={currentProfileName}
                    onChange={(e) => setCurrentProfileName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full rounded border gaia-border px-2 py-1.5 text-sm"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveCurrentProfileName}
                    disabled={!currentProfileName.trim()}
                    className="rounded border px-3 py-1 text-xs gaia-contrast disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditingCurrentProfile}
                    className="rounded border gaia-border px-3 py-1 text-xs gaia-hover-soft"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span>Name: {displayName || "(not set)"}</span>
                    {currentEmail?.toLowerCase() === getCreatorAdminEmail() && (
                      <span className="text-xs font-semibold rounded px-1.5 py-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-400">
                        Creator
                      </span>
                    )}
                  </div>
                  {currentEmail?.toLowerCase() === getCreatorAdminEmail() && (
                    <div className="text-xs gaia-muted mt-1">
                      ✓ All permissions
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={startEditingCurrentProfile}
                  className="text-blue-400 hover:bg-blue-500/10 rounded px-2 py-1"
                  title="Edit name"
                >
                  ✎
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showForm ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveCurrentProfile();
          }}
          className="mt-3 space-y-2 rounded-md border gaia-border p-3"
        >
          <label className="text-xs font-medium">Display Name</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter display name"
            className="w-full rounded border gaia-border px-2 py-1.5 text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!newName.trim()}
              className="rounded border px-3 py-1 text-sm gaia-contrast disabled:opacity-50"
            >
              Save Profile
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setNewName("");
              }}
              className="rounded border gaia-border px-3 py-1 text-sm gaia-hover-soft"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded border px-3 py-1 text-sm gaia-contrast"
        >
          Save Current Profile
        </button>
      )}

      {profiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide gaia-muted">
            Saved Profiles ({profiles.length})
          </h3>
          <div className="space-y-2">
            {profiles.map((p) => (
              <div
                key={p.email}
                className="flex items-center justify-between rounded-md border gaia-border p-2.5"
              >
                {editingEmail === p.email ? (
                  <div className="min-w-0 flex-1 space-y-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Enter display name"
                      className="w-full rounded border gaia-border px-2 py-1 text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => saveEditedProfile(p.email)}
                        disabled={!editName.trim()}
                        className="rounded border px-2 py-1 text-xs gaia-contrast disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditingProfile}
                        className="rounded border gaia-border px-2 py-1 text-xs gaia-hover-soft"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">{p.name}</div>
                        {p.role && (
                          <span
                            className={`text-xs font-semibold rounded px-1.5 py-0.5 ${
                              p.role === "Creator"
                                ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                                : "bg-blue-500/20 text-blue-700 dark:text-blue-400"
                            }`}
                          >
                            {p.role}
                          </span>
                        )}
                      </div>
                      <div className="text-xs gaia-muted truncate">
                        {p.email}
                      </div>
                      <div className="text-[11px] gaia-muted">
                        Saved {new Date(p.savedAt).toLocaleDateString()}
                      </div>
                      {p.permissions && (
                        <div className="mt-1 text-[10px] gaia-muted">
                          {Object.values(p.permissions).filter(Boolean)
                            .length === Object.keys(p.permissions).length
                            ? "✓ All permissions"
                            : `${
                                Object.values(p.permissions).filter(Boolean)
                                  .length
                              } permissions`}
                        </div>
                      )}
                    </div>
                    <div className="ml-3 flex gap-1">
                      <button
                        type="button"
                        onClick={() => startEditingProfile(p.email, p.name)}
                        className="rounded px-2 py-1 text-xs text-blue-400 hover:bg-blue-500/10"
                        title="Edit profile name"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => removeProfile(p.email)}
                        className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
                        title="Remove profile"
                      >
                        ✕
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
