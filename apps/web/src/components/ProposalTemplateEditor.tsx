import React, { useEffect, useState } from 'react'
import { customFetch } from '@workspace/api-client-react'

type Template = {
  id: number
  name: string
  content: string
}

export default function ProposalTemplateEditor({ onTemplateSaved }: { onTemplateSaved?: (id: number) => void }) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    try {
      const res = await customFetch<Template[]>('/api/automation/proposals/templates', { method: 'GET' })
      setTemplates(res || [])
    } catch (err) {
      console.error('failed to load templates', err)
    }
  }

  async function saveTemplate() {
    setLoading(true)
    try {
      const created = await customFetch<Template>('/api/automation/proposals/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content }),
      })
      setTemplates((t) => [created, ...t])
      setName('')
      setContent('')
      onTemplateSaved?.(created.id)
    } catch (err) {
      console.error('failed to save template', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <input className="input" placeholder="Nome do template" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <textarea className="input" rows={6} style={{ width: '100%' }} placeholder="Conteúdo (use placeholders como {{client.name}})" value={content} onChange={(e) => setContent(e.target.value)} />
      </div>
      <div>
        <button className="button" onClick={saveTemplate} disabled={loading}>{loading ? 'Salvando...' : 'Salvar template'}</button>
      </div>

      <hr style={{ margin: '16px 0' }} />

      <h4>Templates existentes</h4>
      <ul>
        {templates.map((t) => (
          <li key={t.id}>
            <strong>{t.name}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}
