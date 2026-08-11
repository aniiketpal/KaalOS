import { getShell } from './shell'

export function isTauri(): boolean {
  return getShell() === 'tauri'
}

export function isBrowser(): boolean {
  return getShell() === 'browser'
}

export async function downloadFile(blob: Blob, filename: string, folder?: string): Promise<void> {
  if (isTauri() && folder) {
    const { writeFile } = await import('@tauri-apps/plugin-fs')
    const arrayBuffer = await blob.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    await writeFile(`${folder}/${filename}`, bytes)
  } else {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
}

export async function pickFolder(title?: string): Promise<string | null> {
  if (isTauri()) {
    const { open } = await import('@tauri-apps/plugin-dialog')
    const selected = await open({ directory: true, title })
    return selected || null
  }
  // Browser: use File System Access API if available
  if ('showDirectoryPicker' in window) {
    try {
      const handle = await (window as unknown as { showDirectoryPicker: (options?: { mode?: string }) => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker({ mode: 'readwrite' })
      return handle.name
    } catch {
      return null
    }
  }
  // Fallback: can't pick folder in older browsers
  return null
}

export async function readFile(path: string): Promise<Uint8Array> {
  if (isTauri()) {
    const { readFile } = await import('@tauri-apps/plugin-fs')
    return await readFile(path)
  }
  throw new Error('File reading not available in browser')
}

export async function writeTextFile(path: string, content: string): Promise<void> {
  if (isTauri()) {
    const { writeTextFile } = await import('@tauri-apps/plugin-fs')
    await writeTextFile(path, content)
  } else {
    throw new Error('Text file writing not available in browser')
  }
}