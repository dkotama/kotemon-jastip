import { useState, useEffect } from 'react';
import { Eye, Weight, Package, Clock, Sparkles, Box, AlertTriangle, Calendar, X, PackageX } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { JastipItem } from '@/types';

interface ItemDetailModalProps {
  item: JastipItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const statusConfig = {
  new: {
    label: 'New',
    className: 'bg-blue-500 text-white',
  },
  low_stock: {
    label: 'Low Stock',
    className: 'bg-amber-400 text-amber-950',
  },
  full: {
    label: 'Full',
    className: 'bg-red-400 text-white',
  },
  available: {
    label: 'Available',
    className: 'bg-emerald-500 text-white',
  },
};

export function ItemDetailModal({ item, isOpen, onClose }: ItemDetailModalProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset state when item changes
  useEffect(() => {
    if (item) {
      setSelectedImage(0);
      setImageLoaded(false);
    }
  }, [item]);

  if (!item) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Use photos array or fallback to single image
  const images = item.photos?.length > 0 ? item.photos : [item.image];

  // Calculate slot percentage (assuming original total is slots + orders already made)
  // If slots is 0, it's full
  const isFull = item.slots <= 0;
  const slotsPercentage = isFull ? 0 : Math.min(100, (item.slots / (item.slots + 5)) * 100);

  // Build info notes from backend flags and infoNotes array
  const infoNotes: { type: 'amber' | 'purple' | 'blue' | 'red'; text: string }[] = [];
  
  // Add automatic notes from boolean flags (matching design spec colors)
  if (item.withoutBoxNote) {
    infoNotes.push({ type: 'amber', text: 'Dikirim tanpa box/dus - Untuk menghindari pajak bea cukai' });
  }
  if (item.isLimitedEdition) {
    infoNotes.push({ type: 'purple', text: 'Limited Edition - Stok terbatas, siapa cepat dia dapat!' });
  }
  if (item.isPreorder) {
    infoNotes.push({ type: 'blue', text: 'Pre-order - Estimasi pengiriman lebih lama' });
  }
  if (item.isFragile) {
    infoNotes.push({ type: 'red', text: 'Fragile - Barang mudah pecah, akan dikemas extra aman' });
  }
  
  // Add custom info notes from backend (if any)
  if (item.infoNotes && item.infoNotes.length > 0) {
    item.infoNotes.forEach(note => {
      // Avoid duplicates by checking if similar text already exists
      const isDuplicate = infoNotes.some(existing => 
        existing.text.toLowerCase().includes(note.text.toLowerCase()) ||
        note.text.toLowerCase().includes(existing.text.toLowerCase())
      );
      if (!isDuplicate) {
        infoNotes.push({ type: note.type, text: note.text });
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-6xl w-[95vw] h-[90vh] md:h-auto md:max-h-[90vh] p-0 overflow-hidden bg-background rounded-2xl flex flex-col md:block">
        <DialogClose className="absolute right-4 top-4 z-50 rounded-full bg-white/80 p-1 opacity-70 hover:opacity-100 transition-opacity backdrop-blur-sm">
          <X className="h-5 w-5 text-gray-900" />
        </DialogClose>

        <div className="flex flex-col md:grid md:grid-cols-2 h-full overflow-hidden">
          {/* Left Side - Image Gallery */}
          <div className="bg-muted p-4 md:p-6 flex-shrink-0">
            {/* Main Image */}
            <div className="relative aspect-video md:aspect-square rounded-xl overflow-hidden bg-white shadow-sm mb-3 md:mb-4 mx-auto max-h-[30vh] md:max-h-none">
              <img
                src={images[selectedImage]}
                alt={item.name}
                className={`w-full h-full object-contain md:object-cover transition-opacity duration-200 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 px-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedImage(idx);
                      setImageLoaded(false);
                    }}
                    className={`flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${selectedImage === idx
                      ? 'border-blue-500 ring-2 ring-blue-500/20'
                      : 'border-transparent hover:border-gray-300'
                      }`}
                  >
                    <img
                      src={img}
                      alt={`${item.name} - ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Side - Details */}
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-background relative">
            <ScrollArea className="h-full flex-1 overflow-y-auto">
              <div className="p-4 md:p-6 pb-24 md:pb-6">
                <DialogHeader className="mb-4 text-left">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Badge
                        className={`${statusConfig[item.status].className} mb-2`}
                      >
                        {statusConfig[item.status].label}
                      </Badge>
                      <DialogTitle className="text-xl md:text-2xl font-bold text-foreground leading-tight">
                        {item.name}
                      </DialogTitle>
                    </div>
                  </div>

                  {/* View Count */}
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                    <Eye className="h-4 w-4" />
                    <span>{item.views} dilihat</span>
                  </div>
                </DialogHeader>

                {/* Price */}
                <div className="mb-6">
                  <p className="text-2xl md:text-3xl font-bold text-primary">
                    {formatPrice(item.price)}
                  </p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
                  <div className="bg-muted rounded-xl p-3 md:p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Weight className="h-4 w-4" />
                      <span className="text-xs md:text-sm">Berat</span>
                    </div>
                    <p className="text-base md:text-lg font-semibold text-foreground">
                      {item.weight}g
                    </p>
                  </div>

                  <div className="bg-muted rounded-xl p-3 md:p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Package className="h-4 w-4" />
                      <span className="text-xs md:text-sm">Slot Tersedia</span>
                    </div>
                    <p
                      className={`text-base md:text-lg font-semibold ${isFull
                        ? 'text-red-500'
                        : slotsPercentage <= 30
                          ? 'text-amber-500'
                          : 'text-emerald-500'
                        }`}
                    >
                      {item.slots > 0 ? `${item.slots} slot` : 'Full'}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    Deskripsi
                  </h4>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Info Notes */}
                {infoNotes.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-foreground mb-2">
                      Informasi Penting
                    </h4>
                    <div className="space-y-2">
                      {infoNotes.map((note, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-2 p-3 rounded-lg border text-xs md:text-sm ${note.type === 'amber' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                            note.type === 'purple' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                              note.type === 'blue' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                                'bg-red-50 text-red-800 border-red-200'
                            }`}
                        >
                          {note.type === 'amber' && <PackageX className="h-4 w-4 flex-shrink-0 mt-0.5" />}
                          {note.type === 'purple' && <Sparkles className="h-4 w-4 flex-shrink-0 mt-0.5" />}
                          {note.type === 'blue' && <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" />}
                          {note.type === 'red' && <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />}
                          <span>{note.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Mobile Sticky Footer / Desktop Static Button */}
            <div className="p-4 md:p-6 border-t border-border mt-auto md:bg-transparent bg-background absolute md:static bottom-0 left-0 right-0 z-10 md:z-auto">
              <Button
                disabled={isFull}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg md:shadow-none"
                onClick={() => {
                  alert('Pesan sekarang!');
                }}
              >
                <Clock className="h-4 w-4 mr-2" />
                {isFull ? 'Slot Penuh' : 'Pesan Sekarang'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
