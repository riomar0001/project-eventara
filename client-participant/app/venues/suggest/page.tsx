import { Navbar } from '@/components/navigation/navbar';
import { SuggestForm } from '@/components/venue-hub/suggest-form';
import { SuggestSidebar } from '@/components/venue-hub/suggest-sidebar';

export default function SuggestVenuePage() {
  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-[1240px] px-6 py-10 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
          <SuggestForm />
          <SuggestSidebar />
        </div>
      </div>
    </div>
  );
}
