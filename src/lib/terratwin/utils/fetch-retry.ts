/**
 * Bounded timeout + retry wrapper for external scientific data APIs.
 * Limits retries to transient HTTP status codes (429, 502, 503, 504) and network/timeout errors.
 */

export interface FetchRetryOptions {
  maxRetries?: number
  timeoutMs?: number
  retryDelayMs?: number
  fetchFn?: typeof fetch
}

const RETRYABLE_HTTP_STATUSES = new Set([429, 502, 503, 504])

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  options: FetchRetryOptions = {}
): Promise<Response> {
  const maxRetries = Math.max(0, Math.min(2, options.maxRetries ?? 1))
  const timeoutMs = Math.max(200, options.timeoutMs ?? 12000)
  const retryDelayMs = Math.max(10, options.retryDelayMs ?? 250)
  const fetchImpl = options.fetchFn ?? fetch

  let lastError: unknown = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    const onCallerAbort = () => controller.abort()
    if (init.signal) {
      if (init.signal.aborted) {
        clearTimeout(timeoutId)
        throw new Error("Request aborted by caller signal")
      }
      init.signal.addEventListener("abort", onCallerAbort, { once: true })
    }

    try {
      const response = await fetchImpl(url, {
        ...init,
        signal: controller.signal,
      })

      if (RETRYABLE_HTTP_STATUSES.has(response.status) && attempt < maxRetries) {
        await sleep(retryDelayMs * (attempt + 1))
        continue
      }

      return response
    } catch (error) {
      lastError = error
      if (init.signal?.aborted || attempt >= maxRetries) {
        throw error
      }
      await sleep(retryDelayMs * (attempt + 1))
    } finally {
      clearTimeout(timeoutId)
      init.signal?.removeEventListener("abort", onCallerAbort)
    }
  }

  throw lastError instanceof Error ? lastError : new Error("External API fetch failed")
}
