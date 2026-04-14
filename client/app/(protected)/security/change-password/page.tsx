import { redirect } from 'next/navigation';

export default function ChangePasswordRedirectPage() {
  redirect('/security');
}
