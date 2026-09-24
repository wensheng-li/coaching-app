"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

import type { CoachingSession, SessionFormValues } from "@/types/session";

import SessionForm from "./SessionForm";

interface Props {
  user: User;
}

export default function Dashboard({ user }: Props) {
  const [sessions, setSessions] = useState<CoachingSession[]>([]);

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [editingSession, setEditingSession] = useState<CoachingSession | null>(
    null,
  );

  // Fetch only the sessions that belong to the current coach. This keeps the list
  // scoped to the signed-in user and prevents one coach from seeing another coach's data.
  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("coach_id", user.id)
      .order("start_time", {
        ascending: true,
      });

    if (error) {
      setError("Unable to load your sessions.");
      setSessions([]);
    } else {
      setSessions(data ?? []);
    }

    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    let isActive = true;

    const fetchSessions = async () => {
      try {
        await loadSessions();
      } finally {
        if (!isActive) {
          return;
        }
      }
    };

    void fetchSessions();

    return () => {
      isActive = false;
    };
  }, [loadSessions]);

  // Update and create follow the same form values, but the database action changes
  // depending on whether we are editing an existing session or creating a new one.
  async function saveSession(values: SessionFormValues) {
    setError("");
    setNotice("");

    if (editingSession) {
      const { data, error } = await supabase
        .from("sessions")
        .update({
          ...values,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingSession.id)
        .eq("coach_id", user.id)
        .select("id");

      if (error) throw error;

      if (!data?.length) {
        throw new Error("Session not found or access denied.");
      }

      setNotice("Session updated.");
    } else {
      const { error } = await supabase.from("sessions").insert({
        ...values,
        coach_id: user.id,
        status: "scheduled",
      });

      if (error) throw error;

      setNotice("Session created.");
    }

    setEditingSession(null);
    setShowForm(false);

    await loadSessions();
  }

  async function cancelSession(session: CoachingSession) {
    const confirmed = window.confirm(`Cancel "${session.title}"?`);

    if (!confirmed) return;

    setBusyId(session.id);
    setError("");
    setNotice("");

    try {
      const { data, error } = await supabase
        .from("sessions")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.id)
        .eq("coach_id", user.id)
        .eq("status", "scheduled")
        .select("id");

      if (error) throw error;

      if (!data?.length) {
        throw new Error("Session not found or already cancelled.");
      }

      setNotice("Session cancelled.");

      await loadSessions();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to cancel session.",
      );
    } finally {
      setBusyId(null);
    }
  }

  if (loading && sessions.length === 0) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <p role="status">Loading sessions...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Sessions</h1>

          <p className="text-sm text-gray-600">{user.email}</p>
        </div>

        <button
          onClick={() => supabase.auth.signOut()}
          className="rounded border px-4 py-2"
        >
          Logout
        </button>
      </header>
      {error && (
        <p role="alert" className="mb-4 text-red-600">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mb-4 text-green-700">
          {notice}
        </p>
      )}
      {!showForm && (
        <button
          onClick={() => {
            setEditingSession(null);
            setShowForm(true);
          }}
          className="mb-6 rounded bg-blue-600 px-4 py-2 text-white"
        >
          Create Session
        </button>
      )}

      {showForm && (
        <div className="mb-6">
          <SessionForm
            key={editingSession?.id ?? "new"}
            initialSession={editingSession ?? undefined}
            onSave={saveSession}
            onCancel={() => {
              setEditingSession(null);
              setShowForm(false);
            }}
          />
        </div>
      )}
      {!loading && sessions.length === 0 && (
        <p>No sessions yet. Create your first session.</p>
      )}
      <div className="space-y-4">
        {sessions.map((session) => (
          <article key={session.id} className="rounded border p-4">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-semibold">{session.title}</h2>

              <span className="text-sm">{session.status}</span>
            </div>

            {session.description && (
              <p className="mt-2">{session.description}</p>
            )}

            <p className="mt-3 text-sm">
              Start: {new Date(session.start_time).toLocaleString()}
            </p>

            <p className="text-sm">
              End: {new Date(session.end_time).toLocaleString()}
            </p>

            {session.status === "scheduled" && (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => {
                    setEditingSession(session);
                    setShowForm(true);
                  }}
                  className="rounded border px-4 py-2"
                >
                  Edit
                </button>

                <button
                  onClick={() => cancelSession(session)}
                  disabled={busyId === session.id}
                  className="rounded border px-4 py-2 disabled:opacity-50"
                >
                  {busyId === session.id ? "Cancelling..." : "Cancel Session"}
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
      {error && sessions.length === 0 && (
        <button
          onClick={() => void loadSessions()}
          className="mt-4 rounded border px-4 py-2"
        >
          Retry
        </button>
      )}
    </main>
  );
}
