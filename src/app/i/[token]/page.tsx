import { InviteTokenPage } from "@/components/InviteTokenPage";

export default async function TokenInviteRoute({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <InviteTokenPage token={token} />;
}
