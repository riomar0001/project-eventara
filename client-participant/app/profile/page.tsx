import { ProfileView } from '@/components/profile/profile-view';

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-[1240px] px-8 py-10">
      <div className="mb-7">
        <span className="inline-flex items-center gap-2.5 font-mono text-xs tracking-widest text-muted-foreground uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_12px_var(--lime-glow)]" />
          PROFILE
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-foreground">My Profile</h1>
      </div>
      <ProfileView />
    </div>
  );
}
