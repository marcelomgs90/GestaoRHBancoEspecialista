import type { AxiosError } from 'axios'

type AxiosDetailError = AxiosError<{ detail?: unknown }>

/**
 * Normaliza a mensagem de erro vinda do backend (FastAPI) para uma string.
 *
 * O backend pode retornar `detail` em tres formatos:
 *  - string (erros manuais via HTTPException)
 *  - array de objetos no formato do Pydantic (erros de validacao de schema)
 *  - string dentro de array (caso raro)
 *
 * Retorna a `fallback` quando o payload nao tem `detail` parseavel.
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const ax = err as AxiosDetailError
  const detail = ax.response?.data?.detail

  if (typeof detail === 'string') return detail

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object' && 'msg' in item) {
          return String((item as { msg: unknown }).msg)
        }
        return null
      })
      .filter(Boolean)
      .join(' ')
  }

  return fallback
}