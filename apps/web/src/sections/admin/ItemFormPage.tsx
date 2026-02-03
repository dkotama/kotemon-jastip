import { useState, useEffect } from 'react';
import { adminApi, getImageUrl } from '@/api/client';
import type { CreateItemPayload, UpdateItemPayload } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Loader2,
  Upload,
  X,
  Save,
  ArrowLeft,
  Plus,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  ItemCategory,
  InfoNote,
  InfoNoteType
} from '@/types';
import { PublicItemCard } from '@/components/PublicItemCard';

interface ItemFormPageProps {
  onNavigate: (page: string) => void;
  editItemId?: string;
}

const NOTE_TYPES: { id: InfoNoteType; label: string; color: string }[] = [
  { id: 'amber', label: 'Amber (Warning)', color: 'bg-amber-100 text-amber-700' },
  { id: 'purple', label: 'Purple (Preorder)', color: 'bg-purple-100 text-purple-700' },
  { id: 'blue', label: 'Blue (Info)', color: 'bg-blue-100 text-blue-700' },
  { id: 'red', label: 'Red (Critical)', color: 'bg-red-100 text-red-700' },
];

export function ItemFormPage({ onNavigate, editItemId }: ItemFormPageProps) {
  const isEditing = !!editItemId;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Dynamic Categories
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      const settings = await adminApi.getSettings(token);
      setCategories(settings.itemCategories || []);
      // If default category is not in list (e.g. empty), set it to first available or empty
      if (settings.itemCategories.length > 0 && !formData.category) {
        setFormData(prev => ({ ...prev, category: settings.itemCategories[0] }));
      }
    } catch (err) {
      console.error('Failed to load categories', err);
      toast.error('Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  // Settings for Base Price Calculation (Fetched from backend normally, mocking or fetching here?)
  // Ideally fetch settings. For now we assume a default exchange rate if we wanted to calculate on client,
  // BUT backend calculates basePriceRp automatically from basePriceYen.
  // We can just trust backend. But validation might be good.

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePriceYen: '',
    basePriceRp: 0, // Read-only, calculated by backend
    sellingPriceRp: '',
    weightGrams: '',
    maxOrders: '10',
    category: '' as ItemCategory,
    isDraft: false,

    // Flags
    withoutBoxNote: false,
    isLimitedEdition: false,
    isPreorder: false,
    isFragile: false,

    // Arrays
    photos: [] as string[],
    infoNotes: [] as InfoNote[],
  });

  // Calculate Base Price Rp locally for preview? 
  // We don't know exchange rate without fetching Settings.
  // We can show "Calculated by server" or fetch settings.
  // For simplicity, we just submit Yen.

  useEffect(() => {
    if (isEditing && editItemId) {
      loadItem(editItemId);
    }
  }, [editItemId]);

  const loadItem = async (id: string) => {
    try {
      setFetching(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Not authenticated');

      const item = await adminApi.getItemById(token, id);

      setFormData({
        name: item.name,
        description: item.description || '',
        basePriceYen: item.basePriceYen.toString(),
        basePriceRp: item.basePriceRp || 0, // Read-only from backend
        sellingPriceRp: item.sellingPriceRp.toString(),
        weightGrams: item.weightGrams.toString(),
        maxOrders: item.maxOrders.toString(),
        category: item.category,
        isDraft: item.isDraft,
        withoutBoxNote: item.withoutBoxNote,
        isLimitedEdition: item.isLimitedEdition,
        isPreorder: item.isPreorder,
        isFragile: item.isFragile,
        photos: item.photos || [],
        infoNotes: item.infoNotes || [],
      });
    } catch (err) {
      console.error('Failed to load item:', err);
      toast.error('Failed to load item details');
      onNavigate('items');
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Not authenticated');

      const result = await adminApi.uploadPhoto(token, file);

      // result.url is the relative path e.g. /api/public/photos/uploads/xxx
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, result.url]
      }));

      toast.success('Photo uploaded');
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Failed to upload photo');
    } finally {
      setLoading(false);
      // Clear input
      e.target.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const addInfoNote = () => {
    setFormData(prev => ({
      ...prev,
      infoNotes: [...prev.infoNotes, { type: 'amber', text: '' }]
    }));
  };

  const updateInfoNote = (index: number, field: keyof InfoNote, value: string) => {
    setFormData(prev => {
      const newNotes = [...prev.infoNotes];
      newNotes[index] = { ...newNotes[index], [field]: value };
      return { ...prev, infoNotes: newNotes };
    });
  };

  const removeInfoNote = (index: number) => {
    setFormData(prev => ({
      ...prev,
      infoNotes: prev.infoNotes.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) return toast.error('Name is required');
    if (!formData.basePriceYen) return toast.error('Base Price (JPY) is required');
    if (!formData.sellingPriceRp) return toast.error('Selling Price (IDR) is required');
    if (!formData.weightGrams) return toast.error('Weight is required');
    if (formData.photos.length === 0) return toast.error('At least one photo is required');

    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Not authenticated');

      const payload: CreateItemPayload = {
        name: formData.name,
        description: formData.description,
        basePriceYen: Number(formData.basePriceYen),
        sellingPriceRp: Number(formData.sellingPriceRp),
        weightGrams: Number(formData.weightGrams),
        maxOrders: Number(formData.maxOrders),
        category: formData.category,
        isDraft: formData.isDraft,
        withoutBoxNote: formData.withoutBoxNote,
        isLimitedEdition: formData.isLimitedEdition,
        isPreorder: formData.isPreorder,
        isFragile: formData.isFragile,
        photos: formData.photos,
        infoNotes: formData.infoNotes.filter(n => n.text.trim().length > 0),
      };

      if (isEditing && editItemId) {
        await adminApi.updateItem(token, editItemId, payload as UpdateItemPayload);
        toast.success('Item updated successfully');
      } else {
        await adminApi.createItem(token, payload);
        toast.success('Item created successfully');
      }

      onNavigate('items');
    } catch (err: any) {
      console.error('Submit failed:', err);
      toast.error(err.message || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Preview Item Mock
  const previewItem = {
    id: 'preview',
    name: formData.name || 'Product Name',
    description: formData.description || 'Product description...',
    photos: formData.photos.length > 0 ? formData.photos : [],
    sellingPriceRp: Number(formData.sellingPriceRp) || 0,
    basePriceRp: 0, // We cannot calc this here easily without fetching rate
    weightGrams: Number(formData.weightGrams) || 0,
    category: formData.category,
    infoNotes: formData.infoNotes,
    availableSlots: Number(formData.maxOrders),
    badge: formData.isDraft ? 'available' as const : 'new' as const,
    viewCount: 0,
    isLimitedEdition: formData.isLimitedEdition,
    isPreorder: formData.isPreorder,
    isFragile: formData.isFragile,
    withoutBoxNote: formData.withoutBoxNote,
  };

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => onNavigate('items')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Item' : 'New Item'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isEditing ? 'Update item details' : 'Add a new item to your catalog'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <Input
                    placeholder="e.g. Tokyo Banana 8pcs"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Product description..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(val) => handleInputChange('category', val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>
                            <span className="capitalize">{cat}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Weight (grams)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 250"
                      value={formData.weightGrams}
                      onChange={(e) => handleInputChange('weightGrams', e.target.value)}
                      required
                      min={0}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing & Stock */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Stock</CardTitle>
                <CardDescription>
                  Base Price (Yen) will confirm the purchase cost. Selling Price (Rp) is what users pay.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Base Price (JPY)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
                      <Input
                        type="number"
                        className="pl-8"
                        placeholder="1000"
                        value={formData.basePriceYen}
                        onChange={(e) => handleInputChange('basePriceYen', e.target.value)}
                        required
                        min={0}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Selling Price (IDR)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">Rp</span>
                      <Input
                        type="number"
                        className="pl-10"
                        placeholder="150000"
                        value={formData.sellingPriceRp}
                        onChange={(e) => handleInputChange('sellingPriceRp', e.target.value)}
                        required
                        min={0}
                      />
                    </div>
                  </div>

                  {/* Base Price Rp - Calculated by backend */}
                  {isEditing && formData.basePriceRp > 0 && (
                    <div className="space-y-2">
                      <Label>Base Price (IDR)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">Rp</span>
                        <Input
                          type="text"
                          className="pl-10 bg-gray-50"
                          value={new Intl.NumberFormat('id-ID').format(formData.basePriceRp)}
                          disabled
                          readOnly
                        />
                      </div>
                      <p className="text-xs text-gray-500">Calculated from JPY × exchange rate</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Max Orders (Slots)</Label>
                    <Input
                      type="number"
                      placeholder="10"
                      value={formData.maxOrders}
                      onChange={(e) => handleInputChange('maxOrders', e.target.value)}
                      required
                      min={1}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
                <CardDescription>First image will be the cover.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {formData.photos.map((url, index) => (
                    <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border bg-gray-50">
                      <img
                        src={getImageUrl(url)}
                        alt={`Product ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-blue-600/80 text-white text-[10px] text-center py-1">
                          Cover
                        </div>
                      )}
                    </div>
                  ))}

                  {formData.photos.length < 5 && (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg aspect-square cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                      {loading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-gray-400 mb-2" />
                          <span className="text-xs text-gray-500">Upload</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                        disabled={loading}
                      />
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Flags & Options */}
            <Card>
              <CardHeader>
                <CardTitle>Options & Flags</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label>Draft Mode</Label>
                    <p className="text-xs text-gray-500">Hide from public view</p>
                  </div>
                  <Switch
                    checked={formData.isDraft}
                    onCheckedChange={(checked) => handleInputChange('isDraft', checked)}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label>Limited Edition</Label>
                    <p className="text-xs text-gray-500">Show "Limited" badge</p>
                  </div>
                  <Switch
                    checked={formData.isLimitedEdition}
                    onCheckedChange={(checked) => handleInputChange('isLimitedEdition', checked)}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label>Pre-order</Label>
                    <p className="text-xs text-gray-500">Mark as pre-order item</p>
                  </div>
                  <Switch
                    checked={formData.isPreorder}
                    onCheckedChange={(checked) => handleInputChange('isPreorder', checked)}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label>Fragile</Label>
                    <p className="text-xs text-gray-500">Show broken glass icon</p>
                  </div>
                  <Switch
                    checked={formData.isFragile}
                    onCheckedChange={(checked) => handleInputChange('isFragile', checked)}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label>Without Box Note</Label>
                    <p className="text-xs text-gray-500">Show "Tanpa Box" warning</p>
                  </div>
                  <Switch
                    checked={formData.withoutBoxNote}
                    onCheckedChange={(checked) => handleInputChange('withoutBoxNote', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Info Notes */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Info Notes</CardTitle>
                  <CardDescription>Add badge notes like "Max 2 per person"</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addInfoNote}>
                  <Plus className="h-3 w-3 mr-2" />
                  Add Note
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.infoNotes.map((note, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <Select
                      value={note.type}
                      onValueChange={(val) => updateInfoNote(index, 'type', val)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NOTE_TYPES.map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${t.color.split(' ')[0]}`} />
                              <span>{t.label.split(' ')[0]}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="Note text..."
                      value={note.text}
                      onChange={(e) => updateInfoNote(index, 'text', e.target.value)}
                      className="flex-1"
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeInfoNote(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {formData.infoNotes.length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-4 border-2 border-dashed rounded-lg">
                    No info notes added.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => onNavigate('items')}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {isEditing ? 'Update Item' : 'Create Item'}
              </Button>
            </div>

          </form>
        </div>

        {/* Preview Column */}
        <div className="space-y-6">
          <div className="sticky top-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Live Preview</h3>
            <div className="relative">
              {/* Overlay to catch clicks if needed, or let it handle clicks (won't navigate) */}
              <div className="pointer-events-none">
                {/* We need to adapt PublicItemCard to accept our mock item */}
                {/* PublicItemCard expects PublicItem. We mocked it above. */}
                {/* Note: PublicItemCard might use getImageUrl internaly. 
                      Since our mock photos are relative or absolute URLs from helper, we need to ensure they work.
                      The mock item uses formData.photos which are results from upload (relative/absolute).
                  */}
                <PublicItemCard
                  item={previewItem as any}
                  onClick={() => { }}
                />
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-800 border border-blue-100">
              <div className="flex items-center gap-2 font-semibold mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Admin Note</span>
              </div>
              <p>
                You are viewing a live preview. Base price calculations (IDR) are estimated as server connection is needed for exchange rates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
