import client from './client'
import type { Document, UploadResponse } from '../types'

export async function listDocuments(): Promise<Document[]> {
  const res = await client.get('/documents/')
  return res.data
}

export async function getDocument(id: string): Promise<Document> {
  const res = await client.get(`/documents/${id}`)
  return res.data
}

export async function uploadDocument(file: File): Promise<UploadResponse> {
  const form = new FormData()
  form.append('file', file)
  const res = await client.post('/documents/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function deleteDocument(id: string): Promise<void> {
  await client.delete(`/documents/${id}`)
}
