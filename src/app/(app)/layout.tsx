import { redirect } from 'next/navigation';
import { isAuthed } from '@/lib/session';
import { RecordSheetProvider } from '@/components/RecordSheet';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAuthed())) redirect('/login');
  return <RecordSheetProvider>{children}</RecordSheetProvider>;
}
