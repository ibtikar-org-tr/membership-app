const CHUNK_RELOAD_KEY = 'membership-app:chunk-reload-attempted'

function isChunkLoadMessage(message: string): boolean {
  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('error loading dynamically imported module') ||
    message.includes('Failed to load module script') ||
    message.includes('MIME type') ||
    message.includes('dynamically imported module')
  )
}

export function isChunkLoadError(error: unknown): boolean {
  if (error instanceof Error) {
    return isChunkLoadMessage(error.message)
  }

  if (typeof error === 'string') {
    return isChunkLoadMessage(error)
  }

  return false
}

export function clearChunkReloadFlag(): void {
  sessionStorage.removeItem(CHUNK_RELOAD_KEY)
}

export function tryReloadForStaleChunk(): boolean {
  if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
    return false
  }

  sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
  window.location.reload()
  return true
}

export async function importWithChunkRetry<T>(importFn: () => Promise<T>): Promise<T> {
  try {
    const result = await importFn()
    clearChunkReloadFlag()
    return result
  } catch (error) {
    if (isChunkLoadError(error) && tryReloadForStaleChunk()) {
      return new Promise(() => {})
    }

    throw error
  }
}

export function setupChunkLoadRecovery(): void {
  clearChunkReloadFlag()

  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault()
    tryReloadForStaleChunk()
  })

  window.addEventListener('unhandledrejection', (event) => {
    if (!isChunkLoadError(event.reason)) {
      return
    }

    if (tryReloadForStaleChunk()) {
      event.preventDefault()
    }
  })
}
