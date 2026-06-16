import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Limpa o DOM renderizado após cada teste
afterEach(() => {
  cleanup()
})
