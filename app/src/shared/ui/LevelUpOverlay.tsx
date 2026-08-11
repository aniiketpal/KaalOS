import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { totalXp, currentLevel } from '../../core/db/xp'
import { subscribeVersion } from '../hooks/versionBus'

/** Detects level transitions and shows a celebration overlay.
 *  Polls XP total on every version bump; when level increases, show overlay. */
export function LevelUpOverlay() {
  const [show, setShow] = useState(false)
  const [newLevel, setNewLevel] = useState(0)
  const prevLevelRef = useRef(0)

  useEffect(() => {
    let mounted = true

    const check = async () => {
      const xp = await totalXp()
      if (!mounted) return
      const { level } = currentLevel(xp)
      if (prevLevelRef.current === 0) {
        prevLevelRef.current = level
        return
      }
      if (level > prevLevelRef.current) {
        prevLevelRef.current = level
        setNewLevel(level)
        setShow(true)
      }
    }

    check()
    const unsub = subscribeVersion(() => { void check() })
    return () => { mounted = false; unsub() }
  }, [])

  useEffect(() => {
    if (!show) return
    const t = setTimeout(() => setShow(false), 2500)
    return () => clearTimeout(t)
  }, [show])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70"
          onClick={() => setShow(false)}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex flex-col items-center gap-3 text-center"
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: 3, duration: 0.4 }}
              className="text-6xl"
            >
              &#11088;
            </motion.div>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-xs font-medium uppercase tracking-[0.2em] text-xp-gold"
            >
              Level Up
            </motion.p>
            <motion.p
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.25, type: 'spring', stiffness: 400, damping: 15 }}
              className="text-5xl font-bold text-xp-gold"
            >
              {newLevel}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-text-muted"
            >
              Keep going — you're on fire.
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
