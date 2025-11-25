# API Client Migration Examples

This guide shows how to migrate existing Base44 SDK code to the new unified API client.

## Table of Contents
1. [Basic Entity Operations](#basic-entity-operations)
2. [Authentication](#authentication)
3. [Queries and Filters](#queries-and-filters)
4. [Integrations](#integrations)
5. [React Component Examples](#react-component-examples)
6. [Custom Hooks](#custom-hooks)
7. [Error Handling](#error-handling)

## Basic Entity Operations

### List Entities

**Before (Base44):**
```javascript
import { base44 } from '@/api/base44Client';

const leads = await base44.entities.Query.leads.find({
  limit: 20,
  offset: 0
});
```

**After (Unified):**
```javascript
import apiClient from '@/api/client';

const leads = await apiClient.entities.leads.list({
  page: 1,
  limit: 20
});
```

### Get Single Entity

**Before (Base44):**
```javascript
import { base44 } from '@/api/base44Client';

const lead = await base44.entities.Query.leads.findById('123');
```

**After (Unified):**
```javascript
import apiClient from '@/api/client';

const lead = await apiClient.entities.leads.get('123');
```

### Create Entity

**Before (Base44):**
```javascript
import { base44 } from '@/api/base44Client';

const newLead = await base44.entities.Query.leads.create({
  name: 'John Doe',
  email: 'john@example.com'
});
```

**After (Unified):**
```javascript
import apiClient from '@/api/client';

const newLead = await apiClient.entities.leads.create({
  name: 'John Doe',
  email: 'john@example.com'
});
```

### Update Entity

**Before (Base44):**
```javascript
import { base44 } from '@/api/base44Client';

await base44.entities.Query.leads.update('123', {
  status: 'contacted'
});
```

**After (Unified):**
```javascript
import apiClient from '@/api/client';

await apiClient.entities.leads.update('123', {
  status: 'contacted'
});
```

### Delete Entity

**Before (Base44):**
```javascript
import { base44 } from '@/api/base44Client';

await base44.entities.Query.leads.delete('123');
```

**After (Unified):**
```javascript
import apiClient from '@/api/client';

await apiClient.entities.leads.delete('123');
```

## Authentication

### Login

**Before (Base44):**
```javascript
import { base44 } from '@/api/base44Client';

const user = await base44.auth.login(email, password);
```

**After (Unified):**
```javascript
import { auth } from '@/api/client';

const { user, accessToken } = await auth.login(email, password);
```

### Get Current User

**Before (Base44):**
```javascript
import { base44 } from '@/api/base44Client';

const user = await base44.auth.me();
```

**After (Unified):**
```javascript
import { auth } from '@/api/client';

const user = await auth.getCurrentUser();
```

### Logout

**Before (Base44):**
```javascript
import { base44 } from '@/api/base44Client';

await base44.auth.logout();
```

**After (Unified):**
```javascript
import { auth } from '@/api/client';

await auth.logout();
```

### Check Authentication

**Before (Base44):**
```javascript
import { base44 } from '@/api/base44Client';

const isAuth = await base44.auth.isAuthenticated();
```

**After (Unified):**
```javascript
import { auth } from '@/api/client';

const isAuth = auth.isAuthenticated();
```

## Queries and Filters

### Filter by Status

**Before (Base44):**
```javascript
import { base44 } from '@/api/base44Client';

const leads = await base44.entities.Query.leads.find({
  where: { status: 'new' }
});
```

**After (Unified):**
```javascript
import apiClient from '@/api/client';

const leads = await apiClient.entities.leads.query({
  where: { status: 'new' }
});
```

### Multiple Filters

**Before (Base44):**
```javascript
import { base44 } from '@/api/base44Client';

const leads = await base44.entities.Query.leads.find({
  where: {
    status: 'new',
    score: { $gte: 70 }
  },
  sort: '-createdAt'
});
```

**After (Unified):**
```javascript
import apiClient from '@/api/client';

const leads = await apiClient.entities.leads.query({
  where: {
    status: 'new',
    score: { $gte: 70 }
  },
  sort: '-createdAt'
});
```

### Pagination

**Before (Base44):**
```javascript
import { base44 } from '@/api/base44Client';

const leads = await base44.entities.Query.leads.find({
  limit: 20,
  offset: 40 // page 3
});
```

**After (Unified):**
```javascript
import apiClient from '@/api/client';

const leads = await apiClient.entities.leads.list({
  page: 3,
  limit: 20
});

// Access pagination metadata
console.log(leads.meta.total);
console.log(leads.meta.totalPages);
```

### Populate Relations

**Before (Base44):**
```javascript
import { base44 } from '@/api/base44Client';

const leads = await base44.entities.Query.leads.find({
  populate: ['company', 'assignedTo']
});
```

**After (Unified):**
```javascript
import apiClient from '@/api/client';

const leads = await apiClient.entities.leads.list({
  populate: ['company', 'assignedTo']
});
```

## Integrations

### Invoke LLM

**Before (Base44):**
```javascript
import { InvokeLLM } from '@/api/integrations';

const response = await InvokeLLM({
  model: 'gpt-4',
  prompt: 'Generate email'
});
```

**After (Unified):**
```javascript
import { integrations } from '@/api/client';

const response = await integrations.Core.InvokeLLM({
  model: 'gpt-4',
  prompt: 'Generate email'
});
```

### Send Email

**Before (Base44):**
```javascript
import { SendEmail } from '@/api/integrations';

await SendEmail({
  to: 'user@example.com',
  subject: 'Hello',
  body: 'Message'
});
```

**After (Unified):**
```javascript
import { integrations } from '@/api/client';

await integrations.Core.SendEmail({
  to: 'user@example.com',
  subject: 'Hello',
  body: 'Message'
});
```

### Upload File

**Before (Base44):**
```javascript
import { UploadFile } from '@/api/integrations';

const result = await UploadFile(file);
```

**After (Unified):**
```javascript
import { integrations } from '@/api/client';

const result = await integrations.Core.UploadFile(file, {
  folder: 'documents'
});
```

## React Component Examples

### LeadsTable Component

**Before (Base44):**
```javascript
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export function LeadsTable() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const data = await base44.entities.Query.leads.find({
        limit: 20
      });
      setLeads(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading ? <Spinner /> : <Table data={leads} />}
    </div>
  );
}
```

**After (Unified with React Query):**
```javascript
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';

export function LeadsTable() {
  const { data, isLoading } = useQuery({
    queryKey: ['leads', { page: 1 }],
    queryFn: () => apiClient.entities.leads.list({ page: 1, limit: 20 })
  });

  if (isLoading) return <Spinner />;

  return <Table data={data.data} meta={data.meta} />;
}
```

### LeadDetailDrawer Component

**Before (Base44):**
```javascript
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export function LeadDetailDrawer({ leadId, onClose }) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLead();
  }, [leadId]);

  const loadLead = async () => {
    try {
      setLoading(true);
      const data = await base44.entities.Query.leads.findById(leadId);
      setLead(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (updates) => {
    try {
      await base44.entities.Query.leads.update(leadId, updates);
      loadLead(); // Reload
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Drawer>
      {loading ? <Spinner /> : <LeadDetails lead={lead} onUpdate={handleUpdate} />}
    </Drawer>
  );
}
```

**After (Unified with React Query):**
```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';

export function LeadDetailDrawer({ leadId, onClose }) {
  const queryClient = useQueryClient();

  const { data: lead, isLoading } = useQuery({
    queryKey: ['leads', leadId],
    queryFn: () => apiClient.entities.leads.get(leadId, {
      populate: ['company', 'assignedTo']
    })
  });

  const updateMutation = useMutation({
    mutationFn: (updates) => apiClient.entities.leads.update(leadId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['leads', leadId]);
      queryClient.invalidateQueries(['leads']);
    }
  });

  const handleUpdate = (updates) => {
    updateMutation.mutate(updates);
  };

  if (isLoading) return <Spinner />;

  return (
    <Drawer>
      <LeadDetails
        lead={lead}
        onUpdate={handleUpdate}
        isUpdating={updateMutation.isPending}
      />
    </Drawer>
  );
}
```

## Custom Hooks

### useLeads Hook

```javascript
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';

export function useLeads(filters = {}) {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: () => apiClient.entities.leads.list(filters),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

// Usage
function LeadsPage() {
  const { data, isLoading, error } = useLeads({
    page: 1,
    limit: 20,
    where: { status: 'new' }
  });

  if (isLoading) return <Spinner />;
  if (error) return <Error error={error} />;

  return <LeadsTable data={data.data} meta={data.meta} />;
}
```

### useLead Hook

```javascript
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';

export function useLead(leadId, options = {}) {
  return useQuery({
    queryKey: ['leads', leadId],
    queryFn: () => apiClient.entities.leads.get(leadId, options),
    enabled: !!leadId
  });
}

// Usage
function LeadDetail({ leadId }) {
  const { data: lead, isLoading } = useLead(leadId, {
    populate: ['company', 'assignedTo', 'activities']
  });

  if (isLoading) return <Spinner />;

  return <div>{lead.name}</div>;
}
```

### useCreateLead Hook

```javascript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => apiClient.entities.leads.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
    }
  });
}

// Usage
function CreateLeadForm() {
  const createLead = useCreateLead();

  const handleSubmit = async (formData) => {
    try {
      await createLead.mutateAsync(formData);
      toast.success('Lead created!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={createLead.isPending}>
        {createLead.isPending ? 'Creating...' : 'Create Lead'}
      </button>
    </form>
  );
}
```

### useUpdateLead Hook

```javascript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';

export function useUpdateLead(leadId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates) => apiClient.entities.leads.update(leadId, updates),
    onMutate: async (updates) => {
      // Optimistic update
      await queryClient.cancelQueries(['leads', leadId]);
      const previous = queryClient.getQueryData(['leads', leadId]);

      queryClient.setQueryData(['leads', leadId], (old) => ({
        ...old,
        ...updates
      }));

      return { previous };
    },
    onError: (err, updates, context) => {
      // Rollback on error
      queryClient.setQueryData(['leads', leadId], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['leads', leadId]);
      queryClient.invalidateQueries(['leads']);
    }
  });
}

// Usage
function LeadStatusButton({ leadId, currentStatus }) {
  const updateLead = useUpdateLead(leadId);

  const handleStatusChange = (newStatus) => {
    updateLead.mutate({ status: newStatus });
  };

  return (
    <Select
      value={currentStatus}
      onChange={handleStatusChange}
      disabled={updateLead.isPending}
    />
  );
}
```

### useDeleteLead Hook

```javascript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/api/client';

export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leadId) => apiClient.entities.leads.delete(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
    }
  });
}

// Usage
function DeleteLeadButton({ leadId }) {
  const deleteLead = useDeleteLead();

  const handleDelete = async () => {
    if (confirm('Are you sure?')) {
      try {
        await deleteLead.mutateAsync(leadId);
        toast.success('Lead deleted');
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  return (
    <Button
      onClick={handleDelete}
      disabled={deleteLead.isPending}
      variant="destructive"
    >
      {deleteLead.isPending ? 'Deleting...' : 'Delete'}
    </Button>
  );
}
```

## Error Handling

### Component-level Error Handling

**Before:**
```javascript
const loadLeads = async () => {
  try {
    const data = await base44.entities.Query.leads.find();
    setLeads(data);
  } catch (error) {
    console.error(error);
    setError('Failed to load leads');
  }
};
```

**After:**
```javascript
const { data, error, isLoading } = useQuery({
  queryKey: ['leads'],
  queryFn: () => apiClient.entities.leads.list(),
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
});

if (error) {
  return <ErrorAlert error={error} />;
}
```

### Global Error Handler

```javascript
// src/lib/queryClient.js
import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000,
      onError: (error) => {
        if (error.status === 401) {
          // Redirect to login
          window.location.href = '/login';
        } else if (error.status === 403) {
          toast.error('Permission denied');
        } else if (error.status >= 500) {
          toast.error('Server error. Please try again later.');
        } else {
          toast.error(error.message);
        }
      }
    },
    mutations: {
      onError: (error) => {
        toast.error(error.message || 'An error occurred');
      }
    }
  }
});
```

### Authentication Error Handling

```javascript
// src/components/LoginForm.jsx
import { useMutation } from '@tanstack/react-query';
import { auth } from '@/api/client';
import { toast } from 'sonner';

export function LoginForm() {
  const loginMutation = useMutation({
    mutationFn: ({ email, password }) => auth.login(email, password),
    onSuccess: (data) => {
      // Redirect to dashboard
      window.location.href = '/dashboard';
    },
    onError: (error) => {
      if (error.status === 401) {
        toast.error('Invalid email or password');
      } else if (error.status === 429) {
        toast.error('Too many login attempts. Please try again later.');
      } else {
        toast.error('Login failed. Please try again.');
      }
    }
  });

  const handleSubmit = (formData) => {
    loginMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={loginMutation.isPending}>
        {loginMutation.isPending ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

## Testing with New Client

### Mock API Client

```javascript
// src/__mocks__/apiClient.js
export default {
  entities: {
    leads: {
      list: jest.fn(() => Promise.resolve({
        data: [],
        meta: { total: 0, page: 1, limit: 20 }
      })),
      get: jest.fn((id) => Promise.resolve({
        id,
        name: 'Test Lead',
        email: 'test@example.com'
      })),
      create: jest.fn((data) => Promise.resolve({ id: '123', ...data })),
      update: jest.fn((id, data) => Promise.resolve({ id, ...data })),
      delete: jest.fn(() => Promise.resolve())
    }
  },
  auth: {
    login: jest.fn(() => Promise.resolve({
      user: { id: '1', email: 'test@example.com' },
      accessToken: 'token',
      refreshToken: 'refresh'
    })),
    getCurrentUser: jest.fn(() => Promise.resolve({
      id: '1',
      email: 'test@example.com'
    })),
    isAuthenticated: jest.fn(() => true)
  }
};
```

### Component Test

```javascript
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { LeadsTable } from '@/components/LeadsTable';
import apiClient from '@/api/client';

jest.mock('@/api/client');

describe('LeadsTable', () => {
  it('should render leads', async () => {
    apiClient.entities.leads.list.mockResolvedValue({
      data: [
        { id: '1', name: 'John Doe', email: 'john@example.com' }
      ],
      meta: { total: 1, page: 1, limit: 20 }
    });

    render(
      <QueryClientProvider client={queryClient}>
        <LeadsTable />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
});
```

---

**For more examples and patterns, see:**
- [README.md](./README.md) - Comprehensive documentation
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Quick lookup guide
- [React Query docs](https://tanstack.com/query/latest) - Advanced patterns
