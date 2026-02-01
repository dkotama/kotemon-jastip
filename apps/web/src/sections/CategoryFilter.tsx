import { useRef, useState } from 'react';
import {
  LayoutGrid,
  Cookie,
  Sparkles,
  Palette,
  PenTool,
  Gift,
  Coffee,
  KeyRound
} from 'lucide-react';
import type { ItemCategory } from '@/types';

type FilterCategory = ItemCategory | 'all';

interface CategoryFilterProps {
  selectedCategory: FilterCategory;
  onCategoryChange: (category: FilterCategory) => void;
}

interface FilterCategoryOption {
  id: FilterCategory;
  label: string;
  icon: string;
}

const categories: FilterCategoryOption[] = [
  { id: 'all', label: 'Semua', icon: 'LayoutGrid' },
  { id: 'snack', label: 'Snack', icon: 'Cookie' },
  { id: 'skincare', label: 'Skincare', icon: 'Sparkles' },
  { id: 'makeup', label: 'Makeup', icon: 'Palette' },
  { id: 'stationery', label: 'Stationery', icon: 'PenTool' },
  { id: 'gift', label: 'Gift', icon: 'Gift' },
  { id: 'beverage', label: 'Minuman', icon: 'Coffee' },
  { id: 'accessories', label: 'Aksesoris', icon: 'KeyRound' },
];

const iconMap: Record<string, React.ElementType> = {
  LayoutGrid,
  Cookie,
  Sparkles,
  Palette,
  PenTool,
  Gift,
  Coffee,
  KeyRound,
};

export function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Handle mouse drag scrolling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Handle touch scrolling
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollRef.current) return;
    setStartX(e.touches[0].pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!scrollRef.current) return;
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <section className="sticky top-16 z-40 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Horizontal scrollable category pills */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          {categories.map((category) => {
            const Icon = iconMap[category.icon];
            const isSelected = selectedCategory === category.id;

            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap
                  transition-all duration-200 ease-out
                  ${isSelected
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-105'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                  }
                `}
              >
                <Icon className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium">{category.label}</span>
              </button>
            );
          })}
        </div>

        {/* Fade indicators for scroll */}
        {/* Fade indicators for scroll removed for flat design */}
      </div>

      {/* Custom CSS to hide scrollbar */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
