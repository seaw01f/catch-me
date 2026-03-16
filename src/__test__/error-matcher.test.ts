import { describe, expect, it } from 'vitest'
import { anyError } from '../error-matcher.js'

describe('anyError', () => {
  it('should match a plain Error', () => {
    expect(anyError(new Error('plain'))).toBe(true)
  })

  it('should match built-in Error subclasses', () => {
    expect(anyError(new TypeError('type'))).toBe(true)
    expect(anyError(new RangeError('range'))).toBe(true)
    expect(anyError(new SyntaxError('syntax'))).toBe(true)
  })

  it('should match custom Error subclasses', () => {
    class AppError extends Error {}
    expect(anyError(new AppError('custom'))).toBe(true)
  })

  it('should not match non-Error values', () => {
    expect(anyError('string')).toBe(false)
    expect(anyError(42)).toBe(false)
    expect(anyError(null)).toBe(false)
    expect(anyError(undefined)).toBe(false)
    expect(anyError({ message: 'not an error' })).toBe(false)
  })
})
