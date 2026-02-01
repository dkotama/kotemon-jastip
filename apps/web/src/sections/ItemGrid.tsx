import { SearchX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { JastipItem, ItemCategory } from '@/types';
import { PublicItemCard } from '@/components/PublicItemCard';

interface ItemGridProps {
  items: JastipItem[];
  onItemClick: (item: JastipItem) => void;
  searchQuery?: string;
  selectedCategory?: ItemCategory | 'all';
  loading?: boolean;
}

const categoryLabels: Record<ItemCategory, string> = {
  snack: 'Snack',
  skincare: 'Skincare',
  makeup: 'Makeup',
  stationery: 'Stationery',
  gift: 'Gift',
  beverage: 'Minuman',
  accessories: 'Aksesoris',
};

function ItemCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
      <Skeleton className="aspect-square w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

export function ItemGrid({ items, onItemClick, searchQuery, selectedCategory = 'all', loading }: ItemGridProps) {
  const displayCategory = selectedCategory && selectedCategory !== 'all'
    ? (categoryLabels[selectedCategory as ItemCategory] || 'Semua Kategori')
    : 'Semua Kategori';

  return (
    <section className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{displayCategory}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? 'Memuat...' : `${items.length} item tersedia`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ItemCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <SearchX className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">
            Tidak ada item ditemukan
          </h3>
          <p className="text-muted-foreground">
            {searchQuery
              ? `Tidak ada hasil untuk "${searchQuery}"`
              : 'Tidak ada item dalam kategori ini'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item, index) => (
            <PublicItemCard
              key={item.id}
              item={{
                ...item,
                price: item.price ?? item.sellingPriceRp ?? 0,
                weight: item.weight ?? item.weightGrams ?? 0,
                slots: item.slots ?? (item.maxOrders ?? 0) - (item.currentOrders ?? 0),
              }}
              onClick={() => onItemClick(item)}
              index={index}
            />
          ))}
        </div>
      )}
    </section>
  );
}


