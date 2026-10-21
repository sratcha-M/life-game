import { Fragment, jsxDEV as _jsxDEV } from 'react/jsx-dev-runtime'
import { fix } from './jsx-runtime'
export { Fragment }
export type { JSX } from 'react/jsx-dev-runtime'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const jsxDEV = (type: any, props: any, key: any, isStatic: boolean, source?: any, self?: any) => _jsxDEV(type, fix(type, props), key, isStatic, source, self)
