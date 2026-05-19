import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Whatsell',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-primary">Whatsell</h1>
        <p className="text-sm text-text-muted mt-1">Votre agent commercial 24h/24</p>
      </div>
      <div className="w-full max-w-sm">
        {children}
      </div>
    </main>
  );
}
