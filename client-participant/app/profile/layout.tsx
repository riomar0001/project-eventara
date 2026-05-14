import { Navbar } from '@/components/navigation/navbar';
import { Footer } from '@/components/footer/footer';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}
