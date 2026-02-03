
import { useState, useEffect } from 'react';
import { useCartStore } from '@/stores/useCartStore'; // For cart access if needed
import { ordersApi } from '@/api/client';
import type { Order } from '@/types'; // Ensure types are synced
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Package, Clock, Truck, CheckCircle, Smartphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from 'react-router-dom';

// Helper for status badge
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

export function OrderListPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        fetchOrders();
    }, [activeTab]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            // If admin tab logic is needed, we filter client side or API query params
            // For now fetch all user permitted ops
            const data = await ordersApi.getOrders(activeTab === 'all' ? undefined : activeTab);
            setOrders(data);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(price);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            </div>

            <Tabs defaultValue="all" onValueChange={setActiveTab} className="mb-6">
                <TabsList>
                    <TabsTrigger value="all">All Orders</TabsTrigger>
                    <TabsTrigger value="waiting_payment">Waiting Payment</TabsTrigger>
                    <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                    <TabsTrigger value="purchased">In Progress</TabsTrigger>
                </TabsList>
            </Tabs>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No orders found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <Link
                            to={`/orders/${order.id}`}
                            key={order.id}
                            className="block bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-gray-500">#{order.id.slice(0, 8)}</span>
                                        {getStatusBadge(order.status)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {format(new Date(order.createdAt), 'd MMM yyyy, HH:mm', { locale: id })}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:items-end gap-1">
                                    <div className="flex gap-2 text-sm">
                                        <span className="text-gray-500">{order.items.length} Items</span>
                                        <span className="text-gray-300">|</span>
                                        <span className="font-semibold">{formatPrice(order.totalPriceRp)}</span>
                                    </div>
                                    {order.status === 'waiting_payment' && (
                                        <span className="text-xs text-red-600 font-medium animate-pulse">
                                            Action Required
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Preview Items */}
                            <div className="mt-4 pt-4 border-t flex gap-2 overflow-x-auto pb-2">
                                {order.items.slice(0, 5).map((item) => (
                                    <div key={item.id} className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center text-xs text-center p-1 overflow-hidden border">
                                        {/* Placeholder or Image if available in future */}
                                        <span className="line-clamp-2">{item.name}</span>
                                    </div>
                                ))}
                                {order.items.length > 5 && (
                                    <div className="flex-shrink-0 w-16 h-16 bg-gray-50 rounded-md flex items-center justify-center text-xs text-gray-500 border">
                                        +{order.items.length - 5}
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
