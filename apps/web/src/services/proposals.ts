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
  const resp = await fetch('/api/uploads', { method: 'POST', body: fd, credentials: 'include' })
  if (!resp.ok) throw new Error('upload failed')
  return resp.json()
}
