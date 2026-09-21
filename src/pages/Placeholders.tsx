// Placeholder pages to satisfy routing
import Layout from '@/components/layout/Layout';

export function PlaceholderPage({ name }: { name: string }) {
  return (
    <div className="py-20 text-center space-y-4">
      <h1 className="text-4xl font-black">{name} Page</h1>
      <p className="text-muted-foreground text-lg">This page is coming soon to KibabuiMart!</p>
    </div>
  );
}

// Map each page to a placeholder
export default function Pages() { return null; }
