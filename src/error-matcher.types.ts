export type ErrorMatcher<E extends Error> = (reason: unknown) => reason is E

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AbstractConstructor<T> = abstract new (...args: any[]) => T
