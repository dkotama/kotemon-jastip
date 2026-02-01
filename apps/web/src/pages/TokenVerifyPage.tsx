import { useState } from 'react';
import { Loader2, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { authApi } from '@/api/client';

interface TokenVerifyPageProps {
  tempToken: string;
  googleProfile: {
    name: string;
    email: string;
    photoUrl?: string;
  };
  onVerified?: () => void;
  onError?: (error: string) => void;
}

export function TokenVerifyPage({ tempToken, googleProfile, onVerified, onError }: TokenVerifyPageProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length !== 5) {
      setError('Kode harus 5 digit');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authApi.verifyToken(code, tempToken);
      setSuccess(true);
      setTimeout(() => {
        onVerified?.();
      }, 1500);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Kode tidak valid';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Render digit inputs
  const renderDigitInputs = () => {
    return (
      <div className="flex justify-center gap-3">
        {[0, 1, 2, 3, 4].map((index) => (
          <input
            key={index}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={code[index] || ''}
            onChange={(e) => {
              const newCode = code.split('');
              newCode[index] = e.target.value.replace(/\D/g, '');
              setCode(newCode.join(''));

              // Auto-focus next input
              if (e.target.value && index < 4) {
                const nextInput = document.getElementById(`digit-${index + 1}`);
                nextInput?.focus();
              }
            }}
            onKeyDown={(e) => {
              // Handle backspace to go to previous input
              if (e.key === 'Backspace' && !code[index] && index > 0) {
                const prevInput = document.getElementById(`digit-${index - 1}`);
                prevInput?.focus();
              }
            }}
            id={`digit-${index}`}
            className="w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            disabled={isLoading || success}
          />
        ))}
      </div>
    );
  };

  if (success) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md relative shadow-xl border-0">
          <CardContent className="py-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifikasi Berhasil!</h2>
            <p className="text-gray-500">Selamat datang di Kotemon Jastip</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md relative shadow-xl border-0">
        <CardHeader className="text-center space-y-6 pt-8">
          {/* Logo */}
          <div className="mx-auto">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <Lock className="h-8 w-8 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-foreground">
              Verifikasi Kode Undangan
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Masukkan kode 5 digit dari admin untuk melanjutkan
            </CardDescription>
          </div>

          {/* Google Profile */}
          <div className="flex items-center justify-center gap-4 p-4 bg-muted rounded-xl">
            <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
              <AvatarImage src={googleProfile.photoUrl} alt={googleProfile.name} />
              <AvatarFallback className="bg-primary text-white">
                {googleProfile.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="font-medium text-foreground">{googleProfile.name}</p>
              <p className="text-sm text-muted-foreground">{googleProfile.email}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pb-8">
          {error && (
            <Alert variant="destructive" className="bg-destructive/15 border-destructive/20">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-destructive">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {renderDigitInputs()}

            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all duration-200"
              disabled={isLoading || code.length !== 5}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary-foreground" />
                  Memverifikasi...
                </>
              ) : (
                'Verifikasi Kode'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Belum punya kode? Hubungi admin untuk mendapatkan undangan
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default TokenVerifyPage;
