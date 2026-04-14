import { redirect } from 'next/navigation';

export default function UserPage() {
  redirect('/admin/user/profile');
}
