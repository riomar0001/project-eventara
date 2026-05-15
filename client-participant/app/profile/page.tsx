import { ProfileView } from '@/components/profile/profile-view';

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-[1240px] px-8 py-10">
      <div className="mb-7">
        <span className="text-muted-foreground inline-flex items-center gap-2.5 font-mono text-xs tracking-widest uppercase">
          <span className="bg-primary h-1.5 w-1.5 rounded-full shadow-[0_0_12px_var(--lime-glow)]" />
          PROFILE
        </span>
        <h1 className="text-foreground mt-3 text-3xl font-bold tracking-[-0.03em]">My Profile</h1>
      </div>
      <ProfileView />
    </div>
  );
}
