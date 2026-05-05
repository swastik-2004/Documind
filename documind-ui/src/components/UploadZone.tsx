import { useRef, useState } from 'react'
import { uploadDocument } from '../api/documents'

interface Props {
  onUploaded: () => void
}

const ACCEPTED = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

export default function UploadZone({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!ACCEPTED.includes(file.type) && !file.name.match(/\.(pdf|docx)$/i)) {
      setError('Only PDF and DOCX files are supported.')
      return
    }
    setError('')
    setUploading(true)
    try {
      await uploadDocument(file)
      onUploaded()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload failed.'
      setError(msg)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
        dragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-[#334155] hover:border-indigo-500/50 hover:bg-[#1E293B]'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {uploading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Uploading...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <div>
            <p className="text-white text-sm font-medium">Drop your file here or click to browse</p>
            <p className="text-slate-500 text-xs mt-1">PDF and DOCX supported</p>
          </div>
        </div>
      )}
      {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
    </div>
  )
}
