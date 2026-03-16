import type { ErrorEffect, ReasonMapper } from '../catch-chain.types.js'
import { describe, expect, it, vi } from 'vitest'
import { onAnyErr, onErr } from '../catch-chain.js'
import type { ErrorMatcher } from '../error-matcher.types.js'
import { faker } from '@faker-js/faker'

describe('onErr', () => {
  const asyncFn = async (reason: 'matchError' | 'ignoreError') => {
    throw new Error(reason)
  }
  const matcher: ErrorMatcher<Error> = (reason: unknown): reason is Error => reason instanceof Error && reason.message === 'matchError'

  describe('return sink', () => {
    const randomReturnValue = faker.helpers.arrayElement([
      () => undefined,
      () => null,
      faker.datatype.boolean,
      faker.number.int,
      faker.number.bigInt,
      faker.number.float,
      faker.lorem.text,
      () => Symbol('unique'),
      () => ['foo', 'bar', 'baz'],
      () => ({ foo: 'bar' }),
      // () => (x: number) => x + 1, // function is considered to be a return value producer
    ])

    it('should return a constant value given error match', async () => {
      const returnValue = randomReturnValue()

      await expect(asyncFn('matchError').catch(onErr(matcher).return(returnValue))).resolves.toBe(returnValue)
    })

    it('should return a value from a mapper given error match', async () => {
      const returnValue = randomReturnValue()
      const returnValueMapper: ReasonMapper<Error, typeof returnValue> = async () => returnValue

      await expect(asyncFn('matchError').catch(onErr(matcher).return(returnValueMapper))).resolves.toBe(returnValue)
    })

    it('should throw original error given error miss', async () => {
      const returnValue = randomReturnValue()
      const returnValueMapper: ReasonMapper<Error, typeof returnValue> = async () => returnValue
      const returnValueOrMapper = faker.helpers.arrayElement([returnValue, returnValueMapper])

      await expect(asyncFn('ignoreError').catch(onErr(matcher).return(returnValueOrMapper))).rejects.toThrow('ignoreError')
    })
  })

  describe('throw sink', () => {
    it('should throw a constant error given error match', async () => {
      const error = new Error('Ooops')

      await expect(asyncFn('matchError').catch(onErr(matcher).throw(error))).rejects.toThrow(error)
    })

    it('should throw a mapped error given error match', async () => {
      const errorMapper: ReasonMapper<Error, Error> = async (reason: unknown) => new Error(`Ooops: ${reason}`)

      await expect(asyncFn('matchError').catch(onErr(matcher).throw(errorMapper))).rejects.toThrow('Ooops: Error: matchError')
    })

    it('should throw original error given error miss', async () => {
      const error = new Error('Ooops')
      const errorMapper: ReasonMapper<Error, Error> = async (reason: unknown) => new Error(`Ooops: ${reason}`)
      const errorOrErrorMapper = faker.helpers.arrayElement([error, errorMapper])

      await expect(asyncFn('ignoreError').catch(onErr(matcher).throw(errorOrErrorMapper))).rejects.toThrow('ignoreError')
    })

    it('should re-throw original error when called with no arguments', async () => {
      const effect = vi.fn()

      await expect(asyncFn('matchError').catch(onErr(matcher).do(effect).throw())).rejects.toThrow('matchError')

      expect(effect).toHaveBeenCalledOnce()
    })
  })

  describe('do effect', () => {
    it('should execute the effect given error match', async () => {
      const effect = vi.fn()

      await asyncFn('matchError').catch(onErr(matcher).do(effect).return(undefined))

      expect(effect).toHaveBeenCalledOnce()
      expect(effect).toHaveBeenCalledWith(expect.objectContaining({ message: 'matchError' }))
    })

    it('should not execute the effect given error miss', async () => {
      const effect = vi.fn()

      await expect(asyncFn('ignoreError').catch(onErr(matcher).do(effect).return(undefined))).rejects.toThrow('ignoreError')

      expect(effect).not.toHaveBeenCalled()
    })

    it('should execute an async effect given error match', async () => {
      const effect: ErrorEffect<Error> = vi.fn(async () => {})

      await asyncFn('matchError').catch(onErr(matcher).do(effect).return(undefined))

      expect(effect).toHaveBeenCalledOnce()
    })

    it('should propagate error when the effect throws', async () => {
      const effect: ErrorEffect<Error> = () => {
        throw new Error('effect failed')
      }

      await expect(asyncFn('matchError').catch(onErr(matcher).do(effect).return(undefined))).rejects.toThrow('effect failed')
    })

    it('should execute multiple chained effects in order given error match', async () => {
      const callOrder: number[] = []
      const effect1: ErrorEffect<Error> = () => {
        callOrder.push(1)
      }
      const effect2: ErrorEffect<Error> = () => {
        callOrder.push(2)
      }

      await asyncFn('matchError').catch(onErr(matcher).do(effect1).do(effect2).return(undefined))

      expect(callOrder).toEqual([1, 2])
    })

    it('should not execute any chained effects given error miss', async () => {
      const effect1 = vi.fn()
      const effect2 = vi.fn()

      await expect(
        asyncFn('ignoreError').catch(onErr(matcher).do(effect1).do(effect2).return(undefined)),
      ).rejects.toThrow('ignoreError')

      expect(effect1).not.toHaveBeenCalled()
      expect(effect2).not.toHaveBeenCalled()
    })

    it('should execute the effect and then throw given error match with .throw()', async () => {
      const effect = vi.fn()
      const error = new Error('mapped')

      await expect(asyncFn('matchError').catch(onErr(matcher).do(effect).throw(error))).rejects.toThrow(error)

      expect(effect).toHaveBeenCalledOnce()
    })
  })
})

describe('onAnyErr', () => {
  it('should match any Error', async () => {
    const asyncFn = async () => {
      throw new Error('any error')
    }

    await expect(asyncFn().catch(onAnyErr.return('recovered'))).resolves.toBe('recovered')
  })

  it('should match Error subclasses', async () => {
    const asyncFn = async () => {
      throw new TypeError('type error')
    }

    await expect(asyncFn().catch(onAnyErr.return('recovered'))).resolves.toBe('recovered')
  })

  it('should re-throw non-Error rejections', async () => {
    const asyncFn = async () => {
      throw 'string rejection'
    }

    await expect(asyncFn().catch(onAnyErr.return('recovered'))).rejects.toBe('string rejection')
  })
})
