import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { RightRail } from './RightRail'

/** Three-zone desktop layout per UI-UX-SPEC §2.1:
 *  Sidebar (240px) | Main (flex-1) | RightRail (320px, collapsible) */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg-primary text-text-primary">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
      <RightRail />
    </div>
  )
}
