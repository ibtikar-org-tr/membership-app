import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

const messageItems = [
  {
    title: 'رسائلك',
    text: 'مرحبًا! تم تحديث حالة طلبك بنجاح.',
  },
  {
    title: 'إشعار جديد',
    text: 'لديك دعوة للمشاركة في فعالية السبت.',
  },
  {
    title: 'فريق المتابعة',
    text: 'تم قبول ملفك التطوعي للمرحلة القادمة.',
  },
  {
    title: 'تذكير',
    text: 'لا تنسَ مراجعة معلومات حسابك الشخصية.',
  },
]

export function YourMessagesFloating() {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const cardRefs = useRef<Array<HTMLDivElement | null>>([])

  useEffect(() => {
    const root = rootRef.current
    if (!root) {
      return
    }

    const ctx = gsap.context(() => {
      const cards = cardRefs.current.filter((card): card is HTMLDivElement => card !== null)
      if (cards.length === 0) {
        return
      }

      gsap.set(cards, { opacity: 0, y: 14, x: 0 })
      gsap.to(cards, {
        opacity: 1,
        y: 0,
        duration: 0.55,
        ease: 'power2.out',
        stagger: 0.1,
      })

      cards.forEach((card, index) => {
        gsap.to(card, {
          y: index % 2 === 0 ? -12 : 10,
          x: index % 2 === 0 ? -4 : 6,
          rotation: index % 2 === 0 ? -1.2 : 1.2,
          duration: 2.6 + index * 0.35,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: 0.3 + index * 0.08,
        })
      })
    }, root)

    return () => {
      ctx.revert()
    }
  }, [])

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute left-0 top-1/2 z-0 hidden w-64 -translate-x-[120%] -translate-y-1/2 space-y-4 xl:block"
      aria-hidden="true"
    >
      {messageItems.map((item, index) => (
        <div
          key={item.title}
          ref={(element) => {
            cardRefs.current[index] = element
          }}
          className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-xl backdrop-blur"
        >
          <p className="text-xs font-semibold text-teal-700">{item.title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{item.text}</p>
        </div>
      ))}
    </div>
  )
}