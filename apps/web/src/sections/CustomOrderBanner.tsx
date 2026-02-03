
import { Button } from '@/components/ui/button';
import { PackageSearch } from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';

export function CustomOrderBanner() {
    const { toggleCustomItemModal } = useCartStore();

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-y border-blue-100 py-6 px-4">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-white p-3 rounded-full shadow-sm text-blue-600">
                        <PackageSearch className="h-6 w-6" />
                    </div>
                    <div className="text-center sm:text-left">
                        <h3 className="font-semibold text-lg text-gray-900">Looking for something specific?</h3>
                        <p className="text-gray-600 text-sm">
                            We can buy any item from Amazon JP, Mercari, or other Japanese stores for you.
                        </p>
                    </div>
                </div>

                <Button onClick={() => toggleCustomItemModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm whitespace-nowrap">
                    Request Custom Item
                </Button>
            </div>
        </div>
    );
}
