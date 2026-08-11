import { useEffect, useRef } from 'react'
import { useCarryOverStore } from '../hooks/carryOverStore'

export function Toaster() {
  const movedToday = useCarryOverStore((s) => s.movedToday)
  const shownRef = useRef(false)

  useEffect(() => {
    if (movedToday > 0 && !shownRef.current) {
      shownRef.current = true
      // Simple native toast — real toast system lands with shadcn in M5.
      // For now: transient top-right notification.
      const el = document.createElement('div')
      el.textContent = `${movedToday} ${movedToday === 1 ? 'task' : 'tasks'} moved from yesterday`
      el.style.cssText = [
        'position:fixed',
        'top:48px',
        'right:16px',
        'z-index:9999',
        'background:var(--bg-tertiary)',
        'border:1px solid var(--border-subtle)',
        'color:var(--text-primary)',
        'padding:10px 14px',
        'border-radius:var(--radius-lg)',
        'font-size:13px',
        'box-shadow:var(--shadow-lg)',
        'opacity:0',
        'transform:translateY(-6px)',
        'transition:opacity var(--duration-normal) var(--ease-out-expo), transform var(--duration-normal) var(--ease-out-expo)',
      ].join(';')
      document.body.appendChild(el)
      requestAnimationFrame(() => {
        el.style.opacity = '1'
        el.style.transform = 'translateY(0)'
      })
      setTimeout(() => {
        el.style.opacity = '0'
        el.style.transform = 'translateY(-6px)'
        setTimeout(() => el.remove(), 250)
      }, 4000)
    }
  }, [movedToday])

  return null
}
