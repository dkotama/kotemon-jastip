import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Ticket,
  Plus,
  Copy,
  Trash2,
  UserX,
  CheckCircle2,
  Clock,
  User,
  Mail,
  Calendar,
  Search,
  TicketCheck,
  TicketX,
  Tickets,
  Loader2
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { adminApi } from '@/api/client';

// Token type from API
interface ApiToken {
  id: string;
  code: string;
  createdBy: string;
  usedBy: string | null;
  usedByName: string | null;
  usedByEmail: string | null;
  usedAt: string | null;
  expiresAt: string | null;
  isRevoked: boolean;
  userRevoked: boolean;
  createdAt: string;
}

interface TokensPageProps {
  onNavigate: (page: string, id?: string) => void;
  adminToken: string;
}

export function TokensPage({ adminToken }: TokensPageProps) {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tokenToDelete, setTokenToDelete] = useState<ApiToken | null>(null);
  const [tokenToRevoke, setTokenToRevoke] = useState<ApiToken | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch tokens on mount
  useEffect(() => {
    fetchTokens();
  }, [adminToken]);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getTokens(adminToken);
      setTokens(data);
    } catch (err) {
      toast.error('Failed to load tokens');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const availableTokens = tokens.filter(t => !t.usedBy && !t.isRevoked);
  const usedTokens = tokens.filter(t => t.usedBy !== null);

  const filteredUsedTokens = usedTokens.filter(token =>
    token.code.includes(searchQuery) ||
    token.usedByName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.usedByEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyToken = (code: string) => {
    const inviteLink = `${window.location.origin}/?invite=${code}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied to clipboard!');
  };

  const handleGenerateToken = async () => {
    try {
      setIsGenerating(true);
      const newToken = await adminApi.generateToken(adminToken);
      toast.success(`Token ${newToken.code} generated!`);
      await fetchTokens(); // Refresh list
    } catch (err) {
      toast.error('Failed to generate token');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteToken = async () => {
    if (tokenToDelete) {
      try {
        await adminApi.revokeToken(adminToken, tokenToDelete.id);
        setTokenToDelete(null);
        toast.success('Token deleted successfully');
        await fetchTokens(); // Refresh list
      } catch (err) {
        toast.error('Failed to delete token');
        console.error(err);
      }
    }
  };

  const handleRevokeToken = async () => {
    if (tokenToRevoke) {
      try {
        await adminApi.revokeToken(adminToken, tokenToRevoke.id);
        setTokenToRevoke(null);
        toast.success('Token access revoked');
        await fetchTokens(); // Refresh list
      } catch (err) {
        toast.error('Failed to revoke token');
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Token Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage invite codes for user registration</p>
        </div>
        <Button
          onClick={handleGenerateToken}
          disabled={isGenerating}
          className="bg-gradient-to-r from-blue-600 to-blue-500 hover:opacity-90 text-white"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Generate Token
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600">
                <TicketCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Token Tersedia</p>
                <p className="text-2xl font-bold text-gray-900">{availableTokens.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                <TicketX className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Token Terpakai</p>
                <p className="text-2xl font-bold text-gray-900">{usedTokens.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-gray-100 text-gray-600">
                <Tickets className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Token</p>
                <p className="text-2xl font-bold text-gray-900">{tokens.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Tokens Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TicketCheck className="h-5 w-5 text-emerald-500" />
            Available Tokens
            <Badge variant="outline" className="ml-2 bg-emerald-50 text-emerald-700 border-emerald-200">
              {availableTokens.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availableTokens.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No available tokens</p>
              <Button
                onClick={handleGenerateToken}
                disabled={isGenerating}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Generate your first token
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {availableTokens.map((token) => (
                <div
                  key={token.id}
                  className="group relative bg-gradient-to-br from-white to-gray-50 border rounded-xl p-5 hover:shadow-md transition-all"
                >
                  {/* Ticket Style Header */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-t-xl" />

                  <div className="pt-2">
                    <div className="flex items-center justify-center mb-4">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-xs font-medium text-emerald-600">Available</span>
                      </div>
                    </div>

                    {/* Large Token Display */}
                    <div className="text-center mb-4">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Kode Undangan</p>
                      <div className="flex justify-center gap-1.5">
                        {token.code.split('').map((digit, i) => (
                          <div
                            key={i}
                            className="w-10 h-12 bg-gray-900 rounded-lg flex items-center justify-center"
                          >
                            <span className="text-xl font-mono font-bold text-white">{digit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-4">
                      <Clock className="h-3 w-3" />
                      Created {formatDate(new Date(token.createdAt))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleCopyToken(token.code)}
                      >
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                        Copy Link
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => setTokenToDelete(token)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Used Tokens Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TicketX className="h-5 w-5 text-purple-500" />
              Used Tokens
              <Badge variant="outline" className="ml-2 bg-purple-50 text-purple-700 border-purple-200">
                {usedTokens.length}
              </Badge>
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by code, name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Digunakan Oleh</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsedTokens.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <TicketX className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No used tokens found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsedTokens.map((token) => (
                    <TableRow key={token.id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div className="font-mono font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded inline-block">
                          {token.code}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-purple-500" />
                          </div>
                          <span className="font-medium">{token.usedByName || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-500">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="text-sm">{token.usedByEmail || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-500">
                          <Calendar className="h-3.5 w-3.5" />
                          <span className="text-sm">{token.usedAt ? formatDate(new Date(token.usedAt)) : '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => setTokenToRevoke(token)}
                          disabled={token.userRevoked}
                        >
                          <UserX className="h-3.5 w-3.5 mr-1.5" />
                          {token.userRevoked ? 'Revoked' : 'Cabut Akses'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Token Dialog */}
      <AlertDialog open={!!tokenToDelete} onOpenChange={() => setTokenToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Token</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete token <strong>{tokenToDelete?.code}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteToken} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke Token Dialog */}
      <AlertDialog open={!!tokenToRevoke} onOpenChange={() => setTokenToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke access for <strong>{tokenToRevoke?.usedByName}</strong>?
              They will no longer be able to access the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokeToken} className="bg-red-500 hover:bg-red-600">
              Revoke Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
