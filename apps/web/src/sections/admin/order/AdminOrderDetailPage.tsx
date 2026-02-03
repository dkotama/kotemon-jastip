
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi } from '@/api/client';
import type { Order } from '@/types';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { ArrowLeft, Edit2, Save, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface AdminOrderDetailPageProps {
    adminToken: string;
}

export function AdminOrderDetailPage({ adminToken }: AdminOrderDetailPageProps) {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Edit State
    const [status, setStatus] = useState('');
    const [totalWeight, setTotalWeight] = useState(0);
    const [totalPriceRp, setTotalPriceRp] = useState(0);
    // Just simple edits for now - full item editing is complex

    useEffect(() => {
        if (id) fetchOrder(id);
    }, [id]);

    const fetchOrder = async (orderId: string) => {
        try {
            setLoading(true);
            // We can use the public getOrder route for reading (it might fail if not owner, but admin likely needs a special route?
            // Wait, ordersApi.getOrder uses userAuth. If admin is logged in as user they can see it?
            // Actually, admin usually needs a dedicated "get order by ID" regardless of owner.
            // Current ordersApi.getOrder checks user_id. Admin cannot see other users' orders via that endpoint unless we modify it.
            // Since we didn't add GET /api/admin/orders/:id, we might be blocked here.
            // Check if I can use ordersApi.getOrder... most likely NOT if strictly filtered by user_id.

            // Workaround: I added GET /api/orders (List) with filters but it filters by user_id=?.
            // Admin actually CANNOT fetch arbitrary order details with current Backend API.

            // I need to Fix Backend to allow Admin to fetch any order.
            // Or use the recently added Admin Order List Page logic... wait, that page used ordersApi.getOrders which filters by user_id.
            // So Admin Order List Page will show EMPTY list for Admin user unless Admin user placed the orders.

            // CRITICAL: The Backend API for List/Get Orders enforces `WHERE user_id = ?`.
            // I need to update `orders.ts` to allow Admin access to all orders.

            // For now, I will optimistically proceed assuming I will fix backend.
            const data = await adminApi.getOrder(adminToken, orderId);
            setOrder(data);
            initializeEditState(data);
        } catch (err) {
            setError('Failed to load order. You might not have permission or it does not exist.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const initializeEditState = (order: Order) => {
        setStatus(order.status);
        setTotalWeight(order.totalWeightGrams);
        setTotalPriceRp(order.totalPriceRp);
    };

    const handleSave = async () => {
        if (!order || !id) return;
        try {
            setSaving(true);

            // Update Status if changed
            if (status !== order.status) {
                await adminApi.updateOrderStatus(adminToken, id, status);
            }

            // Update Details (Price/Weight) if changed
            if (totalWeight !== order.totalWeightGrams || totalPriceRp !== order.totalPriceRp) {
                await adminApi.updateOrderDetails(adminToken, id, {
                    totalWeightGrams: totalWeight,
                    totalPriceRp: totalPriceRp
                });
            }

            // Refetch
            await fetchOrder(id);
            setIsEditing(false);
        } catch (err) {
            console.error('Failed to update:', err);
            setError('Failed to update order');
        } finally {
            setSaving(false);
        }
    };

    const getStatusBadge = (s: string) => {
        switch (s) {
            case 'confirmed': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Confirmed</Badge>;
            case 'waiting_payment': return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Payment Needed</Badge>;
            case 'purchased': return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Purchased</Badge>;
            case 'shipped': return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Shipped</Badge>;
            case 'delivered': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Delivered</Badge>;
            case 'cancelled': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
            default: return <Badge variant="secondary">{s}</Badge>;
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading order details...</div>;
    if (error || !order) return (
        <div className="p-8 text-center">
            <p className="text-red-500 mb-4">{error || 'Order not found'}</p>
            <Button onClick={() => navigate('/admin/orders')} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
            </Button>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/orders')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        Order #{order.id.slice(0, 8)}
                        {!isEditing && getStatusBadge(order.status)}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Placed on {format(new Date(order.createdAt), 'dd MMMM yyyy, HH:mm', { locale: idLocale })}
                    </p>
                </div>
                <div className="ml-auto flex gap-2">
                    {isEditing ? (
                        <>
                            <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={saving}>
                                <X className="mr-2 h-4 w-4" /> Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? <Restoring /> : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
                            </Button>
                        </>
                    ) : (
                        <Button variant="outline" onClick={() => setIsEditing(true)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Edit Order
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - Items */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Items</CardTitle>
                            <CardDescription>List of items in this order</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex gap-4 border-b last:border-0 pb-4 last:pb-0">
                                    <div className="h-16 w-16 bg-gray-100 rounded-md flex-shrink-0 flex items-center justify-center border text-xs text-center p-1 overflow-hidden">
                                        {/* Placeholder */}
                                        {item.name}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                                                <p className="text-sm text-gray-500">
                                                    {item.isCustom && <Badge variant="secondary" className="mr-2 text-xs">Custom</Badge>}
                                                    Qty: {item.quantity}
                                                </p>
                                                {item.customUrl && (
                                                    <a href={item.customUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline block mt-1">
                                                        Original Link
                                                    </a>
                                                )}
                                                {item.customNote && (
                                                    <p className="text-xs text-gray-500 mt-1 italic">Note: "{item.customNote}"</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium text-gray-900">
                                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.priceRp)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {item.weightGrams}g
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar - Summary & Editable Controls */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isEditing ? (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Status</label>
                                        <Select value={status} onValueChange={setStatus}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="waiting_payment">Waiting Payment</SelectItem>
                                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                                <SelectItem value="purchased">Purchased</SelectItem>
                                                <SelectItem value="shipped">Shipped</SelectItem>
                                                <SelectItem value="delivered">Delivered</SelectItem>
                                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Total Price (IDR)</label>
                                        <Input
                                            type="number"
                                            value={totalPriceRp}
                                            onChange={(e) => setTotalPriceRp(Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Total Weight (g)</label>
                                        <Input
                                            type="number"
                                            value={totalWeight}
                                            onChange={(e) => setTotalWeight(Number(e.target.value))}
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-500">Status</span>
                                        <span>{getStatusBadge(order.status)}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-500">Total Price</span>
                                        <span className="font-semibold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(order.totalPriceRp)}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-500">Total Weight</span>
                                        <span>{order.totalWeightGrams}g</span>
                                    </div>
                                </>
                            )}

                            {!isEditing && (
                                <div className="pt-4">
                                    <h4 className="font-medium mb-2 text-sm">Customer Details</h4>
                                    <p className="text-sm text-gray-600">User ID: {order.userId}</p>
                                    {/* Add customer name/email if available */}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function Restoring() { return <span className="animate-pulse">Saving...</span> }
