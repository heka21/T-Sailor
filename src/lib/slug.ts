import { isValidElement, type ReactNode } from 'react'

/** "Wind is named for where it comes FROM" → "wind-is-named-for-where-it-comes-from" */
export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/** Flattens rendered children (e.g. a heading with **bold** in it) back to plain text. */
export function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children)
  return ''
}
