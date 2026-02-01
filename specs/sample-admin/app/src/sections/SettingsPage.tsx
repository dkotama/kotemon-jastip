import { useStore } from '@/hooks/useStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Store, 
  Calendar as CalendarIcon, 
  Clock, 
  Users,
  Package,
  CheckCircle2,
  AlertCircle,
  Save,
  ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface SettingsPageProps {
  onNavigate: (page: string, id?: string) => void;
}

export function SettingsPage({ }: SettingsPageProps) {
  const { settings, updateSettings, getDashboardStats } = useStore();
  const stats = getDashboardStats();
  
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    updateSettings(localSettings);
    setHasChanges(false);
    toast.success('Settings saved successfully!');
  };

  const handleChange = (updates: Partial<typeof localSettings>) => {
    setLocalSettings(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const quotaUsage = Math.round((stats.totalOrders / (localSettings.totalQuota || 1)) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
          <p className="text-sm text-gray-500 mt-1">Configure your Jastip business settings</p>
        </div>
        {hasChanges && (
          <Button 
            onClick={handleSave}
            className="bg-gradient-to-r from-[#f8a5c2] to-[#6c5ce7] hover:opacity-90 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        )}
      </div>

      {/* Jastip Status Card */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className={`h-1.5 ${localSettings.isOpen ? 'bg-emerald-500' : 'bg-red-500'}`} />
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-xl ${localSettings.isOpen ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                <Store className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Jastip Status</h2>
                <p className="text-sm text-gray-500">
                  {localSettings.isOpen 
                    ? 'Currently accepting orders' 
                    : 'Not accepting orders'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge 
                variant={localSettings.isOpen ? 'default' : 'destructive'}
                className={`px-3 py-1 ${localSettings.isOpen ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}`}
              >
                {localSettings.isOpen ? (
                  <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Open</>
                ) : (
                  <><AlertCircle className="h-3.5 w-3.5 mr-1" /> Closed</>
                )}
              </Badge>
              <Switch
                checked={localSettings.isOpen}
                onCheckedChange={(checked) => handleChange({ isOpen: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quota Configuration */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-[#6c5ce7]" />
              Quota Configuration
            </CardTitle>
            <CardDescription>
              Set maximum order slots across all items
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="totalQuota">Total Quota (slots)</Label>
              <Input
                id="totalQuota"
                type="number"
                value={localSettings.totalQuota}
                onChange={(e) => handleChange({ totalQuota: parseInt(e.target.value) || 0 })}
                min={1}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Current Usage</span>
                <span className="font-medium">{stats.totalOrders} / {localSettings.totalQuota} slots</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    quotaUsage > 90 ? 'bg-red-500' : quotaUsage > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(quotaUsage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                {quotaUsage}% of total quota used
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Arrival Date */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-[#f8a5c2]" />
              Arrival Date
            </CardTitle>
            <CardDescription>
              When items will arrive in Indonesia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localSettings.arrivalDate ? (
                      format(new Date(localSettings.arrivalDate), 'PPP', { locale: id })
                    ) : (
                      <span className="text-gray-400">Pick a date</span>
                    )}
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={localSettings.arrivalDate ? new Date(localSettings.arrivalDate) : undefined}
                    onSelect={(date) => handleChange({ arrivalDate: date || null })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {localSettings.arrivalDate && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {Math.ceil((new Date(localSettings.arrivalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days remaining
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Countdown Target */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Countdown Target
            </CardTitle>
            <CardDescription>
              Optional deadline for orders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localSettings.countdownTarget ? (
                      format(new Date(localSettings.countdownTarget), 'PPP', { locale: id })
                    ) : (
                      <span className="text-gray-400">No deadline set</span>
                    )}
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={localSettings.countdownTarget ? new Date(localSettings.countdownTarget) : undefined}
                    onSelect={(date) => handleChange({ countdownTarget: date || null })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {localSettings.countdownTarget && (
              <div className="p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Deadline: {format(new Date(localSettings.countdownTarget), 'PPP', { locale: id })}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Public Page Preview */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Store className="h-5 w-5 text-emerald-500" />
              Public Page Preview
            </CardTitle>
            <CardDescription>
              How your page appears to customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-xl overflow-hidden bg-white">
              {/* Preview Header */}
              <div className="bg-gradient-to-r from-[#f8a5c2] to-[#6c5ce7] p-4 text-white">
                <h3 className="font-bold text-lg">Jastip Japan</h3>
                <p className="text-sm text-white/80">Premium Japanese Products</p>
              </div>
              
              {/* Status Banner */}
              {!localSettings.isOpen && (
                <div className="bg-red-50 p-3 flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Not accepting orders at this time</span>
                </div>
              )}
              
              {/* Preview Content */}
              <div className="p-4 space-y-3">
                {localSettings.countdownTarget && (
                  <div className="flex items-center justify-between p-2 bg-amber-50 rounded-lg">
                    <span className="text-sm text-amber-700">Order Deadline</span>
                    <span className="text-sm font-medium text-amber-700">
                      {format(new Date(localSettings.countdownTarget), 'dd MMM yyyy')}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-700">Arrival Date</span>
                  <span className="text-sm font-medium text-blue-700">
                    {localSettings.arrivalDate 
                      ? format(new Date(localSettings.arrivalDate), 'dd MMM yyyy')
                      : 'TBA'}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Quota</span>
                    <span className="font-medium">{stats.totalOrders} / {localSettings.totalQuota}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#f8a5c2] to-[#6c5ce7] rounded-full"
                      style={{ width: `${Math.min(quotaUsage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
