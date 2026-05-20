import '@testing-library/jest-dom/vitest'

// jsdom doesn't ship ResizeObserver, but Recharts' ResponsiveContainer
// needs it.  Stub with a noop — Recharts only reads back observed
// sizes, and tests assert structural rendering rather than pixel
// dimensions, so the noop is sufficient.
class NoopResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
;(globalThis as { ResizeObserver?: unknown }).ResizeObserver ??=
  NoopResizeObserver
