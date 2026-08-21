import { NextResponse } from "next/server";
import {
  mapInviteeRow,
  type InviteeDatabaseRow,
} from "@/lib/invite-mapper";
import { mapRSVPRow, type RSVPDatabaseRow } from "@/lib/rsvp-mapper";
import { getSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  if (!hasSupabaseEnv()) {
    try {
      const fs = require("fs");
      const path = require("path");
      const cachePath = path.join(process.cwd(), "invitees-cache.json");
      if (fs.existsSync(cachePath)) {
        const raw = fs.readFileSync(cachePath, "utf8");
        const invitees = JSON.parse(raw) as any[];
        const invitee = invitees.find((item) => item.token === token);
        if (invitee) {
          return NextResponse.json({
            backend: "local-cache",
            invitee: { ...invitee, notes: "" },
          });
        }
        return NextResponse.json({ error: "Invite not found" }, { status: 404 });
      }
    } catch (err) {
      console.error("Failed to read invitees cache:", err);
    }
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const supabase = getSupabaseServerClient();
  const { data: inviteeRow, error: inviteeError } = await supabase
    .from("invitees")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (inviteeError) {
    return NextResponse.json({ error: inviteeError.message }, { status: 500 });
  }

  if (!inviteeRow) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  const invitee = inviteeRow as InviteeDatabaseRow;
  const rsvpResult = await supabase
    .from("rsvp_responses")
    .select("*")
    .or(`invite_token.eq.${token},invitee_id.eq.${invitee.id}`)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (rsvpResult.error) return NextResponse.json({ error: rsvpResult.error.message }, { status: 500 });

  const rsvp = rsvpResult.data ? mapRSVPRow(rsvpResult.data as RSVPDatabaseRow) : undefined;
  const mappedInvitee = mapInviteeRow(invitee, undefined, rsvp);

  return NextResponse.json({
    backend: "supabase",
    invitee: { ...mappedInvitee, notes: "" },
  });
}
