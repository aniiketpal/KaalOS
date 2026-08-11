export const ACCENT_COLORS = [
  { key: 'blue', label: 'Blue', var: 'var(--accent-blue)' },
  { key: 'green', label: 'Green', var: 'var(--accent-green)' },
  { key: 'amber', label: 'Amber', var: 'var(--accent-amber)' },
  { key: 'purple', label: 'Purple', var: 'var(--accent-purple)' },
  { key: 'rose', label: 'Rose', var: 'var(--accent-rose)' },
  { key: 'teal', label: 'Teal', var: 'var(--accent-teal)' },
] as const

export type AccentKey = (typeof ACCENT_COLORS)[number]['key']

export function accentVar(color: string): string {
  return ACCENT_COLORS.find((c) => c.key === color)?.var ?? color
}
