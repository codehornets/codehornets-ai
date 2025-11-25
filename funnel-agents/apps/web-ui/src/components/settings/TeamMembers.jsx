import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Plus, MoreVertical, Mail, Shield, Trash2, Search, RotateCw, X, Loader2, AlertCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import {
  useTeamMembers,
  useInviteMember,
  useRemoveMember,
  useUpdateMemberRole,
  useResendInvitation,
  useCancelInvitation,
} from '@/hooks/useSettings';

export default function TeamMembers() {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [emailError, setEmailError] = useState('');

  const pageSize = 20;

  // Fetch team members with pagination and filters
  const { data: membersData, isLoading, error, refetch } = useTeamMembers({
    page: currentPage,
    limit: pageSize,
    search: searchQuery,
    status: statusFilter,
  });

  // Mutations
  const inviteMemberMutation = useInviteMember();
  const removeMemberMutation = useRemoveMember();
  const updateRoleMutation = useUpdateMemberRole();
  const resendInvitationMutation = useResendInvitation();
  const cancelInvitationMutation = useCancelInvitation();

  const members = membersData?.members || [];
  const totalPages = membersData?.totalPages || 1;
  const totalCount = membersData?.total || 0;

  const roleColors = {
    owner: 'bg-purple-500/20 text-purple-400 border-purple-500/20',
    admin: 'bg-red-500/20 text-red-400 border-red-500/20',
    member: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
    viewer: 'bg-slate-500/20 text-slate-400 border-slate-500/20',
  };

  const roleDescriptions = {
    owner: 'Full access including billing and deletion',
    admin: 'Full access to all features',
    member: 'Create and manage tasks',
    viewer: 'View-only access',
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Invalid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleInvite = async () => {
    if (!validateEmail(inviteEmail)) return;

    try {
      await inviteMemberMutation.mutateAsync({
        email: inviteEmail,
        role: inviteRole,
      });
      setInviteModalOpen(false);
      setInviteEmail('');
      setInviteRole('member');
      setEmailError('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleResendInvite = async (userId) => {
    try {
      await resendInvitationMutation.mutateAsync(userId);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCancelInvite = async (userId) => {
    try {
      await cancelInvitationMutation.mutateAsync(userId);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleChangeRole = async (member, newRole) => {
    if (member.role === newRole) return;

    try {
      await updateRoleMutation.mutateAsync({
        userId: member.id,
        role: newRole,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      await removeMemberMutation.mutateAsync(memberToRemove.id);
      setMemberToRemove(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredMembers = members;

  if (error) {
    return (
      <Card className="glassmorphism-light border-slate-800/50">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <div className="text-center">
              <p className="text-lg font-medium text-slate-300">Failed to load team members</p>
              <p className="text-sm text-slate-400 mt-1">{error.message || 'An error occurred'}</p>
            </div>
            <Button onClick={() => refetch()} variant="outline" className="border-slate-700">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="glassmorphism-light border-slate-800/50">
        <CardHeader className="border-b border-slate-800/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center" style={{ color: 'var(--text-primary)' }}>
                <Users className="w-5 h-5 mr-2 text-blue-400" />
                Team Members
              </CardTitle>
              <p className="text-sm text-slate-400 mt-1">
                {totalCount} {totalCount === 1 ? 'member' : 'members'}
              </p>
            </div>
            <Button
              onClick={() => setInviteModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Search and Filter Bar */}
          <div className="p-4 border-b border-slate-800/50 space-y-3">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); // Reset to first page on search
                  }}
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="" className="text-slate-300">All statuses</SelectItem>
                  <SelectItem value="active" className="text-slate-300">Active</SelectItem>
                  <SelectItem value="pending" className="text-slate-300">Pending</SelectItem>
                  <SelectItem value="deactivated" className="text-slate-300">Deactivated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Members List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-slate-400">
                {searchQuery || statusFilter ? 'No members found matching your criteria' : 'No team members yet'}
              </p>
              {!searchQuery && !statusFilter && (
                <Button
                  onClick={() => setInviteModalOpen(true)}
                  variant="outline"
                  className="mt-4 border-slate-700"
                >
                  Invite your first member
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {filteredMembers.map((member) => (
                <div key={member.id} className="p-4 hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-medium text-sm">
                          {getInitials(member.name)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{member.name}</p>
                        <p className="text-slate-400 text-sm flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {member.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Role Selector */}
                      {member.role !== 'owner' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild disabled={updateRoleMutation.isPending}>
                            <button
                              className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity ${roleColors[member.role]} disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                              <Shield className="w-3 h-3 inline mr-1" />
                              {member.role.toUpperCase()}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                            {['admin', 'member', 'viewer'].map((role) => (
                              <DropdownMenuItem
                                key={role}
                                onClick={() => handleChangeRole(member, role)}
                                className="text-slate-300 focus:bg-slate-700 focus:text-white"
                              >
                                Change to {role.charAt(0).toUpperCase() + role.slice(1)}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}

                      {member.role === 'owner' && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${roleColors[member.role]}`}>
                          <Shield className="w-3 h-3 inline mr-1" />
                          OWNER
                        </span>
                      )}

                      {/* Status Badge */}
                      {member.status === 'pending' && (
                        <>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">
                            Pending
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResendInvite(member.id)}
                            disabled={resendInvitationMutation.isPending}
                            className="text-blue-400 hover:text-blue-300 h-8"
                          >
                            {resendInvitationMutation.isPending ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <RotateCw className="w-3 h-3 mr-1" />
                            )}
                            Resend
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelInvite(member.id)}
                            disabled={cancelInvitationMutation.isPending}
                            className="text-red-400 hover:text-red-300 h-8"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Cancel
                          </Button>
                        </>
                      )}

                      {member.status === 'deactivated' && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400 border border-slate-500/20">
                          Deactivated
                        </span>
                      )}

                      {/* Actions Menu */}
                      {member.role !== 'owner' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                            <DropdownMenuItem
                              onClick={() => setMemberToRemove(member)}
                              className="text-red-400 focus:bg-slate-700 focus:text-red-400"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-800/50 flex items-center justify-between">
              <p className="text-sm text-slate-400">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isLoading}
                  className="border-slate-700"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || isLoading}
                  className="border-slate-700"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Mail className="w-5 h-5 mr-2 text-blue-400" />
              Invite Team Member
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Send an invitation to join your organization
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  setEmailError('');
                }}
                className={`bg-slate-800/50 border-slate-700 text-white ${emailError ? 'border-red-500' : ''}`}
              />
              {emailError && (
                <p className="text-xs text-red-400">{emailError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-slate-300">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {['admin', 'member', 'viewer'].map((role) => (
                    <SelectItem key={role} value={role} className="text-slate-300 focus:bg-slate-700 focus:text-white">
                      <div>
                        <div className="font-medium">{role.charAt(0).toUpperCase() + role.slice(1)}</div>
                        <div className="text-xs text-slate-400">{roleDescriptions[role]}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setInviteModalOpen(false);
                setEmailError('');
              }}
              disabled={inviteMemberMutation.isPending}
              className="border-slate-700 text-white hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={!inviteEmail || inviteMemberMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {inviteMemberMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Invitation'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to remove <strong className="text-white">{memberToRemove?.name}</strong> from your team?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-slate-700 text-white hover:bg-slate-800"
              disabled={removeMemberMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={removeMemberMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {removeMemberMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove Member'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
