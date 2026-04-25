import type { AbstractConstructor, ErrorMatcher } from './error-matcher.types.js'

class ErrorMatcherBuilder<E extends Error> {
  public readonly matcher: ErrorMatcher<E>

  private constructor(matcher: ErrorMatcher<E>) {
    this.matcher = matcher
  }

  public static ofInstance<E extends Error>(ErrorClass: AbstractConstructor<E>): ErrorMatcherBuilder<E> {
    return new ErrorMatcherBuilder((reason: unknown): reason is E => reason instanceof ErrorClass)
  }
}

export const anyError = ErrorMatcherBuilder.ofInstance(Error).matcher
