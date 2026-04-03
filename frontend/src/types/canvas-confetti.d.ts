declare module 'canvas-confetti' {
  export type Origin = {
    x?: number
    y?: number
  }

  export type Options = {
    particleCount?: number
    spread?: number
    startVelocity?: number
    scalar?: number
    ticks?: number
    origin?: Origin
    zIndex?: number
  }

  type Confetti = (options?: Options) => Promise<null> | null

  const confetti: Confetti
  export default confetti
}
