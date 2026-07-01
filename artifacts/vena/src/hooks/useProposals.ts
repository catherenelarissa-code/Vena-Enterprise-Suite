import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@workspace/api-client-react';

interface ProposalTemplate {
  id: number;
  name: string;
  content?: string;
  html?: string;
  description?: string;
  colors?: { primary?: string; secondary?: string; accent?: string };
  fonts?: { body?: string; heading?: string };
  logoFileId?: number;
  bannerFileId?: number;
  isDefault?: string;
  createdAt: string;
  updatedAt: string;
}

export function useProposalTemplates() {
  return useQuery<ProposalTemplate[]>({
    queryKey: ['proposal-templates'],
    queryFn: () => customFetch<ProposalTemplate[]>('/api/automation/proposals/templates', {
      method: 'GET',
    }),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateProposalTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { name: string; content: string; description?: string }) =>
      customFetch<ProposalTemplate>('/api/automation/proposals/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-templates'] })
    },
  })
}

export function useUpdateProposalTemplate(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<{ name: string; content: string; description?: string }>) =>
      customFetch<ProposalTemplate>(`/api/automation/proposals/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-templates'] })
    },
  })
}

export function useDeleteProposalTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      customFetch(`/api/automation/proposals/templates/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-templates'] })
    },
  })
}

export function useFileUpload() {
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return customFetch<{ url?: string; path?: string }>('/api/uploads', {
        method: 'POST',
        body: formData as any,
      })
    },
  })
}

export function useGeneratePDF() {
  return useMutation({
    mutationFn: (payload: { templateId: number; clientId: number; attachments?: string[] }) =>
      customFetch<Blob>('/api/automation/proposals/generate-pdf', {
        method: 'POST',
        responseType: 'blob',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
  })
}

export function useSaveClientFile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ clientId, file }: { clientId: number; file: File }) => {
      const formData = new FormData()
      formData.append('file', file)
      return customFetch(`/api/clients/${clientId}/files`, {
        method: 'POST',
        body: formData as any,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-files'] })
    },
  })
}
