import { NextResponse } from "next/server";
import { mapRSVPRow, type RSVPDatabaseRow } from "@/lib/rsvp-mapper";
import { rsvpWishSchema } from "@/lib/rsvp-wish";
import { getSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const parsedBody = rsvpWishSchema.safeParse(await request.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message || "Lời chúc không hợp lệ." },
      { status: 400 },
    );
  }

  const { token } = await params;
  const supabase = getSupabaseServerClient();
  const { data: invitee, error: inviteeError } = await supabase
    .from("invitees")
    .select("id")
    .eq("token", token)
    .maybeSingle();

  if (inviteeError) return NextResponse.json({ error: inviteeError.message }, { status: 500 });
  if (!invitee) return NextResponse.json({ error: "Không tìm thấy lời mời." }, { status: 404 });

  let responseResult = await supabase
    .from("rsvp_responses")
    .select("*")
    .eq("invitee_id", invitee.id)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!responseResult.data && !responseResult.error) {
    responseResult = await supabase
      .from("rsvp_responses")
      .select("*")
      .eq("invite_token", token)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
  }

  if (responseResult.error) {
    return NextResponse.json({ error: responseResult.error.message }, { status: 500 });
  }
  if (!responseResult.data) {
    return NextResponse.json(
      { error: "Quý khách vui lòng gửi lời hồi đáp trước khi gửi lời chúc." },
      { status: 404 },
    );
  }
  const mappedExistingResponse = mapRSVPRow(responseResult.data as RSVPDatabaseRow);
  if (mappedExistingResponse.wishMessage) {
    return NextResponse.json({
      error: "Lời chúc đã được ghi nhận trước đó.",
      response: mappedExistingResponse,
    }, { status: 409 });
  }

  const wishSentAt = new Date().toISOString();
  const { data: updatedResponse, error: updateError } = await supabase
    .from("rsvp_responses")
    .update({
      wish_message: parsedBody.data.message,
      wish_sent_at: wishSentAt,
    })
    .eq("id", responseResult.data.id)
    .is("wish_message", null)
    .select("*")
    .maybeSingle();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  if (!updatedResponse) {
    const concurrentResult = await supabase
      .from("rsvp_responses")
      .select("*")
      .eq("id", responseResult.data.id)
      .maybeSingle();
    return NextResponse.json({
      error: "Lời chúc đã được ghi nhận trước đó.",
      response: concurrentResult.data
        ? mapRSVPRow(concurrentResult.data as RSVPDatabaseRow)
        : undefined,
    }, { status: 409 });
  }

  return NextResponse.json({
    response: mapRSVPRow(updatedResponse as RSVPDatabaseRow),
    backend: "supabase",
  }, { status: 201 });
}
