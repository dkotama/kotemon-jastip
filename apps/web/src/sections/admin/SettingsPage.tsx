import { useState, useEffect } from 'react';
import { adminApi } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Store,
  Calendar as CalendarIcon,
  Clock,
  Package,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Loader2,
  Plus,
  X,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { toast } from 'sonner';
import type { JastipSettings } from '@/types';

interface SettingsPageProps {
  onNavigate: (page: string, id?: string) => void;
}

export function SettingsPage({ }: SettingsPageProps) {
  const [settings, setSettings] = useState<JastipSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Local state for categories editing
  const [newCategory, setNewCategory] = useState('');

  // Fetch settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      const data = await adminApi.getSettings(token);
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updates: Partial<JastipSettings>) => {
    if (!settings) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      // Prepare payload
      // Fix potential type issues if needed
      await adminApi.updateSettings(token, updates);

      // Update local state
      setSettings(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Settings saved successfully!');
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    if (!settings || !newCategory.trim()) return;
    const cat = newCategory.trim().toLowerCase();

    if (settings.itemCategories.includes(cat)) {
      toast.error('Category already exists');
      return;
    }

    const updatedCategories = [...settings.itemCategories, cat];
    handleSave({ itemCategories: updatedCategories });
    setNewCategory('');
  };

  const removeCategory = (catToRemove: string) => {
    if (!settings) return;
    const updatedCategories = settings.itemCategories.filter(c => c !== catToRemove);
    handleSave({ itemCategories: updatedCategories });
  };

  if (loading || !settings) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Quota calculation (mocked for now as we need items to calculate real usage)
  // In a real app, this should come from API or calculated from items list

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
          <p className="text-sm text-gray-500 mt-1">Configure your Jastip business settings</p>
        </div>
      </div>

      {/* Jastip Status Card */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className={`h-1.5 ${settings.isOpen ? 'bg-emerald-500' : 'bg-red-500'}`} />
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-xl ${settings.isOpen ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                <Store className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Jastip Status</h2>
                <p className="text-sm text-gray-500">
                  {settings.isOpen
                    ? 'Currently accepting orders'
                    : 'Not accepting orders'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant={settings.isOpen ? 'default' : 'destructive'}
                className={`px-3 py-1 ${settings.isOpen ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}`}
              >
                {settings.isOpen ? (
                  <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Open</>
                ) : (
                  <><AlertCircle className="h-3.5 w-3.5 mr-1" /> Closed</>
                )}
              </Badge>
              <Switch
                checked={settings.isOpen}
                onCheckedChange={(checked) => handleSave({ isOpen: checked })}
                disabled={saving}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Business Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              Business Configuration
            </CardTitle>
            <CardDescription>
              Exchange rate and margin settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exchangeRate">Exchange Rate (JPY → IDR)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                  <Input
                    id="exchangeRate"
                    type="number"
                    value={settings.exchangeRate}
                    onChange={(e) => handleSave({ exchangeRate: parseFloat(e.target.value) || 0 })}
                    className="pl-9"
                    disabled={saving}
                  />
                </div>
                <p className="text-xs text-gray-500">Updates only future items</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="margin">Default Margin (%)</Label>
                <div className="relative">
                  <Input
                    id="margin"
                    type="number"
                    value={settings.defaultMarginPercent}
                    onChange={(e) => handleSave({ defaultMarginPercent: parseFloat(e.target.value) || 0 })}
                    className="pr-8"
                    disabled={saving}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalQuota">Total Baggage Quota (Kg)</Label>
              <Input
                id="totalQuota"
                type="number"
                value={(settings as any).totalBaggageQuotaGrams ? (settings as any).totalBaggageQuotaGrams / 1000 : settings.totalQuota || 20}
                onChange={(e) => {
                  const kg = parseFloat(e.target.value) || 0;
                  handleSave({ totalBaggageQuotaGrams: kg * 1000 } as any);
                }}
                disabled={saving}
              />
            </div>
          </CardContent>
        </Card>

        {/* Categories Manager */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              Item Categories
            </CardTitle>
            <CardDescription>
              Manage available product categories
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="New category name..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              />
              <Button onClick={addCategory} disabled={saving || !newCategory.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {settings.itemCategories?.map((cat) => (
                <Badge key={cat} variant="secondary" className="px-3 py-1 flex items-center gap-2 capitalize">
                  {cat}
                  <button
                    onClick={() => removeCategory(cat)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {(!settings.itemCategories || settings.itemCategories.length === 0) && (
                <span className="text-sm text-gray-400">No categories defined</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Arrival Date (Estimasi) */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-400" />
              Estimasi Tanggal Sampai
            </CardTitle>
            <CardDescription>
              Kapan barang sampai di Indonesia (estimasi)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Pilih Tanggal Estimasi</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {settings.estimatedArrivalDate ? (
                      format(new Date(settings.estimatedArrivalDate), 'PPP', { locale: idLocale })
                    ) : (
                      <span className="text-gray-400">Pilih tanggal</span>
                    )}
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={settings.estimatedArrivalDate ? new Date(settings.estimatedArrivalDate) : undefined}
                    onSelect={(date) => handleSave({ estimatedArrivalDate: date || null })}
                    disabled={(date) => {
                      // Don't allow selecting dates before close date
                      if (settings.jastipCloseDate) {
                        return date < new Date(settings.jastipCloseDate);
                      }
                      return false;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {settings.estimatedArrivalDate && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Estimasi: {format(new Date(settings.estimatedArrivalDate), 'PPP', { locale: idLocale })}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Close Date (Tutup) */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Tanggal Tutup Order
            </CardTitle>
            <CardDescription>
              Deadline terakhir menerima pesanan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Pilih Tanggal Tutup</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {settings.jastipCloseDate ? (
                      format(new Date(settings.jastipCloseDate), 'PPP', { locale: idLocale })
                    ) : (
                      <span className="text-gray-400">Belum diatur</span>
                    )}
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={settings.jastipCloseDate ? new Date(settings.jastipCloseDate) : undefined}
                    onSelect={(date) => handleSave({ jastipCloseDate: date || null })}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {settings.jastipCloseDate && (
              <div className="p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Tutup: {format(new Date(settings.jastipCloseDate), 'PPP', { locale: idLocale })}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
