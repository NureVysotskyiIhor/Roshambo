import type { AxiosError } from 'axios'

export function parseError(err: unknown): string {
  const axiosError = err as AxiosError<{ message: string | string[] }>
  const msg = axiosError.response?.data?.message
  if (Array.isArray(msg)) return msg[0]
  if (typeof msg === 'string') return msg
  return 'Something went wrong'
}
