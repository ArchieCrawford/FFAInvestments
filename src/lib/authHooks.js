import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useCurrentMember() {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadMember = async () => {
      setLoading(true);
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("[useCurrentMember] Error getting session:", sessionError);
        }

        if (!session) {
          console.warn("[useCurrentMember] No auth session found.");
          if (!cancelled) setMember(null);
          return;
        }

        const user = session.user;
        console.log("[useCurrentMember] Auth user:", {
          id: user.id,
          email: user.email,
        });

        let foundMember = null;

        // 1) Try auth_user_id first (ideal path)
        try {
          const { data, error } = await supabase
            .from("members")
            .select("*")
            .eq("auth_user_id", user.id)
            .maybeSingle();

          if (error && error.code !== "PGRST116") {
            console.error("[useCurrentMember] Error querying by auth_user_id:", error);
          }

          if (data) {
            console.log("[useCurrentMember] Found member by auth_user_id:", data.id);
            foundMember = data;
          }
        } catch (err) {
          console.error("[useCurrentMember] Unexpected error querying by auth_user_id:", err);
        }

        // 2) Fallback: try matching by email
        if (!foundMember && user.email) {
          try {
            const { data: byEmail, error: byEmailError } = await supabase
              .from("members")
              .select("*")
              .eq("email", user.email)
              .maybeSingle();

            if (byEmailError && byEmailError.code !== "PGRST116") {
              console.error("[useCurrentMember] Error querying by email:", byEmailError);
            }

            if (byEmail) {
              console.log("[useCurrentMember] Found member by email:", byEmail.id);

              // 2a) If this member row hasn't been claimed yet, attach auth_user_id now
              if (!byEmail.auth_user_id) {
                console.log(
                  "[useCurrentMember] Claiming member row by attaching auth_user_id:",
                  user.id
                );
                const { data: updated, error: updateError } = await supabase
                  .from("members")
                  .update({ auth_user_id: user.id })
                  .eq("id", byEmail.id)
                  .select("*")
                  .maybeSingle();

                if (updateError) {
                  console.error(
                    "[useCurrentMember] Error updating member.auth_user_id:",
                    updateError
                  );
                  foundMember = byEmail; // fall back to original
                } else if (updated) {
                  foundMember = updated;
                } else {
                  foundMember = byEmail;
                }
              } else {
                foundMember = byEmail;
              }
            }
          } catch (err) {
            console.error("[useCurrentMember] Unexpected error querying by email:", err);
          }
        }

        if (!cancelled) {
          if (!foundMember) {
            console.warn(
              "[useCurrentMember] No member row found for this user. Check members table."
            );
          }
          setMember(foundMember);
        }
      } catch (err) {
        console.error("[useCurrentMember] Fatal error:", err);
        if (!cancelled) {
          setMember(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadMember();

    return () => {
      cancelled = true;
    };
  }, []);

  return { member, loading };
}
