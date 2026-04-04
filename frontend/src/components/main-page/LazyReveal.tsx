import { type ReactNode, useEffect, useState } from 'react'

type LazyRevealProps = {
  children: ReactNode
  delayMs?: number
}

export function LazyReveal({ children, delayMs = 0 }: LazyRevealProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let timeoutId = 0
    let frameId = 0

    timeoutId = window.setTimeout(() => {
      frameId = window.requestAnimationFrame(() => {
        setVisible(true)
      })
    }, delayMs)

    return () => {
      window.clearTimeout(timeoutId)
      window.cancelAnimationFrame(frameId)
    }
  }, [delayMs])

  return (
    <div
      className={`transform-gpu transition-all duration-500 ease-out ${
        visible ? 'translate-y-0 opacity-100 blur-0' : 'translate-y-2 opacity-0 blur-[1px]'
      }`}
    >
      {children}
    </div>
  )
}