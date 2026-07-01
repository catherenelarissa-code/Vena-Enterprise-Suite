// lightweight services specific for proposals feature
import { customFetch } from '@workspace/api-client-react'

export async function listTemplates() {
  return customFetch('/api/automation/proposals/templates', { method: 'GET' })
}

export async function createTemplate(payload: { name: string; content: string }) {
  return customFetch('/api/automation/proposals/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
}

export async function uploadFile(file: File) {
  const fd = new FormData()
  fd.append('file', file)
  // use customFetch so credentials are automatically included
  return customFetch<{ url?: string; path?: string }>('/api/uploads', { method: 'POST', body: fd as any, responseType: 'auto' } as any)
}

export async function generatePdf(payload: { templateId: number; clientId: number; attachments?: string[] }) {
  return customFetch<Blob>('/api/automation/proposals/generate-pdf', {
    method: 'POST',
    responseType: 'blob',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  } as any) as Promise<Blob>
}

export async function saveClientFile(clientId: number, file: File) {
  const fd = new FormData()
  fd.append('file', file)
  return customFetch(`/api/clients/${clientId}/files`, { method: 'POST', body: fd as any } as any)
}
