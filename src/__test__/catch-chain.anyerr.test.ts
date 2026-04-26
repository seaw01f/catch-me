import { afterEach, describe, expect, it, vi } from 'vitest'
import { onAnyErr } from '../catch-chain.js'

describe('onAnyErr', () => {
  afterEach(() => vi.clearAllMocks())

  it('should match any thrown Error', async () => {
    const asyncFn = async () => {
      throw new Error('any error')
    }

    await expect(asyncFn().catch(onAnyErr.return('recovered'))).resolves.toBe('recovered')
  })

  it('should match any thrown Error subclasses', async () => {
    const asyncFn = async () => {
      throw new TypeError('type error')
    }

    await expect(asyncFn().catch(onAnyErr.return('recovered'))).resolves.toBe('recovered')
  })

  it('should not match any throw non-Error', async () => {
    const asyncFn = async () => {
      throw 'I want to be an error when I grow up'
    }

    await expect(asyncFn().catch(onAnyErr.return('recovered'))).rejects.toBe('I want to be an error when I grow up')
  })
})
