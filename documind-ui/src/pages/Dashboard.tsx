import { useEffect, useState, useCallback } from 'react'
import Navbar from '../components/Navbar'
import UploadZone from '../components/UploadZone'
import DocumentCard from '../components/DocumentCard'
import { listDocuments, deleteDocument } from '../api/documents'
import type { Document } from '../types'

export default function Dashboard() {
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDocs = useCallback(async () => {
    try {
      const data = await listDocuments()
      setDocs(data)
    } catch {
      // silent — user sees empty state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDocs()
    const interval = setInterval(() => {
      setDocs((prev) => {
        if (prev.some((d) => d.status === 'pending')) fetchDocs()
        return prev
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [fetchDocs])

  async function handleDelete(id: string) {
    await deleteDocument(id)
    setDocs((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <div className="min-h-screen bg-[#0F172A]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Your Documents</h1>
          <p className="text-slate-400 text-sm mt-1">Upload files and ask AI questions about them</p>
        </div>

        <div className="mb-8">
          <UploadZone onUploaded={fetchDocs} />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 h-40 animate-pulse" />
            ))}
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-[#1E293B] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm">No documents yet. Upload your first one above.</p>
          </div>
        ) : (
          <div>
            <h2 className="text-white font-medium mb-4">Recent Files</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {docs.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
