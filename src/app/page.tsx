"use client";

import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

import AuthForm from "@/components/AuthForm";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Read the current session once when the page mounts and keep the UI in sync
    // with any later auth state changes. This also prevents stale state updates
    // after the component unmounts.
    async function initialiseAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (active) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    }

    void initialiseAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      if (active) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <p className="p-6">Loading...</p>;
  }

  return user ? <Dashboard key={user.id} user={user} /> : <AuthForm />;
}
