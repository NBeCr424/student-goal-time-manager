import { Suspense } from "react";
import { ProfilePage } from "@/components/profile/profile-page";

export default function ProfileRoutePage() {
  return (
    <Suspense fallback={<div className="card-surface p-4 text-sm text-ink/65">加载中...</div>}>
      <ProfilePage />
    </Suspense>
  );
}
