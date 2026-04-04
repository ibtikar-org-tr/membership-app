import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

const messageItems = [
  {
    title: 'عبد الكريم لحموني',
    timestamp: '2026-02-01',
    text: 'مرحباً بكم جميعاً في تجمّع إبتكار',
  },
  {
    title: 'عبد الله دعمش',
    timestamp: '2026-03-03',
    text: 'إبتكاااااااااااااااااااااااااااااار',
  },
  {
    title: 'سعد الرفاعي',
    timestamp: '2026-01-30',
    text: 'الحياة عبارة عن علاقات. إبتكار هي فرصة كبيرة.',
  },
  {
    title: 'أحمد شمس الدين',
    timestamp: '2025-10-07',
    text: 'انضمّو إلينا في نادي الأمن السيبراني، حيث نعمل على مشاريع رائعة',
  },
  {
    title: 'عدنان فهد',
    timestamp: '2025-08-15',
    text: 'تجمّع إبتكار هو المكان الذي يجمع بين الشغف والابتكار والتعاون',
  },
] as const

const loginPromptMessage = 'لترك رسالتك قم بتسجيل الدخول وانتقل إلى قسم المجتمع ثمّ رسائلكم'

export function YourMessagesFloating() {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const cardRefs = useRef<Array<HTMLElement | null>>([])
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  useEffect(() => {
    const root = rootRef.current
    if (!root) {
      return
    }

    const ctx = gsap.context(() => {
      const cards = cardRefs.current.filter((card): card is HTMLElement => card !== null)
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
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-teal-700">{item.title}</p>
            <p className="text-[10px] font-medium text-slate-400">{item.timestamp}</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-700">{item.text}</p>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setShowLoginPrompt((current) => !current)}
        ref={(element) => {
          cardRefs.current[messageItems.length] = element
        }}
        className="pointer-events-auto rounded-2xl border border-dashed border-teal-300 bg-teal-50/95 p-4 text-right shadow-xl backdrop-blur transition hover:border-teal-400 hover:bg-teal-100"
        aria-label="إضافة رسالتك"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-teal-700">قم بإضافة رسالتك</p>
          <p className="text-[10px] font-medium text-slate-400">اليوم</p>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-700"> أنت أيضاً يمكنك ترك رسالة</p>
        <div
          className={`overflow-hidden transition-all duration-500 ease-out ${showLoginPrompt ? 'mt-3 max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <p className="rounded-xl bg-white/80 px-3 py-2 text-sm leading-6 text-slate-700 shadow-sm">
            {loginPromptMessage}
          </p>
        </div>
      </button>
    </div>
  )
}