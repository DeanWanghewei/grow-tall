import { redirect } from 'next/navigation';
import { isAuthed } from '@/lib/session';

export default async function Root() {
  redirect((await isAuthed()) ? '/home' : '/login');
}
