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

      // use customFetch which attaches credentials and infers response type
      const data = await customFetch<{ url?: string; path?: string }>('/api/uploads', {
        method: 'POST',
        body: fd as any,
        responseType: 'auto',
      } as any)

      const url = (data && (data.url || data.path)) || ''
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
