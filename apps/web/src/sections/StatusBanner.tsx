import { useEffect, useState } from 'react';
import { Clock, Package, Calendar, AlertTriangle } from 'lucide-react';
import type { JastipStatus } from '@/types';

interface StatusBannerProps {
  status: JastipStatus;
}

export function StatusBanner({ status }: StatusBannerProps) {
  const [progressValue, setProgressValue] = useState(0);

  useEffect(() => {
    // Animate progress bar on load
    const timer = setTimeout(() => {
      setProgressValue((status.quotaUsed / status.quotaTotal) * 100);
    }, 100);
    return () => clearTimeout(timer);
  }, [status.quotaUsed, status.quotaTotal]);

  const quotaRemaining = status.quotaTotal - status.quotaUsed;
  const quotaPercentage = Math.round((status.quotaUsed / status.quotaTotal) * 100);

  // Check if dates are synchronized (arrival should be after close)
  const isDateSyncIssue = status.closeDate && status.arrivalDate && 
    new Date(status.arrivalDate) < new Date(status.closeDate);

  return (
    <div className="w-full bg-secondary/10 border-b border-secondary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${status.isOpen
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
                }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${status.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                  }`}
              />
              {status.isOpen ? 'Open' : 'Closed'}
            </div>
          </div>

          {/* Countdown */}
          {status.isOpen && (
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-sm">
                Tutup dalam{' '}
                <span className="font-semibold text-amber-600">
                  {status.daysRemaining} hari
                </span>
              </span>
            </div>
          )}

          {/* Quota */}
          <div className="flex items-center gap-3 min-w-[200px]">
            <Package className="h-4 w-4 text-primary flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Sisa quota</span>
                <span className="font-medium text-gray-900">
                  {quotaRemaining}kg / {status.quotaTotal}kg
                </span>
              </div>
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`absolute top-0 left-0 h-full rounded-full transition-all duration-800 ease-out ${quotaPercentage > 80
                      ? 'bg-red-400'
                      : quotaPercentage > 50
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                  style={{ width: `${progressValue}%` }}
                />
              </div>
            </div>
          </div>

          {/* Arrival Date */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#74b9ff]" />
            <span className="text-sm">
              Estimasi sampai:{' '}
              <span className={`font-medium ${isDateSyncIssue ? 'text-red-600' : 'text-gray-900'}`}>
                {status.arrivalDate}
              </span>
            </span>
            {isDateSyncIssue && (
              <span className="text-xs text-red-600 flex items-center gap-1" title="Estimasi harus setelah tanggal tutup">
                <AlertTriangle className="h-3 w-3" />
                (sebelum tutup!)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
