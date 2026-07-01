import { requireAuth } from "@/lib/auth/session";
import { getMySessions } from "@/lib/actions/sessions";
import ProfileForm from "./profile-form";

export default async function ProfilePageWrapper() {
  const user = await requireAuth();
  const sessions = await getMySessions();
  return <ProfileForm user={user} sessions={sessions} />;
}
