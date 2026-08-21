import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/admin-auth";
import { revalidateSharedInvitation } from "@/lib/invite-share-cache";
import { parseInviteCsv, type Invitee } from "@/lib/invites";
import {
  mapInviteeRow as mapInviteRow,
  toInviteeUpsert,
  type InviteeDatabaseRow,
} from "@/lib/invite-mapper";
import { mapRSVPRow, type RSVPDatabaseRow } from "@/lib/rsvp-mapper";
import { getSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase-server";
import { isMissingSupabaseColumn } from "@/lib/supabase-errors";
import {
  createInviteeFromSimpleEntry,
  getSimpleInviteEntryOptions,
  type SimpleInviteEntry,
} from "@/lib/invite-spreadsheet";

export const dynamic = "force-dynamic";

type AdminInvitePayload = {
  invitees?: Invitee[];
  csv?: string;
  simpleInviteEntry?: SimpleInviteEntry;
  coupleDisplayName?: string;
  existingTokens?: string[];
};

export async function GET() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({
      backend: "local",
      invitees: [],
      simpleInviteEntryOptions: getSimpleInviteEntryOptions(),
    });
  }

  const supabase = getSupabaseServerClient();
  const [
    inviteesResult,
    responsesResult,
  ] = await Promise.all([
    supabase.from("invitees").select("*").order("updated_at", { ascending: false }),
    supabase.from("rsvp_responses").select("*").order("submitted_at", { ascending: false }),
  ]);

  if (inviteesResult.error) return NextResponse.json({ error: inviteesResult.error.message }, { status: 500 });
  if (responsesResult.error) return NextResponse.json({ error: responsesResult.error.message }, { status: 500 });

  const responsesByKey = new Map<string, RSVPDatabaseRow>();
  for (const response of (responsesResult.data ?? []) as RSVPDatabaseRow[]) {
    if (response.invitee_id) responsesByKey.set(`id:${response.invitee_id}`, response);
    if (response.invite_token) responsesByKey.set(`token:${response.invite_token}`, response);
    if (response.display_label && !responsesByKey.has(`label:${response.display_label.trim().toLowerCase()}`)) {
      responsesByKey.set(`label:${response.display_label.trim().toLowerCase()}`, response);
    }
    if (response.name && !responsesByKey.has(`name:${response.name.trim().toLowerCase()}`)) {
      responsesByKey.set(`name:${response.name.trim().toLowerCase()}`, response);
    }
  }

  const invitees = (inviteesResult.data ?? []).map((row) => {
    const invitee = mapInviteRow(row as InviteeDatabaseRow);
    const response =
      responsesByKey.get(`id:${invitee.id}`) ||
      responsesByKey.get(`token:${invitee.token}`) ||
      responsesByKey.get(`label:${invitee.displayLabel.trim().toLowerCase()}`) ||
      responsesByKey.get(`name:${invitee.guestName.trim().toLowerCase()}`);
    return response ? { ...invitee, rsvp: mapRSVPRow(response) } : invitee;
  });
  const rawResponses = ((responsesResult.data ?? []) as RSVPDatabaseRow[]).map(mapRSVPRow);

  return NextResponse.json({
    backend: "supabase",
    invitees,
    responses: rawResponses,
    simpleInviteEntryOptions: getSimpleInviteEntryOptions(),
  });
}

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as AdminInvitePayload;
  let invitees = body.invitees ?? (body.csv ? parseInviteCsv(body.csv).invitees : []);

  if (body.simpleInviteEntry) {
    try {
      const existingTokens = new Set(body.existingTokens ?? []);
      if (hasSupabaseEnv()) {
        const tokenResult = await getSupabaseServerClient().from("invitees").select("token");
        if (tokenResult.error) return NextResponse.json({ error: tokenResult.error.message }, { status: 500 });
        for (const row of tokenResult.data ?? []) {
          if (typeof row.token === "string") existingTokens.add(row.token);
        }
      }
      invitees = [createInviteeFromSimpleEntry(
        body.simpleInviteEntry,
        existingTokens,
        { coupleDisplayName: body.coupleDisplayName },
      )];
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Thông tin khách không hợp lệ." }, { status: 400 });
    }
  }

  if (invitees.length === 0) {
    return NextResponse.json({ error: "No invitees provided" }, { status: 400 });
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ ok: true, backend: "local", invitees });
  }

  const supabase = getSupabaseServerClient();
  const upsertPayloads = invitees.map((invitee) => ({
    ...toInviteeUpsert(invitee),
    created_at: invitee.createdAt,
  }));
  let mutation = await supabase
    .from("invitees")
    .upsert(upsertPayloads, { onConflict: "token" })
    .select("*");

  let migrationRequired = false;
  if (isMissingSupabaseColumn(mutation.error, "terracotta_lodging_eligible")) {
    migrationRequired = true;
    const legacyPayloads = upsertPayloads.map((payload) => Object.fromEntries(
      Object.entries(payload).filter(([key]) => key !== "terracotta_lodging_eligible"),
    ));
    mutation = await supabase
      .from("invitees")
      .upsert(legacyPayloads, { onConflict: "token" })
      .select("*");
  }

  const { data, error } = mutation;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  for (const row of data ?? []) {
    revalidateSharedInvitation(String(row.token ?? ""));
  }

  return NextResponse.json({
    ok: true,
    backend: "supabase",
    invitees: (data ?? []).map((row) => mapInviteRow(row as InviteeDatabaseRow)),
    migrationRequired,
  });
}
