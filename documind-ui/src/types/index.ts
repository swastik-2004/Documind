export type DocumentStatus = 'pending' | 'ready' | 'failed'

export interface Document {
  id: string
  filename: string
  file_type: string
  status: DocumentStatus
  chunk_count: number
  uploaded_at: string
  processed_at: string | null
}

export interface UploadResponse {
  doc_id: string
  status: DocumentStatus
  message: string
}

export interface QueryResponse {
  answer: string
  source_doc_ids: string[]
  latency_ms: number
}

export interface QueryHistoryItem {
  id: string
  question: string
  answer: string
  latency_ms: number | null
  created_at: string
}
