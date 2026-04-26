import type {
  AsyncReasonMapper,
  ErrorEffect,
  ReasonMapper,
  SinkValueProducer,
  TestPredicate,
} from './catch-chain.types.js'
import type { ErrorMatcher } from './error-matcher.types.js'
import { anyError } from './error-matcher.js'

class CatchChain<R> {
  private readonly test: TestPredicate<R>

  private constructor(test: TestPredicate<R>) {
    this.test = test
  }

  public static onError<E extends Error>(matcher: ErrorMatcher<E>): CatchChain<E> {
    return new CatchChain(async (value: E): Promise<boolean> => matcher(value))
  }

  public do(effect: ErrorEffect<R>): CatchChain<R> {
    return new CatchChain(async (value): Promise<boolean> => {
      const testResult = await this.test(value)
      if (testResult) {
        await effect(value)
      }
      return testResult
    })
  }

  private sink<V>(valueProducer: SinkValueProducer<R, V>): AsyncReasonMapper<R, V> {
    return async (reason: R): Promise<V> => {
      if (await this.test(reason)) {
        return valueProducer(reason)
      }
      throw reason
    }
  }

  public return<V>(value: V | ReasonMapper<R, V> | AsyncReasonMapper<R, V>): AsyncReasonMapper<R, V> {
    const valueProducer: SinkValueProducer<R, V> = async (reason: R): Promise<V> => {
      return value instanceof Function ? await value(reason) : value
    }
    return this.sink(valueProducer)
  }

  public throw<E>(error?: E | ReasonMapper<R, E> | AsyncReasonMapper<R, E>): AsyncReasonMapper<R, never> {
    const valueProducer: SinkValueProducer<R, never> = async (reason: R): Promise<never> => {
      if (error === undefined) throw reason
      throw error instanceof Function ? await error(reason) : error
    }
    return this.sink(valueProducer)
  }
}

export const onErr = <E extends Error>(matcher: ErrorMatcher<E>) => CatchChain.onError(matcher)
export const onAnyErr = onErr(anyError)
