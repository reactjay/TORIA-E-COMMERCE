import { useState } from "react";
import { StoreHeader } from "@/components/store/header";
import { StoreFooter } from "@/components/store/footer";
import { MobileNav } from "@/components/store/mobile-nav";
import { SearchDialog } from "@/components/store/search-dialog";
import type { Category, Product } from "@/lib/types";

export function StoreShell({
  children,
  categories,
  products,
}: {
  children: React.ReactNode;
  categories: Category[];
  products: Product[];
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <div className="min-h-dvh bg-cream text-charcoal">
      <StoreHeader categories={categories} onSearch={() => setSearchOpen(true)} />
      <main>{children}</main>
      <StoreFooter />
      <MobileNav onSearch={() => setSearchOpen(true)} />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} products={products} />
    </div>
  );
}
