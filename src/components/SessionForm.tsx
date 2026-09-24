"use client";

import { useState } from "react";
import type { CoachingSession, SessionFormValues } from "@/types/session";

interface Props {
  initialSession?: CoachingSession;
  onSave: (values: SessionFormValues) => Promise<void>;
  onCancel: () => void;
}

// datetime-local expects a local wall-clock string like "2026-09-24T14:30".
// The database stores ISO timestamps in UTC, so we convert them back into the
// user's local timezone before showing them in the form.
function toLocalInputValue(iso: string) {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function SessionForm({
  initialSession,
  onSave,
  onCancel,
}: Props) {
  const [title, setTitle] = useState(initialSession?.title ?? "");

  const [description, setDescription] = useState(
    initialSession?.description ?? "",
  );

  const [startTime, setStartTime] = useState(
    initialSession ? toLocalInputValue(initialSession.start_time) : "",
  );

  const [endTime, setEndTime] = useState(
    initialSession ? toLocalInputValue(initialSession.end_time) : "",
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Session title is required.");
      return;
    }

    if (!startTime || !endTime) {
      setError("Start and end times are required.");
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // We validate both the parse result and the actual ordering. A session cannot
    // end before it starts, and invalid timestamps are rejected before hitting Supabase.
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError("Please enter valid dates and times.");
      return;
    }

    if (end <= start) {
      setError("End time must be after start time.");
      return;
    }

    setSaving(true);

    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save session.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded border p-4">
      <h2 className="text-xl font-semibold">
        {initialSession ? "Edit Session" : "Create Session"}
      </h2>

      <label className="block">
        <span>Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          required
          className="mt-1 w-full rounded border p-2"
        />
      </label>

      <label className="block">
        <span>Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full rounded border p-2"
        />
      </label>

      <label className="block">
        <span>Start time</span>
        <input
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
          className="mt-1 w-full rounded border p-2"
        />
      </label>

      <label className="block">
        <span>End time</span>
        <input
          type="datetime-local"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          required
          className="mt-1 w-full rounded border p-2"
        />
      </label>

      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Session"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded border px-4 py-2"
        >
          Back
        </button>
      </div>
    </form>
  );
}
