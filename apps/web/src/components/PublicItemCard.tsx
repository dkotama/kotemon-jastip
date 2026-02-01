import { useState, useEffect, useRef } from 'react';
import { Eye, Weight, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { JastipItem } from '@/types';

// Status config reused
const statusConfig = {
    new: {
        label: 'New',
        className: 'bg-blue-500 text-white hover:bg-blue-500',
    },
    low_stock: {
        label: 'Low Stock',
        className: 'bg-amber-400 text-amber-950 hover:bg-amber-400',
    },
    full: {
        label: 'Full',
        className: 'bg-red-400 text-white hover:bg-red-400',
    },
    available: {
        label: 'Available',
        className: 'bg-emerald-500 text-white hover:bg-emerald-500',
    },
};

interface PublicItemCardProps {
    item: Partial<JastipItem> & { name: string; price: number }; // Ensure min requirement
    onClick?: () => void;
    index?: number;
}

export function PublicItemCard({
    item,
    onClick,
    index = 0,
}: PublicItemCardProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        setIsVisible(true);
                    }, index * 50);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => observer.disconnect();
    }, [index]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const slots = item.slots ?? 0;
    const isLowStock = slots <= 2 && slots > 0;
    const isFull = slots <= 0;
    const statusKey = item.status || 'available';
    const status = statusConfig[statusKey] || statusConfig['available'];

    // Handle image: item.image (legacy), item.photos[0] (admin), or placeholder
    const imageUrl = item.image
        ? item.image
        : (item.photos && item.photos.length > 0 ? item.photos[0] : '');

    // Helper to ensure full URL if relative
    const getFullImageUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        // If it's a blob url (preview), return as is
        if (url.startsWith('blob:')) return url;
        // If relative, assume api base
        const hostname = window.location.hostname;
        const baseUrl = (hostname === 'localhost' || hostname === '127.0.0.1')
            ? 'http://localhost:8787'
            : 'https://jastip.dkotama.com';

        if (url.startsWith('/api')) return `${baseUrl}${url}`;
        return `${baseUrl}/api/public/photos/${url}`;
    };

    const displayImage = getFullImageUrl(imageUrl);

    return (
        <div
            ref={cardRef}
            onClick={onClick}
            className={`group cursor-pointer bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                }`}
            style={{
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 400ms cubic-bezier(0.4, 0, 0.2, 1) ${index * 50}ms, transform 400ms cubic-bezier(0.4, 0, 0.2, 1) ${index * 50}ms`,
            }}
        >
            {/* Image Container */}
            <div className="relative aspect-square overflow-hidden bg-muted">
                {displayImage ? (
                    <img
                        src={displayImage}
                        alt={item.name}
                        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageLoaded(true)} // Keep visible on error or handle fallback? 
                    />
                ) : (
                    <div className="flex items-center justify-center w-full h-full text-gray-400">
                        <Package className="h-10 w-10" />
                    </div>
                )}

                {!imageLoaded && displayImage && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                    <Badge className={`${status.className} text-xs font-medium px-2.5 py-1`}>
                        {status.label}
                    </Badge>
                </div>

                {/* View Count */}
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Eye className="h-3 w-3" />
                    <span>{item.views || 0}</span>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="font-semibold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors duration-200">
                    {item.name}
                </h3>

                <p className="text-lg font-bold text-primary mb-3">
                    {formatPrice(item.price)}
                </p>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Weight className="h-3.5 w-3.5" />
                        <span>{item.weight || 0}g</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5" />
                        <span
                            className={`font-medium ${isFull
                                ? 'text-red-500'
                                : isLowStock
                                    ? 'text-amber-500'
                                    : 'text-emerald-500'
                                }`}
                        >
                            {isFull ? 'Full' : `${slots} slot${slots !== 1 ? 's' : ''}`}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
