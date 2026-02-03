
import { useState } from 'react';
import { useCartStore } from '@/stores/useCartStore';
import { X, Plus, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function CustomItemModal() {
    const { isCustomItemModalOpen, toggleCustomItemModal, addItem } = useCartStore();

    const [url, setUrl] = useState('');
    const [name, setName] = useState('');
    const [note, setNote] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [source, setSource] = useState('website');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !url) return;

        addItem({
            itemId: undefined,
            name: name,
            price: 0, // TBD by Admin
            weight: 0, // TBD by Admin
            quantity: quantity,
            isCustom: true,
            customUrl: url,
            customNote: note,
            customSource: source
        });

        resetForm();
        toggleCustomItemModal(false);
    };

    const resetForm = () => {
        setUrl('');
        setName('');
        setNote('');
        setQuantity(1);
        setSource('website');
    };

    return (
        <Dialog open={isCustomItemModalOpen} onOpenChange={toggleCustomItemModal}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Request Custom Item</DialogTitle>
                    <DialogDescription>
                        Want something specific from Japan? Paste the link and we'll buy it for you!
                        Price and weight will be calculated by Admin after order confirmation.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="source">Source</Label>
                        <Select value={source} onValueChange={setSource}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="amazon">Amazon Japan</SelectItem>
                                <SelectItem value="rakuten">Rakuten</SelectItem>
                                <SelectItem value="mercari">Mercari</SelectItem>
                                <SelectItem value="website">Other Website</SelectItem>
                                <SelectItem value="offline">Physical Store (Offline)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="url">Item URL</Label>
                        <div className="flex gap-2">
                            <Input
                                id="url"
                                placeholder="https://..."
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                required
                            />
                            {url && (
                                <Button type="button" variant="outline" size="icon" onClick={() => window.open(url, '_blank')}>
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="name">Item Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. Tokyo Banana 8pcs"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input
                                id="quantity"
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value))}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="note">Notes (Optional)</Label>
                        <Textarea
                            id="note"
                            placeholder="e.g. Size, Color, Flavor..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => toggleCustomItemModal(false)}>Cancel</Button>
                        <Button type="submit">Add to Request</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
