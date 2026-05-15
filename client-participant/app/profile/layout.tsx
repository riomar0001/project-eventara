import { Footer } from '@/components/footer/footer';
import { Navbar } from '@/components/navigation/navbar';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}
