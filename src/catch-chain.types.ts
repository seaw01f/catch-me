type ValueOrPromise<V> = V | PromiseLike<V>

export type ErrorEffect<R> = (value: R) => ValueOrPromise<unknown>
export type ReasonMapper<R, V> = (reason: R) => ValueOrPromise<V>

export type TestPredicate<V> = (value: V) => PromiseLike<boolean>
export type SinkValueProducer<R, V> = (reason: R) => Promise<V>
