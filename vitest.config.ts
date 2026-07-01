import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // Date logic must be correct in the user's real timezone, not CI's UTC.
    // Sydney also exercises DST transitions, which UTC never does.
    env: { TZ: 'Australia/Sydney' },
  },
})
