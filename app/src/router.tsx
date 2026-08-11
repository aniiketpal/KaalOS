import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './shared/ui/AppShell'
import { DashboardPage } from './modules/dashboard/DashboardPage'
import { TasksPage } from './modules/tasks/TasksPage'
import { FocusPage } from './modules/focus/FocusPage'
import { ProgressPage } from './modules/progress/ProgressPage'
import { NotesPage } from './modules/notes/NotesPage'
import { NoteEditorPage } from './modules/notes/NoteEditorPage'
import { JournalPage } from './modules/journal/JournalPage'
import { HabitsPage } from './modules/habits/HabitsPage'
import { ActivitiesSettingsPage } from './modules/settings/ActivitiesSettingsPage'
import { ProfilePage } from './modules/settings/ProfilePage'
import { SettingsPage } from './modules/settings/SettingsPage'
import { ExportPage } from './modules/settings/ExportPage'
import { BackupPage } from './modules/settings/BackupPage'
import { LLMSettingsPage } from './modules/settings/LLMSettingsPage'
import { PrivacyPage } from './modules/settings/PrivacyPage'
import { WorkoutsPage } from './modules/workouts/WorkoutsPage'
import { FeedPage } from './modules/feed/FeedPage'
import { GraphPage } from './modules/graph/GraphPage'

/** BrowserRouter in dev/Tauri is fine; switch to HashRouter for PWA static
 *  hosting in M5 (see PLAN-00 conventions). */
export function AppRouter() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/focus" element={<FocusPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/notes/:id" element={<NoteEditorPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/workouts" element={<WorkoutsPage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/graph" element={<GraphPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/export" element={<ExportPage />} />
          <Route path="/settings/backup" element={<BackupPage />} />
          <Route path="/settings/llm" element={<LLMSettingsPage />} />
          <Route path="/settings/privacy" element={<PrivacyPage />} />
          <Route path="/settings/activities" element={<ActivitiesSettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
