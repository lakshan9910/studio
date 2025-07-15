import { ShoppingCart } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-card border-b p-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-lg">
            <ShoppingCart className="text-primary h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Cashy</h1>
        </div>
        <p className="text-sm text-muted-foreground hidden sm:block">The Modern Mini POS</p>
      </div>
    </header>
  );
}
