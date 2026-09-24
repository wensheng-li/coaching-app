/**
 * Type definitions for session management in the application.
 */
export type SessionStatus = "scheduled" | "cancelled" | "completed";

export interface CoachingSession {
  id: string;
  coach_id: string;
  title: string;
  description: string | null;
  start_time: string; // ISO 8601 format
  end_time: string; // ISO 8601 format
  status: SessionStatus;
  created_at: string; // ISO 8601 format
  updated_at: string; // ISO 8601 format
}

export interface SessionFormValues {
  title: string;
  description: string;
  start_time: string; // ISO 8601 format
  end_time: string; // ISO 8601 format
}
