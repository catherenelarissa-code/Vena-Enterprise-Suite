import React, { useEffect, useState } from 'react'
import { customFetch } from '@workspace/api-client-react'
import FileUploader from './FileUploader'

type Template = { id: number; name: string; content: string }
type Client = { id: number; name: string; address?: string; contact?: string }

export default function ProposalGenerator({ selectedTemplateId }: { selectedTemplateId?: number | null }) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [attachments, setAttachments] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadTemplates()
    loadClients()
  }, [])

  useEffect(() => {
    if (selectedTemplateId) {
      const t = templates.find((x) => x.id === selectedTemplateId)
      if (t) setSelectedTemplate(t)
    }
  }, [selectedTemplateId, templates])

  async function loadTemplates() {
    try {
      const res = await customFetch<Template[]>('/api/automation/proposals/templates', { method: 'GET' })
      setTemplates(res || [])
    } catch (err) {
      console.error(err)
    }
  }

  async function loadClients() {
    try {
      // assumes there is an endpoint to list clients in CRM
      const res = await customFetch<Client[]>('/api/clients', { method: 'GET' })
      setClients(res || [])
    } catch (err) {
      console.error('failed to load clients', err)
    }
  }

  async function handleGenerate() {
    if (!selectedClientId || !selectedTemplate) return alert('Selecione cliente e template')
    setGenerating(true)

    try {
      // Fetch client data to fill mail merge
      const client = await customFetch<Client>(`/api/clients/${selectedClientId}`, { method: 'GET' })

      // Prepare payload
      const payload = {
        templateId: selectedTemplate.id,
        clientId: client.id,
        attachments: attachments, // server-side should map attachments
      }

      // Call generation endpoint that returns a PDF blob
      const blob = await customFetch<Blob>('/api/automation/proposals/generate-pdf', {
        method: 'POST',
        responseType: 'blob',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      // Download locally
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `proposal-${client.name.replace(/\s+/g, '-')}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      // Then upload to client's file area (assumes endpoint)
      const fd = new FormData()
      fd.append('file', new File([blob], `proposal-${client.name}.pdf`, { type: 'application/pdf' }))

      await fetch(`/api/clients/${client.id}/files`, { method: 'POST', body: fd, credentials: 'include' })

      alert('PDF gerado e salvo na área de arquivos do cliente')
    } catch (err) {
      console.error('failed to generate pdf', err)
      alert('Erro ao gerar PDF')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <label>Cliente:</label>
        <select className="input" value={selectedClientId ?? ''} onChange={(e) => setSelectedClientId(e.target.value ? Number(e.target.value) : null)}>
          <option value="">-- selecione --</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>Template:</label>
        <select className="input" value={selectedTemplate?.id ?? ''} onChange={(e) => {
          const id = e.target.value ? Number(e.target.value) : null
          setSelectedTemplate(templates.find(t => t.id === id) ?? null)
        }}>
          <option value="">-- selecione --</option>
          {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>Anexos (logo/banner/imagens):</label>
        <FileUploader onUploaded={(url) => setAttachments((a) => [...a, url])} />
        <ul>
          {attachments.map((u, i) => <li key={i}><a href={u} target="_blank" rel="noreferrer">{u}</a></li>)}
        </ul>
      </div>

      <div>
        <button className="button" onClick={handleGenerate} disabled={generating}>{generating ? 'Gerando...' : 'Gerar PDF'}</button>
      </div>
    </div>
  )
}
