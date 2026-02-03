
import { useState } from 'react';
import { useCartStore } from '@/stores/useCartStore';
import { ordersApi } from '@/api/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function CartDrawer() {
    const {
        items,
        isOpen,
        toggleCart,
        removeItem,
        updateQuantity,
        clearCart,
        totalPrice,
        totalWeight,
        toggleCustomItemModal
    } = useCartStore();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleCheckout = async () => {
        try {
            setIsSubmitting(true);

            const payload = {
                items: items.map(item => ({
                    itemId: item.itemId,
                    itemName: item.name,
                    quantity: item.quantity,
                    isCustom: item.isCustom,
                    customUrl: item.customUrl,
                    customNote: item.customNote,
                    customSource: item.customSource
                })),
                notes: '' // Add notes field later if needed
            };

            const { id } = await ordersApi.createOrder(payload);

            clearCart();
            toggleCart(false);
            toast.success('Order placed successfully!');
            // Navigate to order success/detail page?
            // For now maybe to orders list?
            navigate('/orders'); // Need to create this route
        } catch (error) {
            console.error('Checkout failed:', error);
            toast.error('Failed to place order. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(price);
    };

    return (
        <Sheet open={isOpen} onOpenChange={toggleCart}>
            <SheetContent className="w-full sm:max-w-md flex flex-col h-full">
                <SheetHeader>
                    <SheetTitle>Shopping Cart ({items.length})</SheetTitle>
                    <SheetDescription>
                        Review your items before checkout.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-hidden py-4 px-4">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                            <ShoppingBag className="h-16 w-16 opacity-20" />
                            <p>Your cart is empty.</p>
                            <Button variant="outline" onClick={() => toggleCart(false)}>Start Shopping</Button>
                        </div>
                    ) : (
                        <ScrollArea className="h-full pr-4">
                            <div className="space-y-4">
                                {items.map((item) => (
                                    <div key={item.id} className="flex gap-4">
                                        {/* Image */}
                                        <div className="h-20 w-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden border">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">No Img</div>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
                                                    {item.isCustom && <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">Custom Request</span>}
                                                </div>
                                                <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="mt-1 text-sm font-semibold text-blue-600">
                                                {item.price > 0 ? formatPrice(item.price) : 'Price TBD'}
                                            </div>

                                            {/* Quantity Control */}
                                            <div className="mt-2 flex items-center gap-2">
                                                <Button
                                                    variant="outline" size="icon" className="h-6 w-6"
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="text-sm w-4 text-center">{item.quantity}</span>
                                                <Button
                                                    variant="outline" size="icon" className="h-6 w-6"
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                <div className="space-y-4 py-4 border-t px-4">
                    {/* Custom Item Trigger */}
                    <div className="bg-blue-50 p-3 rounded-md flex justify-between items-center">
                        <div className="text-sm text-blue-800">
                            <p className="font-medium">Want something else?</p>
                            <p className="text-xs opacity-80">Request a custom item from any JP store.</p>
                        </div>
                        <Button size="sm" variant="secondary" onClick={() => { toggleCart(false); toggleCustomItemModal(true); }}>
                            Request Item
                        </Button>
                    </div>

                    <Separator />

                    <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Total Weight (Est.)</span>
                            <span>{totalWeight() > 0 ? `${totalWeight()}g` : 'TBD'}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total Price</span>
                            <span>{formatPrice(totalPrice())}</span>
                        </div>
                        <p className="text-xs text-gray-400 text-right">Excluding shipping & generic info</p>
                    </div>

                    <Button className="w-full" size="lg" disabled={items.length === 0 || isSubmitting} onClick={handleCheckout}>
                        {isSubmitting ? 'Processing...' : 'Checkout'}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
