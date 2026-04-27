export type TestPredicate<V> = (value: V) => PromiseLike<boolean>

export type SinkValueProducer<R, V> = (reason: R) => Promise<V>

export type ErrorEffect<R> = (value: R) => unknown | PromiseLike<unknown>

export type ReasonMapper<R, V> = (reason: R) => V
export type AsyncReasonMapper<R, V> = (reason: R) => PromiseLike<V>
