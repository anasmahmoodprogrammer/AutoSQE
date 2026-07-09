import type { Metadata } from 'next';
import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI-Powered Quality Engineering & Documentation',
  description: 'Automate your software quality engineering pipeline with AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main className="py-5">
          {children}
        </main>
      </body>
    </html>
  );
}
