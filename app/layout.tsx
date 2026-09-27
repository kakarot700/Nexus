import type { Metadata } from 'next';
import DraftTools from './DraftTools';
import './globals.css';
import './draft.css';

export const metadata: Metadata = {
  title: 'NEXUS — Work through a problem',
  description: 'Turn a complex problem into an evidence-aware decision.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<DraftTools/></body></html>;
}
