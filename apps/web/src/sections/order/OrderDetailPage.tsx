
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ordersApi } from '@/api/client';
import type { Order } from '@/types';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { ArrowLeft, Package, CreditCard, Truck, CheckCircle, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'confirmed': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Confirmed</Badge>;
        case 'waiting_payment': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Payment Needed</Badge>;
        case 'purchased': return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Purchased</Badge>;
        case 'shipped': return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Shipped</Badge>;
        case 'delivered': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Delivered</Badge>;
        case 'cancelled': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
        default: return <Badge variant="secondary">{status}</Badge>;
    }
};

export function OrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) fetchOrder(id);
    }, [id]);

    const fetchOrder = async (orderId: string) => {
        try {
            setLoading(true);
            const data = await ordersApi.getOrder(orderId);
            setOrder(data);
        } catch (err) {
            setError('Failed to load order.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(price);
    };

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
    if (!order) return <div className="text-center py-20">Order not found.</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <Link to="/orders" className="flex items-center text-sm text-gray-500 hover:text-blue-600 mb-6">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Orders
            </Link>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        Order #{order.id.slice(0, 8)}
                        {getStatusBadge(order.status)}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Placed on {format(new Date(order.createdAt), 'd MMMM yyyy, HH:mm', { locale: idLocale })}
                    </p>
                </div>

                {/* Actions (Pay Button, etc.) - Placeholder for now */}
                {order.status === 'waiting_payment' && (
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700 shadow-sm animate-pulse">
                        Pay Now
                    </button>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Order Items */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Items ({order.items.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex gap-4">
                                    {/* Image Placeholder */}
                                    <div className="h-16 w-16 bg-gray-100 rounded-md border flex-shrink-0 flex items-center justify-center text-xs text-center p-1">
                                        {/* If item.photos available, show it. But OrderItem schema does not have photos snapshot.
                        We might need to fetch item details or store snapshot.
                        For now just name. */}
                                        <span className="line-clamp-2 text-gray-400">Image</span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-medium text-sm">{item.name}</h4>
                                                {item.isCustom && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-wide">
                                                            Custom
                                                        </span>
                                                        {item.customUrl && (
                                                            <a href={item.customUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-0.5">
                                                                Link <ExternalLink className="h-3 w-3" />
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                                {item.customNote && (
                                                    <p className="text-xs text-gray-500 mt-1 italic">"{item.customNote}"</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold text-sm">
                                                    {item.priceRp > 0 ? formatPrice(item.priceRp * item.quantity) : 'TBD'}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {item.quantity} x {item.priceRp > 0 ? formatPrice(item.priceRp) : 'TBD'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Order Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Weight (Est.)</span>
                            <span>{order.totalWeightGrams}g</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>{formatPrice(order.totalPriceRp)}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            *Shipping to your address will be calculated after arrival in Indonesia.
                        </p>
                    </CardContent>
                </Card>

                {/* Status Timeline / Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Status History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Mock Timeline */}
                            <div className="flex gap-3">
                                <div className="flex flex-col items-center">
                                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5" />
                                    <div className="w-0.5 h-full bg-blue-100 my-1" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Order Placed</p>
                                    <p className="text-xs text-gray-500">{format(new Date(order.createdAt), 'd MMM HH:mm')}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex flex-col items-center">
                                    <div className={`w-2 h-2 rounded-full mt-1.5 ${order.status !== 'confirmed' ? 'bg-blue-600' : 'bg-gray-300'}`} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Processing</p>
                                    <p className="text-xs text-gray-400">{order.status === 'confirmed' ? 'Pending' : 'Done'}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
