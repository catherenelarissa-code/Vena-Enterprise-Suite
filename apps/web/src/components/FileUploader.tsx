import React, { useRef, useState } from 'react'
import { customFetch } from '@workspace/api-client-react'

export default function FileUploader({ onUploaded }: { onUploaded: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const file = files[0]
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)

      // send to generic upload endpoint - server should return { url }
      const resp = await fetch('/api/uploads', { method: 'POST', body: fd, credentials: 'include' })
      if (!resp.ok) throw new Error('upload failed')
      const data = await resp.json()
      const url = data.url || data.path || ''
      if (url) onUploaded(url)
    } catch (err) {
      console.error('upload error', err)
      alert('Erro no upload')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <input ref={inputRef} type="file" onChange={(e) => handleFiles(e.target.files)} />
      {uploading && <div>Enviando...</div>}
    </div>
  )
}
