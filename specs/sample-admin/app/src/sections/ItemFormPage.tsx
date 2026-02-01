import { useState, useEffect } from 'react';
import { useStore } from '@/hooks/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  Plus, 
  X, 
  Image as ImageIcon,
  Info,
  AlertCircle,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import type { ItemCategory, ItemStatus, InfoNote } from '@/types';

interface ItemFormPageProps {
  itemId?: string;
  onNavigate: (page: string) => void;
}

const categories: { value: ItemCategory; label: string }[] = [
  { value: 'snack', label: 'Snack' },
  { value: 'skincare', label: 'Skincare' },
  { value: 'makeup', label: 'Makeup' },
  { value: 'stationery', label: 'Stationery' },
  { value: 'gift', label: 'Gift' },
  { value: 'beverage', label: 'Beverage' },
  { value: 'accessories', label: 'Accessories' },
];

const statuses: { value: ItemStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'available', label: 'Available' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'full', label: 'Full' },
];

const noteTypes: { value: InfoNote['type']; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'info', label: 'Info', icon: <Info className="h-3 w-3" />, color: 'bg-blue-100 text-blue-700' },
  { value: 'warning', label: 'Warning', icon: <AlertCircle className="h-3 w-3" />, color: 'bg-amber-100 text-amber-700' },
  { value: 'success', label: 'Success', icon: <CheckCircle className="h-3 w-3" />, color: 'bg-emerald-100 text-emerald-700' },
  { value: 'error', label: 'Error', icon: <AlertTriangle className="h-3 w-3" />, color: 'bg-red-100 text-red-700' },
];

export function ItemFormPage({ itemId, onNavigate }: ItemFormPageProps) {
  const { addItem, updateItem, getItemById } = useStore();
  const isEditing = !!itemId;
  const existingItem = itemId ? getItemById(itemId) : null;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    weight: '',
    slotsAvailable: '',
    maxSlots: '',
    category: 'snack' as ItemCategory,
    status: 'new' as ItemStatus,
    images: [] as string[],
    infoNotes: [] as InfoNote[],
  });

  const [newNote, setNewNote] = useState('');
  const [newNoteType, setNewNoteType] = useState<InfoNote['type']>('info');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (existingItem) {
      setFormData({
        name: existingItem.name,
        description: existingItem.description,
        price: existingItem.price.toString(),
        weight: existingItem.weight.toString(),
        slotsAvailable: existingItem.slotsAvailable.toString(),
        maxSlots: existingItem.maxSlots.toString(),
        category: existingItem.category,
        status: existingItem.status,
        images: existingItem.images,
        infoNotes: existingItem.infoNotes,
      });
    }
  }, [existingItem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const itemData = {
      name: formData.name,
      description: formData.description,
      price: parseInt(formData.price) || 0,
      weight: parseInt(formData.weight) || 0,
      slotsAvailable: parseInt(formData.slotsAvailable) || 0,
      maxSlots: parseInt(formData.maxSlots) || 0,
      category: formData.category,
      status: formData.status,
      images: formData.images,
      infoNotes: formData.infoNotes,
    };

    if (isEditing && itemId) {
      updateItem(itemId, itemData);
    } else {
      addItem(itemData);
    }
    
    onNavigate('items');
  };

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      setFormData(prev => ({ ...prev, images: [...prev.images, imageUrl.trim()] }));
      setImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({ 
      ...prev, 
      images: prev.images.filter((_, i) => i !== index) 
    }));
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      const note: InfoNote = {
        id: Math.random().toString(36).substring(2, 9),
        type: newNoteType,
        content: newNote.trim(),
      };
      setFormData(prev => ({ ...prev, infoNotes: [...prev.infoNotes, note] }));
      setNewNote('');
    }
  };

  const handleRemoveNote = (noteId: string) => {
    setFormData(prev => ({ 
      ...prev, 
      infoNotes: prev.infoNotes.filter(n => n.id !== noteId) 
    }));
  };

  const formatCurrency = (value: string) => {
    const num = parseInt(value) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => onNavigate('items')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Item' : 'Tambah Item'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isEditing ? 'Update product details' : 'Add new product to your catalog'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Basic Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  placeholder="Enter product name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter product description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (IDR)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (grams)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="0"
                    value={formData.weight}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="slotsAvailable">Available Slots</Label>
                  <Input
                    id="slotsAvailable"
                    type="number"
                    placeholder="0"
                    value={formData.slotsAvailable}
                    onChange={(e) => setFormData(prev => ({ ...prev, slotsAvailable: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxSlots">Max Slots</Label>
                  <Input
                    id="maxSlots"
                    type="number"
                    placeholder="0"
                    value={formData.maxSlots}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxSlots: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value: ItemCategory) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: ItemStatus) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(status => (
                      <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Info Notes */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Info Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select 
                  value={newNoteType} 
                  onValueChange={(value: InfoNote['type']) => setNewNoteType(value)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {noteTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          {type.icon}
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNote())}
                />
                <Button type="button" onClick={handleAddNote} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {formData.infoNotes.map((note) => (
                  <div 
                    key={note.id} 
                    className={`flex items-center justify-between p-3 rounded-lg ${noteTypes.find(t => t.value === note.type)?.color}`}
                  >
                    <div className="flex items-center gap-2">
                      {noteTypes.find(t => t.value === note.type)?.icon}
                      <span className="text-sm">{note.content}</span>
                    </div>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 hover:bg-black/10"
                      onClick={() => handleRemoveNote(note.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Media & Preview */}
        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Product Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Image URL..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
                />
                <Button type="button" onClick={handleAddImage} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {formData.images.map((img, index) => (
                  <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img src={img} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {formData.images.length === 0 && (
                  <div className="col-span-2 aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon className="h-10 w-10 mb-2" />
                    <p className="text-sm">No images yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Live Preview */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-xl overflow-hidden bg-white">
                <div className="aspect-square bg-gray-100 relative">
                  {formData.images.length > 0 ? (
                    <img src={formData.images[0]} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-16 w-16 text-gray-300" />
                    </div>
                  )}
                  <Badge 
                    className="absolute top-2 left-2 capitalize"
                    variant={formData.status === 'new' ? 'default' : formData.status === 'available' ? 'default' : formData.status === 'low_stock' ? 'default' : 'destructive'}
                  >
                    {formData.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">
                    {formData.name || 'Product Name'}
                  </h3>
                  <p className="text-lg font-bold text-[#6c5ce7] mt-1">
                    {formatCurrency(formData.price)}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                    <span>{formData.weight}g</span>
                    <span>•</span>
                    <span>{formData.slotsAvailable}/{formData.maxSlots} slots</span>
                  </div>
                  {formData.infoNotes.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {formData.infoNotes.slice(0, 2).map(note => (
                        <div key={note.id} className={`text-xs px-2 py-1 rounded ${noteTypes.find(t => t.value === note.type)?.color}`}>
                          {note.content}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button 
            type="submit"
            className="w-full bg-gradient-to-r from-[#f8a5c2] to-[#6c5ce7] hover:opacity-90 text-white"
          >
            {isEditing ? 'Update Item' : 'Create Item'}
          </Button>
        </div>
      </form>
    </div>
  );
}
