import { getPlatform } from '../platform/platform'

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const p = await Notification.requestPermission()
  return p === 'granted'
}

export async function notifyDone(activityName: string, minutes: number): Promise<void> {
  const title = 'Focus complete'
  const body = `${minutes} min logged to ${activityName}`
  await getPlatform().notify(title, body)
}
