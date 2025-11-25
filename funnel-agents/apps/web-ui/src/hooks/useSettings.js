import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  teamAPI,
  apiKeysAPI,
  integrationsAPI,
  billingAPI,
  profileAPI,
  organizationAPI
} from '@/api/settings';
import { toast } from 'sonner';

/**
 * Custom hooks for settings data management
 * Uses React Query for caching, loading states, and optimistic updates
 */

// ============= TEAM MEMBERS HOOKS =============

export const useTeamMembers = (params = {}) => {
  return useQuery({
    queryKey: ['teamMembers', params],
    queryFn: () => teamAPI.getTeamMembers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useInviteMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: teamAPI.inviteMember,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      toast.success('Invitation sent successfully');
      return data;
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to send invitation');
    },
  });
};

export const useRemoveMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: teamAPI.removeMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      toast.success('Member removed successfully');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to remove member');
    },
  });
};

export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }) => teamAPI.updateMemberRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      toast.success('Member role updated successfully');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to update member role');
    },
  });
};

export const useResendInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: teamAPI.resendInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      toast.success('Invitation resent successfully');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to resend invitation');
    },
  });
};

export const useCancelInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: teamAPI.cancelInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      toast.success('Invitation cancelled');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to cancel invitation');
    },
  });
};

// ============= API KEYS HOOKS =============

export const useApiKeys = () => {
  return useQuery({
    queryKey: ['apiKeys'],
    queryFn: apiKeysAPI.getApiKeys,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiKeysAPI.createApiKey,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      toast.success('API key created successfully');
      return data;
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to create API key');
    },
  });
};

export const useRevokeApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiKeysAPI.revokeApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      toast.success('API key revoked successfully');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to revoke API key');
    },
  });
};

// ============= INTEGRATIONS HOOKS =============

export const useAvailableIntegrations = () => {
  return useQuery({
    queryKey: ['availableIntegrations'],
    queryFn: integrationsAPI.getAvailableIntegrations,
    staleTime: 10 * 60 * 1000, // 10 minutes (changes rarely)
  });
};

export const useConnectedIntegrations = () => {
  return useQuery({
    queryKey: ['connectedIntegrations'],
    queryFn: integrationsAPI.getConnectedIntegrations,
    staleTime: 5 * 60 * 1000,
  });
};

export const useConnectIntegration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ integrationId, config }) =>
      integrationsAPI.connectIntegration(integrationId, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectedIntegrations'] });
      toast.success('Integration connected successfully');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to connect integration');
    },
  });
};

export const useDisconnectIntegration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: integrationsAPI.disconnectIntegration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectedIntegrations'] });
      toast.success('Integration disconnected');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to disconnect integration');
    },
  });
};

export const useSyncIntegration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: integrationsAPI.syncIntegration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectedIntegrations'] });
      toast.success('Integration synced successfully');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to sync integration');
    },
  });
};

export const useUpdateIntegrationSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ integrationId, settings }) =>
      integrationsAPI.updateIntegrationSettings(integrationId, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connectedIntegrations'] });
      toast.success('Integration settings updated');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to update integration settings');
    },
  });
};

// ============= BILLING HOOKS =============

export const useBillingInfo = () => {
  return useQuery({
    queryKey: ['billingInfo'],
    queryFn: billingAPI.getBillingInfo,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUsageStats = () => {
  return useQuery({
    queryKey: ['usageStats'],
    queryFn: billingAPI.getUsageStats,
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent updates)
    refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
  });
};

export const useInvoiceHistory = (params = {}) => {
  return useQuery({
    queryKey: ['invoiceHistory', params],
    queryFn: () => billingAPI.getInvoiceHistory(params),
    staleTime: 10 * 60 * 1000,
  });
};

export const useDownloadInvoice = () => {
  return useMutation({
    mutationFn: billingAPI.downloadInvoice,
    onSuccess: (data) => {
      // Handle invoice download (e.g., open in new tab or download file)
      if (data.url) {
        window.open(data.url, '_blank');
      }
      toast.success('Invoice download started');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to download invoice');
    },
  });
};

export const useUpdatePaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: billingAPI.updatePaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billingInfo'] });
      toast.success('Payment method updated successfully');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to update payment method');
    },
  });
};

export const useUpdatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: billingAPI.updatePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billingInfo'] });
      queryClient.invalidateQueries({ queryKey: ['usageStats'] });
      toast.success('Subscription plan updated successfully');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to update subscription plan');
    },
  });
};

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: billingAPI.cancelSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billingInfo'] });
      toast.success('Subscription cancelled');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to cancel subscription');
    },
  });
};

// ============= PROFILE HOOKS =============

export const useProfile = () => {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: profileAPI.getProfile,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileAPI.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to update profile');
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }) =>
      profileAPI.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to change password');
    },
  });
};

export const useSetup2FA = () => {
  return useMutation({
    mutationFn: profileAPI.setup2FA,
    onSuccess: (data) => {
      return data;
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to setup 2FA');
    },
  });
};

export const useVerify2FA = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileAPI.verify2FA,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Two-factor authentication enabled');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to verify 2FA code');
    },
  });
};

export const useDisable2FA = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileAPI.disable2FA,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Two-factor authentication disabled');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to disable 2FA');
    },
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileAPI.updateNotificationPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Notification preferences updated');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to update notification preferences');
    },
  });
};

export const useDeleteAccount = () => {
  return useMutation({
    mutationFn: ({ password, reason }) => profileAPI.deleteAccount(password, reason),
    onSuccess: () => {
      toast.success('Account deletion initiated');
      // Redirect to logout or login page
      setTimeout(() => {
        window.location.href = '/logout';
      }, 2000);
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to delete account');
    },
  });
};

// ============= ORGANIZATION HOOKS =============

export const useOrganization = () => {
  return useQuery({
    queryKey: ['organization'],
    queryFn: organizationAPI.getOrganization,
    staleTime: 10 * 60 * 1000,
  });
};

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: organizationAPI.updateOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      toast.success('Organization settings saved successfully');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to update organization settings');
    },
  });
};

export const useUploadLogo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: organizationAPI.uploadLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      toast.success('Logo uploaded successfully');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to upload logo');
    },
  });
};
