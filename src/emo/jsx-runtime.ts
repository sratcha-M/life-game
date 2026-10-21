import { Fragment, jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime'
import { emojify } from '../lib/emoji'
export { Fragment }
export type { JSX } from 'react/jsx-runtime'
const SKIP = new Set(['text', 'tspan', 'textarea', 'option', 'title', 'style', 'script'])
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fix(type: unknown, props: any) {
  if (typeof type !== 'string' || SKIP.has(type) || !props || props.children == null) return props
  const c = emojify(props.children)
  return c === props.children ? props : { ...props, children: c }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const jsx = (type: any, props: any, key?: any) => _jsx(type, fix(type, props), key)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const jsxs = (type: any, props: any, key?: any) => _jsxs(type, fix(type, props), key)
