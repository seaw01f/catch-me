import type { ErrorMatcher } from './error-matcher.types.js'

export const anyError: ErrorMatcher<Error> = (reason: unknown): reason is Error => reason instanceof Error
