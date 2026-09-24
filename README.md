# Coaching Booking App

## Overview

A small coaching booking manangement application built with Next.js, TypeScript, and Supabase.  
Coaches can create accounts, sign in, and manage their own sessions.  
PostgreSQL **Row Level Security (RLS)** is used to enforced data isolation between coaches.

## Tech Stack

- Next.js (App Router)
- React and TypeScript
- Tailwind CSS (Not much applied in this assignment)
- Supabase Authentication
- Supabase PostgreSQL
- PostgreSQL Row Level Security

## Features

- Coach sign-up and login
- Create a session
- View own sessions
- Edit a scheduled session
- Cancel a session
- Form validation
- Loading and error states
- Database-level access control

## Database Structure

The `sessions` table contains:
| Column | Purpose |
| -------- | -------- |
| `id` | Unique session identifier |
| `coach_id` | References the authenticated coach |
| `title` | Session title |
| `description` | Optional description |
| `start_time` | Session start timestamp |
| `end_time` | Session end timestamp |
| `status` | `scheduled` or `cancelled` |
| `created_at` | Creation timestamp |
| `updated_at` | Last modification timestamp |

## Authentication and Security

Supabase Auth manages coach authentication.  
Each session is associated with a coach through `coach_id`.  
Row Level Security is enabled on the `sessions` table. Authenticated coaches can only select, insert, and update sessions associated with their own user ID.  
The application uses a Supabase publishable key in the browser. No service role key is exposed to the client.  
Cancellation is implemented as a status update rather than a permanent deletion.

## Assumption

- Each session belong to one coach,
- Coaches manage only their own sessions.
  - Sessions have 2 status: `scheduled` and `cancelled`.
  - A cancelled session remains visible for historical reference.
  - Session completion tracking is outside the scope of this assignment.
- Payments, customer bookings, and notifications are outside the scope of this assignment.
- Times are stored as timestamp values with time zone support and displayed in the user's local time zone.

## Local Setup

1. Clone the repository.
2. Run `npm install` .
3. Create a Supabase project.
4. Run `supabase/schema.sql` in the Supabase SQL Editor.
5. Copy `.env.example` to `.env.local`.
6. Add the Supabase project URL and publishable key.
7. Run `npm run dev`.
8. Open `http://localhost:300`.

## Testing

Document the tests actually performed, including:

- Authentication and session management
- Create, read, update and cancel operations
- Required-field and date validation
- Data isolation between two coach accounts _`Check the details below`_
- Unauthorised read and update attempts
- Production build verification

### Row Level Security Testing

- **Coach A** could access and manage their own sessions.
- **Coach A** could not read **Coach B's** session by querying its ID directly.
- **Coach A **could not update **Coach B's** session.
- **Coach A** could not create a session using **Coach B's** `user ID`.
- The same ownership restrictions were verfied for Coach B.

These checks were performed through the Supabase client using authencated user sessions, rather than relying on UI filtering.

## Future Improvements

Potential future improvements include automated end-to-end test, session conflict detection, and more comprehensive error handling.
