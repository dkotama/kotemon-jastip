import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Header } from '@/sections/Header';
import { StatusBanner } from '@/sections/StatusBanner';
import { CategoryFilter } from '@/sections/CategoryFilter';
import { ItemGrid } from '@/sections/ItemGrid';
import { ItemDetailModal } from '@/sections/ItemDetailModal';
import { LoginPage } from '@/pages/LoginPage';
import { TokenVerifyPage } from '@/pages/TokenVerifyPage';
import { AdminLoginPage } from '@/pages/AdminLoginPage';
import { AdminPage } from '@/pages/AdminPage';
import { AdminOrderListPage } from '@/sections/admin/order/AdminOrderListPage';
import { AdminOrderDetailPage } from '@/sections/admin/order/AdminOrderDetailPage';
import { CartDrawer } from '@/components/CartDrawer';
import { CustomItemModal } from '@/sections/CustomItemModal';
import { CustomOrderBanner } from '@/sections/CustomOrderBanner';
import { OrderListPage } from '@/sections/order/OrderListPage';
import { publicApi, authApi, getImageUrl } from '@/api/client';
import type { JastipItem, JastipStatus, User, ItemCategory } from '@/types';

// Default status while loading
const defaultStatus: JastipStatus = {
  isOpen: true,
  daysRemaining: 5,
  quotaUsed: 0,
  quotaTotal: 20,
  arrivalDate: '15 Februari 2026',
};

// Decode JWT payload without verification (for getting profile info from temp token)
function decodeJwtPayload(token: string): { name: string; email: string; photoUrl?: string } | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return {
      name: decoded.name || '',
      email: decoded.email || '',
      photoUrl: decoded.photoUrl,
    };
  } catch {
    return null;
  }
}

// Main App component with routing
function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

// Routes component
function AppRoutes() {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  // Check if admin was remembered on previous session
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    const remembered = localStorage.getItem('rememberAdminToken');
    if (remembered === 'true') {
      return localStorage.getItem('adminToken');
    }
    return null;
  });
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Verification flow state
  const [isVerifying, setIsVerifying] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [googleProfile, setGoogleProfile] = useState<{ name: string; email: string; photoUrl?: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('all');
  const [selectedItem, setSelectedItem] = useState<JastipItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // API data
  const [items, setItems] = useState<JastipItem[]>([]);
  const [status, setStatus] = useState<JastipStatus>(defaultStatus);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check auth status on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for token in URL (from OAuth callback)
        const urlParams = new URLSearchParams(window.location.search);
        const urlTempToken = urlParams.get('tempToken');
        const oauthError = urlParams.get('error');
        const inviteCode = urlParams.get('invite');

        // Store invite code in sessionStorage for use after OAuth redirect
        if (inviteCode) {
          sessionStorage.setItem('pendingInviteCode', inviteCode);
          window.history.replaceState({}, '', window.location.pathname);
        }

        if (oauthError) {
          setError(`Login failed: ${oauthError}`);
          window.history.replaceState({}, '', window.location.pathname);
        }

        if (urlTempToken) {
          const profile = decodeJwtPayload(urlTempToken);
          if (profile) {
            setGoogleProfile(profile);
            setTempToken(urlTempToken);
            setIsVerifying(true);
          }
          window.history.replaceState({}, '', window.location.pathname);
          setIsLoadingAuth(false);
          return;
        }

        // Check if already authenticated
        const authStatus = await authApi.getStatus();
        if (authStatus.authenticated && authStatus.user) {
          setUser({
            id: authStatus.user.id,
            name: authStatus.user.name,
            email: '',
          });
        }
      } catch (err) {
        // Not authenticated, that's fine
      } finally {
        setIsLoadingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // Fetch data from API when logged in (using consolidated index endpoint)
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Single API call for all landing page data
        const indexData = await publicApi.getIndexPage();

        const transformedItems: JastipItem[] = indexData.items.all.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          basePriceYen: 0, // Public view doesn't see this
          basePriceRp: item.basePriceRp,
          sellingPriceRp: item.sellingPriceRp,
          price: item.sellingPriceRp, // Alias
          weight: item.weightGrams, // Alias
          weightGrams: item.weightGrams,
          withoutBoxNote: item.withoutBoxNote,
          isLimitedEdition: item.isLimitedEdition,
          isPreorder: item.isPreorder,
          isFragile: item.isFragile,
          category: item.category,
          infoNotes: item.infoNotes,
          maxOrders: 100,
          currentOrders: 0,
          availableSlots: item.availableSlots,
          status: item.badge, // Alias? computed?
          badge: item.badge, // Actual prop
          viewCount: item.viewCount,
          photos: item.photos,

          // Frontend compatibility aliases
          image: item.photos?.[0] ? getImageUrl(item.photos[0]) : '/images/item-1.jpg',
          images: item.photos?.map(getImageUrl) || [],
          slots: item.availableSlots,
          slotsAvailable: item.availableSlots,
          views: item.viewCount,

          isAvailable: true,
          isDraft: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

        setItems(transformedItems);
        setStatus({
          isOpen: indexData.config.jastipStatus === 'open',
          daysRemaining: indexData.config.countdownDays || 0,
          quotaUsed: Math.round((indexData.config.totalQuotaKg - indexData.config.remainingQuotaKg) * 10) / 10,
          quotaTotal: indexData.config.totalQuotaKg,
          arrivalDate: indexData.config.estimatedArrivalDate || 'Belum diatur',
          // Add close date for validation display
          closeDate: indexData.config.jastipCloseDate,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleLogin = () => {
    authApi.loginWithGoogle();
  };

  const handleVerified = async () => {
    try {
      const authStatus = await authApi.getStatus();
      if (authStatus.authenticated && authStatus.user) {
        setUser({
          id: authStatus.user.id,
          name: authStatus.user.name,
          email: '',
        });
        setIsVerifying(false);
        setTempToken(null);
        setGoogleProfile(null);
      }
    } catch (err) {
      console.error('Failed to get auth status after verification:', err);
    }
  };

  const handleAdminLogin = (token: string, rememberMe: boolean) => {
    setAdminToken(token);
    if (rememberMe) {
      localStorage.setItem('adminToken', token);
      localStorage.setItem('rememberAdminToken', 'true');
    } else {
      // Session-only: store in memory state, remove from localStorage
      localStorage.removeItem('adminToken');
      localStorage.removeItem('rememberAdminToken');
    }
    navigate('/admin/dashboard');
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      setItems([]);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };



  const handleItemClick = (item: JastipItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
    publicApi.incrementView(item.id).catch(console.error);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedItem(null), 200);
  };

  // Show loading
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show token verification page
  if (isVerifying && tempToken && googleProfile) {
    return (
      <TokenVerifyPage
        tempToken={tempToken}
        googleProfile={googleProfile}
        onVerified={handleVerified}
      />
    );
  }

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/orders" element={user ? <OrderListPage /> : <Navigate to="/" />} />
      <Route path="/" element={
        user ? (
          <div className="min-h-screen bg-white">
            <Header
              user={user ? { id: user.id, name: user.name, email: user.email, photoUrl: user.photoUrl, avatar: user.avatar } : null}
              onSearch={setSearchQuery}
              onLogout={handleLogout}
            />
            <StatusBanner status={status} />
            <CustomOrderBanner />
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
            <ItemGrid
              items={filteredItems}
              onItemClick={handleItemClick}
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              loading={loading}
            />
            <ItemDetailModal
              item={selectedItem}
              isOpen={isModalOpen}
              onClose={handleCloseModal}
            />
            <CartDrawer />
            <CustomItemModal />
          </div>
        ) : (
          <LoginPage onLogin={handleLogin} error={error || undefined} />
        )
      } />

      {/* Admin Routes */}
      <Route path="/admin" element={
        adminToken ? <Navigate to="/admin/dashboard" /> : <AdminLoginPage onLogin={handleAdminLogin} />
      } />
      <Route path="/admin/dashboard" element={
        adminToken ? <AdminPage adminToken={adminToken} /> : <Navigate to="/admin" />
      } />
      <Route path="/admin/orders" element={
        adminToken ? <AdminOrderListPage adminToken={adminToken} /> : <Navigate to="/admin" />
      } />
      <Route path="/admin/orders/:id" element={
        adminToken ? <AdminOrderDetailPage adminToken={adminToken} /> : <Navigate to="/admin" />
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes >
  );
}

export default App;
