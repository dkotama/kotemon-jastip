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
  const [adminToken, setAdminToken] = useState<string | null>(null);
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

  // Fetch data from API when logged in
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [configData, itemsData] = await Promise.all([
          publicApi.getConfig(),
          publicApi.getItems(),
        ]);

        const transformedItems: JastipItem[] = itemsData.items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.sellingPrice,
          weight: item.weightGrams,
          slots: item.availableSlots,
          status: item.badge,
          category: 'all',
          image: item.photos?.[0] ? getImageUrl(item.photos[0]) : '/images/item-1.jpg',
          description: item.description,
          views: item.viewCount,
          photos: item.photos?.map(getImageUrl) || [],
          withoutBoxNote: item.withoutBoxNote,
          isLimitedEdition: item.isLimitedEdition,
          isPreorder: item.isPreorder,
          isFragile: item.isFragile,
          // Admin compatibility
          slotsAvailable: item.availableSlots,
          maxSlots: 100, // Default for public items
          images: item.photos?.map(getImageUrl) || [],
          infoNotes: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        setItems(transformedItems);
        setStatus({
          isOpen: configData.jastipStatus === 'open',
          daysRemaining: configData.countdownDays || 0,
          quotaUsed: Math.round((configData.totalQuotaKg - configData.remainingQuotaKg) * 10) / 10,
          quotaTotal: configData.totalQuotaKg,
          arrivalDate: configData.estimatedArrivalDate,
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

  const handleAdminLogin = (token: string) => {
    setAdminToken(token);
    localStorage.setItem('adminToken', token);
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
      <Route path="/" element={
        user ? (
          <div className="min-h-screen bg-white">
            <Header
              user={user ? { id: user.id, name: user.name, email: user.email, photoUrl: user.photoUrl, avatar: user.avatar } : null}
              onSearch={setSearchQuery}
              onLogout={handleLogout}
            />
            <StatusBanner status={status} />
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
        adminToken ? <AdminPage /> : <Navigate to="/admin" />
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
