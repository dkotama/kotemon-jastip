import { useState, useEffect } from 'react';
import { adminApi, getImageUrl } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit2,
  Archive,
  Package,
  Filter,
  Loader2,
  AlertCircle
} from 'lucide-react';
import type { Item } from '@/types';
import { toast } from 'sonner';

interface ItemListPageProps {
  onNavigate: (page: string, id?: string) => void;
}



export function ItemListPage({ onNavigate }: ItemListPageProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('Not authenticated');
        return;
      }
      const data = await adminApi.getItems(token);
      setItems(data);
    } catch (err) {
      console.error('Failed to load items:', err);
      setError('Failed to load items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      setIsDeleting(true);
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      await adminApi.deleteItem(token, itemToDelete.id);
      toast.success('Item archived successfully');

      // Refresh list
      loadItems();
      setItemToDelete(null);
    } catch (err: any) {
      console.error('Delete failed:', err);
      // Check if it's the "has orders" error (400)
      if (err.message && err.message.includes('orders')) {
        toast.error(err.message);
      } else {
        toast.error('Failed to archive item');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getItemStatus = (item: Item) => {
    if (item.isDraft) return { label: 'Draft', className: 'bg-gray-100 text-gray-700' };
    if (!item.isAvailable) return { label: 'Archived', className: 'bg-red-50 text-red-700 border-red-200' };
    if (item.currentOrders >= item.maxOrders) return { label: 'Full', className: 'bg-red-100 text-red-700' };
    if (item.maxOrders - item.currentOrders <= 2) return { label: 'Low Stock', className: 'bg-amber-100 text-amber-700' };
    return { label: 'Available', className: 'bg-emerald-100 text-emerald-700' };
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-gray-900 font-medium">{error}</p>
        <Button onClick={loadItems}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Item</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your product catalog</p>
        </div>
        <Button
          onClick={() => onNavigate('item-form')}
          className="bg-gradient-to-r from-blue-600 to-blue-500 hover:opacity-90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Item
        </Button>
      </div>

      {/* Search and Filter */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            All Items ({filteredItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <Package className="h-12 w-12 text-gray-300" />
                        <p className="text-gray-500">No items found</p>
                        <Button
                          variant="outline"
                          onClick={() => onNavigate('item-form')}
                        >
                          Add your first item
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => {
                    const status = getItemStatus(item);
                    return (
                      <TableRow key={item.id} className="hover:bg-gray-50/50">
                        <TableCell>
                          <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100">
                            {item.photos && item.photos.length > 0 ? (
                              <img
                                src={getImageUrl(item.photos[0])}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <Package className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.weightGrams}g</div>
                          {/* Show flags */}
                          <div className="flex gap-1 mt-1">
                            {item.isPreorder && <span className="text-[10px] px-1 bg-purple-100 text-purple-700 rounded">PO</span>}
                            {item.isFragile && <span className="text-[10px] px-1 bg-red-100 text-red-700 rounded">Fragile</span>}
                            {item.isLimitedEdition && <span className="text-[10px] px-1 bg-amber-100 text-amber-700 rounded">Limited</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs capitalize">
                            {item.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{formatCurrency(item.sellingPriceRp)}</span>
                            <span className="text-xs text-gray-400">{formatCurrency(item.basePriceRp || 0)} (Base)</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${item.currentOrders >= item.maxOrders ? 'text-red-500' : ''}`}>
                              {item.currentOrders}
                            </span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-500">{item.maxOrders}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${status.className}`}
                          >
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-gray-500">
                            <span className="text-sm">{item.viewCount}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {/* View public page if available? */}
                              <DropdownMenuItem onClick={() => onNavigate('item-form', item.id)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-amber-600"
                                onClick={() => setItemToDelete(item)}
                              >
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Archive Confirmation */}
      <AlertDialog open={!!itemToDelete} onOpenChange={() => !isDeleting && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive "{itemToDelete?.name}"?
              {itemToDelete?.currentOrders && itemToDelete.currentOrders > 0 ? (
                <div className="mt-2 text-amber-600 font-medium">
                  Note: This item has {itemToDelete.currentOrders} active orders.
                </div>
              ) : null}
              <div className="mt-2 text-gray-500">
                Archived items are hidden from public view but can be restored later.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-amber-500 hover:bg-amber-600"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
