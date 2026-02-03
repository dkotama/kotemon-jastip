import { useStore } from '@/hooks/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Package,
  TrendingUp,
  Eye,
  Ticket,
  ShoppingCart,
  Plus,
  Key,
  Settings,
  List,
  Clock,
  PackagePlus,
  KeyRound,
  ClipboardList,
  Cog
} from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';
import type { Activity } from '@/types';

interface AdminDashboardProps {
  onNavigate: (page: string, id?: string) => void;
}

const activityIcons: Record<Activity['type'], React.ReactNode> = {
  item_added: <PackagePlus className="h-4 w-4" />,
  item_updated: <ClipboardList className="h-4 w-4" />,
  item_deleted: <Package className="h-4 w-4" />,
  token_generated: <KeyRound className="h-4 w-4" />,
  token_used: <Ticket className="h-4 w-4" />,
  settings_updated: <Cog className="h-4 w-4" />,
};

const activityColors: Record<Activity['type'], string> = {
  item_added: 'bg-emerald-100 text-emerald-600',
  item_updated: 'bg-blue-100 text-blue-600',
  item_deleted: 'bg-red-100 text-red-600',
  token_generated: 'bg-purple-100 text-purple-600',
  token_used: 'bg-amber-100 text-amber-600',
  settings_updated: 'bg-gray-100 text-gray-600',
};

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { getDashboardStats, activities } = useStore();
  const stats = getDashboardStats();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const statCards = [
    {
      title: 'Total Items',
      value: stats.totalItems,
      icon: Package,
      color: 'from-blue-600 to-blue-400',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Profit',
      value: formatCurrency(stats.totalProfit),
      icon: TrendingUp,
      color: 'from-accent to-accent/80',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Total Views',
      value: stats.totalViews.toLocaleString('id-ID'),
      icon: Eye,
      color: 'from-blue-600 to-blue-400',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Tokens',
      value: stats.activeTokens,
      icon: Ticket,
      color: 'from-blue-600 to-blue-400',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      subtitle: `${stats.pendingOrders} pending`,
      icon: ShoppingCart,
      color: 'from-blue-600 to-blue-400',
      bgColor: 'bg-blue-50',
    },
  ];

  const quickActions = [
    {
      title: 'Tambah Item',
      description: 'Add new product to catalog',
      icon: Plus,
      color: 'from-blue-600 to-blue-500',
      onClick: () => onNavigate('item-form'),
    },
    {
      title: 'Generate Token',
      description: 'Create new invite code',
      icon: Key,
      color: 'from-blue-600 to-blue-500',
      onClick: () => onNavigate('tokens'),
    },
    {
      title: 'Kelola Item',
      description: 'View and manage products',
      icon: List,
      color: 'from-blue-600 to-blue-500',
      onClick: () => onNavigate('items'),
    },
    {
      title: 'Pengaturan',
      description: 'Configure Jastip settings',
      icon: Settings,
      color: 'from-gray-500 to-gray-600',
      onClick: () => onNavigate('settings'),
    },
    {
      title: 'Kelola Orders',
      description: 'Manage customer orders',
      icon: ShoppingCart,
      color: 'from-orange-500 to-red-500',
      onClick: () => onNavigate('orders'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of your Jastip business</p>
        </div>
        <Badge variant="outline" className="px-3 py-1 border-blue-200 bg-blue-50 text-blue-700">
          <Clock className="h-3 w-3 mr-1" />
          {new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {stat.title}
                  </p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  {stat.subtitle && (
                    <p className="text-xs text-blue-600 mt-0.5">{stat.subtitle}</p>
                  )}
                </div>
                <div className={`p-2.5 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`}
                    style={{ color: 'inherit' }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Card
              key={index}
              className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group overflow-hidden"
              onClick={action.onClick}
            >
              <CardContent className="p-0">
                <div className={`h-1.5 bg-gradient-to-r ${action.color}`} />
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg bg-gradient-to-br ${action.color} text-white`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {action.title}
                      </p>
                      <p className="text-xs text-gray-500">{action.description}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {activities.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">No recent activity</p>
                ) : (
                  activities.slice(0, 20).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${activityColors[activity.type]}`}>
                        {activityIcons[activity.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDistanceToNow(new Date(activity.timestamp))}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium text-emerald-700">System Online</span>
              </div>
              <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                Active
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Storage Used</span>
                <span className="font-medium">24%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full w-[24%] bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Quota Usage</span>
                <span className="font-medium">{Math.round((stats.totalOrders / 100) * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                  style={{ width: `${Math.min((stats.totalOrders / 100) * 100, 100)}%` }}
                />
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => onNavigate('settings')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
