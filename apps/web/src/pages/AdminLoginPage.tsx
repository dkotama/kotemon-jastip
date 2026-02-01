import { useState } from 'react';
import { Loader2, Shield, ShoppingBag, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { adminApi } from '@/api/client';

interface AdminLoginPageProps {
  onLogin?: (token: string) => void;
  error?: string;
}

export function AdminLoginPage({ onLogin, error: initialError }: AdminLoginPageProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError('Password wajib diisi');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await adminApi.login(password);
      onLogin?.(result.token);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Login gagal';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = error || initialError;

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md relative shadow-xl border-0">
        <CardHeader className="text-center space-y-6 pt-8">
          {/* Logo */}
          <div className="mx-auto">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-foreground">
              Admin Login
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Masukkan password admin untuk mengelola jastip
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pb-8">
          {displayError && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertDescription className="text-red-700">{displayError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password admin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Memuat...
                </>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>

          <div className="flex items-center justify-center gap-2 pt-4">
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Kotemon Jastip Admin</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminLoginPage;
