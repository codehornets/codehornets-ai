import { toast } from 'sonner';

/**
 * Settings API Service
 * Handles all settings-related API calls
 *
 * NOTE: This is a placeholder implementation for settings that are not yet
 * migrated to the NestJS backend. Most endpoints show "Coming soon" messages.
 *
 * When backend endpoints are ready, replace the placeholder implementations
 * with actual API calls to the NestJS backend.
 */

/**
 * Show "coming soon" toast for unimplemented features
 */
const showComingSoon = (featureName) => {
  toast.info(`${featureName} coming soon`, {
    description: 'This feature is being migrated to the new backend.'
  });
  // Return mock data to prevent errors
  return Promise.resolve({
    success: true,
    message: 'Feature coming soon'
  });
};

// Team Members API
export const teamAPI = {
  // Get all team members - PLACEHOLDER
  getTeamMembers: async (params = {}) => {
    try {
      // TODO: Replace with actual NestJS API call when endpoint is ready
      // const response = await fetch(`${API_URL}/api/settings/team/members?${new URLSearchParams(params)}`);
      // return await response.json();

      // Mock data for now
      return {
        members: [
          {
            id: '1',
            name: 'Current User',
            email: 'user@example.com',
            role: 'owner',
            status: 'active',
            createdAt: new Date().toISOString(),
          }
        ],
        total: 1,
        totalPages: 1,
      };
    } catch (error) {
      console.error('Error fetching team members:', error);
      throw error;
    }
  },

  // Invite new member - PLACEHOLDER
  inviteMember: async (data) => {
    return showComingSoon('Team member invitations');
  },

  // Remove member - PLACEHOLDER
  removeMember: async (userId) => {
    return showComingSoon('Team member removal');
  },

  // Update member role - PLACEHOLDER
  updateMemberRole: async (userId, role) => {
    return showComingSoon('Team member role updates');
  },

  // Resend invitation - PLACEHOLDER
  resendInvitation: async (userId) => {
    return showComingSoon('Invitation resend');
  },

  // Cancel invitation - PLACEHOLDER
  cancelInvitation: async (userId) => {
    return showComingSoon('Invitation cancellation');
  },
};

// API Keys API
export const apiKeysAPI = {
  // Get all API keys - PLACEHOLDER
  getApiKeys: async () => {
    try {
      // TODO: Replace with actual NestJS API call
      // const response = await fetch(`${API_URL}/api/settings/api-keys`);
      // return await response.json();

      // Mock data
      return {
        keys: []
      };
    } catch (error) {
      console.error('Error fetching API keys:', error);
      throw error;
    }
  },

  // Create new API key - PLACEHOLDER
  createApiKey: async (data) => {
    return showComingSoon('API key creation');
  },

  // Revoke API key - PLACEHOLDER
  revokeApiKey: async (keyId) => {
    return showComingSoon('API key revocation');
  },
};

// Integrations API
export const integrationsAPI = {
  // Get available integrations - PLACEHOLDER
  getAvailableIntegrations: async () => {
    return showComingSoon('Integration management');
  },

  // Get connected integrations - PLACEHOLDER
  getConnectedIntegrations: async () => {
    return showComingSoon('Integration management');
  },

  // Connect integration - PLACEHOLDER
  connectIntegration: async (integrationId, config = {}) => {
    return showComingSoon('Integration connection');
  },

  // Disconnect integration - PLACEHOLDER
  disconnectIntegration: async (integrationId) => {
    return showComingSoon('Integration disconnection');
  },

  // Sync integration - PLACEHOLDER
  syncIntegration: async (integrationId) => {
    return showComingSoon('Integration sync');
  },

  // Update integration settings - PLACEHOLDER
  updateIntegrationSettings: async (integrationId, settings) => {
    return showComingSoon('Integration settings update');
  },
};

// Billing API
export const billingAPI = {
  // Get billing info - PLACEHOLDER
  getBillingInfo: async () => {
    try {
      // Mock data
      return {
        billing: {
          plan: 'Free',
          status: 'active',
          nextBillingDate: null,
        }
      };
    } catch (error) {
      console.error('Error fetching billing info:', error);
      throw error;
    }
  },

  // Get usage statistics - PLACEHOLDER
  getUsageStats: async () => {
    try {
      // Mock data
      return {
        usage: {
          api_calls: { current: 0, limit: 1000 },
          storage: { current: 0, limit: 1024 },
          users: { current: 1, limit: 5 },
        }
      };
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      throw error;
    }
  },

  // Get invoice history - PLACEHOLDER
  getInvoiceHistory: async (params = {}) => {
    try {
      return {
        invoices: []
      };
    } catch (error) {
      console.error('Error fetching invoice history:', error);
      throw error;
    }
  },

  // Download invoice - PLACEHOLDER
  downloadInvoice: async (invoiceId) => {
    return showComingSoon('Invoice download');
  },

  // Update payment method - PLACEHOLDER
  updatePaymentMethod: async (paymentMethodData) => {
    return showComingSoon('Payment method update');
  },

  // Update subscription plan - PLACEHOLDER
  updatePlan: async (planId) => {
    return showComingSoon('Plan upgrade/downgrade');
  },

  // Cancel subscription - PLACEHOLDER
  cancelSubscription: async (reason = '') => {
    return showComingSoon('Subscription cancellation');
  },
};

// Profile API
export const profileAPI = {
  // Get current user profile
  getProfile: async () => {
    try {
      // Use the existing auth.me() endpoint
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated');

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const user = await response.json();
      return {
        profile: {
          ...user,
          name: user.full_name || user.name,
          bio: user.bio || '',
          avatar: user.avatar || '',
          has2FAEnabled: user.twoFactorEnabled || false,
          notificationPreferences: {
            email: {
              tasks: true,
              mentions: true,
              updates: true,
              marketing: false,
            },
            push: {
              tasks: true,
              mentions: true,
              updates: false,
            },
          }
        }
      };
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  // Update profile - PLACEHOLDER
  updateProfile: async (data) => {
    return showComingSoon('Profile updates');
  },

  // Change password - PLACEHOLDER
  changePassword: async (currentPassword, newPassword) => {
    return showComingSoon('Password changes');
  },

  // Setup 2FA - PLACEHOLDER
  setup2FA: async () => {
    return showComingSoon('Two-factor authentication setup');
  },

  // Verify 2FA - PLACEHOLDER
  verify2FA: async (token) => {
    return showComingSoon('Two-factor authentication verification');
  },

  // Disable 2FA - PLACEHOLDER
  disable2FA: async (password) => {
    return showComingSoon('Two-factor authentication disable');
  },

  // Update notification preferences - PLACEHOLDER
  updateNotificationPreferences: async (preferences) => {
    return showComingSoon('Notification preference updates');
  },

  // Delete account - PLACEHOLDER
  deleteAccount: async (password, reason = '') => {
    return showComingSoon('Account deletion');
  },
};

// Organization API
export const organizationAPI = {
  // Get organization settings - PLACEHOLDER
  getOrganization: async () => {
    try {
      // Mock data
      const user = JSON.parse(localStorage.getItem('user_data') || '{}');
      return {
        organization: {
          name: user.company_name || 'My Organization',
          website: '',
          description: '',
          email: user.email || '',
          phone: '',
          address: '',
          logo: '',
        }
      };
    } catch (error) {
      console.error('Error fetching organization:', error);
      throw error;
    }
  },

  // Update organization - PLACEHOLDER
  updateOrganization: async (data) => {
    return showComingSoon('Organization settings update');
  },

  // Upload organization logo - PLACEHOLDER
  uploadLogo: async (file) => {
    return showComingSoon('Logo upload');
  },
};
