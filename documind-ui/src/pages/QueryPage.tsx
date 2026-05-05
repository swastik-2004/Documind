import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { queryDocuments, getHistory } from '../api/query'
import type { QueryHistoryItem } from '../types'

interface Message {
  question: string
  answer: string
  latency_ms: number
  source_doc_ids: string[]
  isError?: boolean
}

export default function QueryPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { filename } = (location.state as { docId?: string; filename?: string }) || {}
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [history, setHistory] = useState<QueryHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set())
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getHistory().then(setHistory).catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim() || loading) return
    const q = question.trim()
    setQuestion('')
    setLoading(true)
    try {
      const res = await queryDocuments(q)
      setMessages((prev) => [
        ...prev,
        { question: q, answer: res.answer, latency_ms: res.latency_ms, source_doc_ids: res.source_doc_ids },
      ])
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setMessages((prev) => [
        ...prev,
        { question: q, answer: detail || 'Something went wrong.', latency_ms: 0, source_doc_ids: [], isError: true },
      ])
    } finally {
      setLoading(false)
    }
  }

  function toggleSources(index: number) {
    setExpandedSources((prev) => {
      const next = new Set(prev)
      next.has(index) ? next.delete(index) : next.add(index)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden max-w-7xl mx-auto w-full px-4 py-6 gap-6" style={{ height: 'calc(100vh - 65px)' }}>

        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Library
          </button>

          {filename && (
            <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
              <p className="text-slate-400 text-xs mb-1">Querying</p>
              <p className="text-white text-sm font-medium truncate">{filename}</p>
            </div>
          )}

          {history.length > 0 && (
            <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 flex-1 overflow-y-auto">
              <p className="text-slate-400 text-xs mb-3 font-medium">History</p>
              <div className="flex flex-col gap-2">
                {history.slice(0, 20).map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setQuestion(h.question)}
                    className="text-left text-slate-400 text-xs hover:text-white truncate transition-colors py-0.5"
                  >
                    {h.question}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Chat panel */}
        <div className="flex-1 flex flex-col bg-[#1E293B] border border-[#334155] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[#334155] flex-shrink-0">
            <h1 className="text-white font-semibold">{filename || 'Ask your documents'}</h1>
            <p className="text-slate-500 text-xs mt-0.5">Powered by Mistral 7B · Queries across all your ready documents</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
            {messages.length === 0 && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
                <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-slate-400 text-sm font-medium">Ask anything about your documents</p>
                <p className="text-slate-600 text-xs mt-1">Results come from all your Ready documents</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="flex justify-end">
                  <div className="bg-indigo-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-lg">
                    {msg.question}
                  </div>
                </div>
                <div className="flex flex-col gap-2 max-w-2xl">
                  <div className={`text-sm px-4 py-3 rounded-2xl rounded-tl-sm leading-relaxed whitespace-pre-wrap border ${
                    msg.isError
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-[#0F172A] border-[#334155] text-slate-200'
                  }`}>
                    {msg.answer}
                  </div>
                  {!msg.isError && (
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-xs">
                        {(msg.latency_ms / 1000).toFixed(1)}s · {msg.source_doc_ids.length} source{msg.source_doc_ids.length !== 1 ? 's' : ''}
                      </span>
                      {msg.source_doc_ids.length > 0 && (
                        <button
                          onClick={() => toggleSources(i)}
                          className="text-indigo-400 text-xs hover:text-indigo-300 transition-colors"
                        >
                          {expandedSources.has(i) ? 'Hide sources' : 'Show sources'}
                        </button>
                      )}
                    </div>
                  )}
                  {expandedSources.has(i) && (
                    <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-3 text-xs">
                      <p className="font-medium text-slate-300 mb-2">Source document IDs:</p>
                      {msg.source_doc_ids.map((id) => (
                        <p key={id} className="font-mono text-indigo-400 truncate">{id}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex flex-col gap-2 max-w-2xl">
                <div className="bg-[#0F172A] border border-[#334155] px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-3">
                  <div className="flex gap-1">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                  <span className="text-slate-500 text-xs">Generating answer...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t border-[#334155] flex gap-3 flex-shrink-0">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about your documents..."
              disabled={loading}
              className="flex-1 bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
