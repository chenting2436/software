// Shared by nested workspaces: restore the page only after the last dialog closes.
const locks = new WeakMap<HTMLElement, { count: number; previousOverflow: string }>()

export function lockBodyScroll(body: HTMLElement = document.body): () => void {
  let state = locks.get(body)
  if (!state) {
    state = { count: 0, previousOverflow: body.style.overflow }
    locks.set(body, state)
  }
  state.count++
  body.style.overflow = 'hidden'
  let released = false
  return () => {
    if (released) return
    released = true
    if (--state.count === 0) {
      body.style.overflow = state.previousOverflow
      locks.delete(body)
    }
  }
}
