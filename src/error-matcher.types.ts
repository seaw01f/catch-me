export type ErrorMatcher<E extends Error> = (reason: unknown) => reason is E
