import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useCurrentMember() {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsClaim, setNeedsClaim] = useState(false);
  const [pendingMemberId, setPendingMemberId] = useState(null);

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
          if (!cancelled) {
            setMember(null);
            setNeedsClaim(false);
            setPendingMemberId(null);
          }
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

        // 2) Fallback: try matching by email so we can warn the user that they still
        // need to run the explicit claim flow. We no longer auto-link rows here.
        let requiresClaim = false
        let pendingId = null

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
              if (!byEmail.auth_user_id) {
                console.info(
                  "[useCurrentMember] Member row is still unclaimed; prompting user to claim via UI instead of auto-linking."
                );
                requiresClaim = true
                pendingId = byEmail.id
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
              "[useCurrentMember] No member row found for this user. Check members table or have the user claim their account."
            );
            setNeedsClaim(requiresClaim);
            setPendingMemberId(requiresClaim ? pendingId : null);
            setMember(null);
          } else {
            const normalized = {
              ...foundMember,
              member_id: foundMember.member_id || foundMember.id,
            };
            setNeedsClaim(false);
            setPendingMemberId(null);
            setMember(normalized);
          }
        }
      } catch (err) {
        console.error("[useCurrentMember] Fatal error:", err);
        if (!cancelled) {
          setMember(null);
          setNeedsClaim(false);
          setPendingMemberId(null);
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

  return { member, loading, needsClaim, pendingMemberId };
}
