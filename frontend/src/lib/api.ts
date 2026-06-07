const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function apiGet(path: string) {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function apiPost(path: string, body: object) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function apiPostAudio(path: string, audioBlob: Blob, filename: string) {
  const form = new FormData()
  form.append('file', audioBlob, filename)
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
