import { redirect } from 'next/navigation';

// The root URL is an internal tool — redirect to admin
export default function Home() {
  redirect('/admin');
}
