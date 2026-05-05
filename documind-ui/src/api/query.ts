import client from './client'
import type { QueryResponse, QueryHistoryItem } from '../types'

export async function queryDocuments(question: string, k = 5): Promise<QueryResponse> {
  const res = await client.post('/query/', { question, k })
  return res.data
}

export async function getHistory(): Promise<QueryHistoryItem[]> {
  const res = await client.get('/query/history')
  return res.data
}
