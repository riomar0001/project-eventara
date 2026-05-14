import { redirect } from 'next/navigation';

export default function LegacyMyEventsPage() {
  redirect('/profile');
}
