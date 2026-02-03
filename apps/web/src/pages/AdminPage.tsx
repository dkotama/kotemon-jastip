import { useState } from 'react';
import { AdminDashboard } from '@/sections/admin/AdminDashboard';
import { ItemListPage } from '@/sections/admin/ItemListPage';
import { ItemFormPage } from '@/sections/admin/ItemFormPage';
import { TokensPage } from '@/sections/admin/TokensPage';
import { SettingsPage } from '@/sections/admin/SettingsPage';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toaster } from '@/components/ui/sonner';
import {
    LayoutDashboard,
    Package,
    Ticket,
    Settings,
    Menu,
    X,
    LogOut,
    ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

type Page = 'dashboard' | 'items' | 'item-form' | 'tokens' | 'settings';

interface NavItem {
    id: Page;
    label: string;
    icon: React.ElementType;
}

const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'items', label: 'Kelola Item', icon: Package },
    { id: 'tokens', label: 'Token', icon: Ticket },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
];

interface AdminPageProps {
    adminToken: string;
}

export function AdminPage({ adminToken }: AdminPageProps) {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');
    const [itemId, setItemId] = useState<string | undefined>(undefined);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleNavigate = (page: string, id?: string) => {
        if (page === 'orders') {
            navigate('/admin/orders');
            return;
        }
        setCurrentPage(page as Page);
        setItemId(id);
        // Close sidebar on mobile when navigating
        if (window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    };

    const handleLogout = async () => {
        try {
            // Clear admin token and remember me flag
            localStorage.removeItem('adminToken');
            localStorage.removeItem('rememberAdminToken');
            navigate('/admin');
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <AdminDashboard onNavigate={handleNavigate} />;
            case 'items':
                return <ItemListPage onNavigate={handleNavigate} />;
            case 'item-form':
                return <ItemFormPage editItemId={itemId} onNavigate={handleNavigate} />;
            case 'tokens':
                return <TokensPage onNavigate={handleNavigate} adminToken={adminToken} />;
            case 'settings':
                return <SettingsPage onNavigate={handleNavigate} />;
            default:
                return <AdminDashboard onNavigate={handleNavigate} />;
        }
    };

    const getPageTitle = () => {
        switch (currentPage) {
            case 'dashboard':
                return 'Dashboard';
            case 'items':
                return 'Kelola Item';
            case 'item-form':
                return itemId ? 'Edit Item' : 'Tambah Item';
            case 'tokens':
                return 'Token Management';
            case 'settings':
                return 'Pengaturan';
            default:
                return 'Dashboard';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Toaster position="top-right" richColors />

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-20 xl:w-64"
                )}
            >
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                                <Package className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div className={cn("lg:hidden xl:block", !sidebarOpen && "lg:hidden")}>
                                <h1 className="font-bold text-gray-900">Jastip Admin</h1>
                                <p className="text-xs text-gray-500">Manage your business</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <ScrollArea className="flex-1 py-4">
                        <nav className="px-3 space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = currentPage === item.id ||
                                    (item.id === 'items' && currentPage === 'item-form');

                                return (
                                    <Button
                                        key={item.id}
                                        variant="ghost"
                                        onClick={() => handleNavigate(item.id)}
                                        className={cn(
                                            "w-full justify-start gap-3 h-11",
                                            isActive
                                                ? "bg-primary/10 text-primary hover:bg-primary/20"
                                                : "text-gray-600 hover:bg-gray-100"
                                        )}
                                    >
                                        <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary")} />
                                        <span className={cn("lg:hidden xl:block", !sidebarOpen && "lg:hidden")}>
                                            {item.label}
                                        </span>
                                        {isActive && (
                                            <ChevronRight className={cn("h-4 w-4 ml-auto lg:hidden xl:block", !sidebarOpen && "lg:hidden")} />
                                        )}
                                    </Button>
                                );
                            })}
                        </nav>
                    </ScrollArea>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-100">
                        <Button
                            variant="ghost"
                            onClick={handleLogout}
                            className="w-full justify-start gap-3 text-gray-500 hover:text-red-500 hover:bg-red-50"
                        >
                            <LogOut className="h-5 w-5" />
                            <span className={cn("lg:hidden xl:block", !sidebarOpen && "lg:hidden")}>Logout</span>
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
                {/* Top Header */}
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden"
                        >
                            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="hidden lg:flex"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{getPageTitle()}</h2>
                            <p className="text-sm text-gray-500 hidden sm:block">
                                {currentPage === 'dashboard' && 'Overview of your Jastip business'}
                                {currentPage === 'items' && 'Manage your product catalog'}
                                {currentPage === 'item-form' && (itemId ? 'Update product details' : 'Add new product')}
                                {currentPage === 'tokens' && 'Manage invite codes for users'}
                                {currentPage === 'settings' && 'Configure your business settings'}
                            </p>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-4 sm:p-6">
                    {renderPage()}
                </div>
            </main>
        </div>
    );
}
