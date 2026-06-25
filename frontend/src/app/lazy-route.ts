import type { ComponentType } from 'react'
import { importWithChunkRetry } from '../utils/chunk-load-recovery'

export function lazyRoute<T extends Record<string, ComponentType>>(
  importFn: () => Promise<T>,
  componentName: keyof T & string,
) {
  return async () => {
    const module = await importWithChunkRetry(importFn)
    return { Component: module[componentName] }
  }
}
