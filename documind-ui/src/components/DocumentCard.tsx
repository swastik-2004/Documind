import { useNavigate } from 'react-router-dom'
import type { Document } from '../types'
import StatusBadge from './StatusBadge'

interface Props {
  doc: Document
  onDelete: (id: string) => void
}

export default function DocumentCard({ doc, onDelete }: Props) {
  const navigate = useNavigate()

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 flex flex-col gap-3 hover:border-indigo-500/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{doc.filename}</p>
            <p className="text-slate-500 text-xs">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
          </div>
        </div>
        <StatusBadge status={doc.status} />
      </div>
      {doc.chunk_count > 0 && (
        <p className="text-slate-500 text-xs">{doc.chunk_count} chunks indexed</p>
      )}
      {doc.status === 'pending' && (
        <p className="text-amber-400 text-xs flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
          Processing...
        </p>
      )}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => navigate('/query', { state: { docId: doc.id, filename: doc.filename } })}
          disabled={doc.status !== 'ready'}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/30 disabled:cursor-not-allowed text-white text-sm py-2 rounded-lg transition-colors font-medium"
        >
          Query
        </button>
        <button
          onClick={() => onDelete(doc.id)}
          className="px-3 py-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}
