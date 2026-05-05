import axios from 'axios'

export async function login(email: string, password: string) {
  const res = await axios.post('/auth/login', { email, password })
  return res.data as { access_token: string; refresh_token: string; token_type: string }
}

export async function register(email: string, password: string) {
  const res = await axios.post('/auth/register', { email, password })
  return res.data
}
