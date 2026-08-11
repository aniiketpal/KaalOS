import { useEffect } from 'react'
import { AppRouter } from './router'
import { useCarryOverStore } from './shared/hooks/carryOverStore'
import { Toaster } from './shared/ui/Toaster'
import { LevelUpOverlay } from './shared/ui/LevelUpOverlay'
import { startBackupScheduler } from './core/backup/scheduler'

function App() {
  const runCarryOver = useCarryOverStore((s) => s.run)

  useEffect(() => {
    runCarryOver()
    startBackupScheduler()
  }, [runCarryOver])

  return (
    <>
      <AppRouter />
      <Toaster />
      <LevelUpOverlay />
    </>
  )
}

export default App
