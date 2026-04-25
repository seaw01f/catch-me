# catch-chain

[![npm version](https://img.shields.io/npm/v/catch-chain)](https://www.npmjs.com/package/catch-chain)
[![npm downloads](https://img.shields.io/npm/dm/catch-chain)](https://www.npmjs.com/package/catch-chain)
[![bundle size](https://img.shields.io/bundlephobia/minzip/catch-chain)](https://bundlephobia.com/package/catch-chain)
[![license](https://img.shields.io/npm/l/catch-chain)](./LICENSE)
[![CI](https://github.com/seaw01f/catch-chain/actions/workflows/ci.yml/badge.svg)](https://github.com/seaw01f/catch-chain/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)
![zero dependencies](https://img.shields.io/badge/dependencies-0-green)

Fluent error matching and recovery for JavaScript promises.

```ts
await fetchUser(id)
  .catch(onErr(isNotFound).return(null))
  .catch(onErr(isRateLimited).do(logWarning).throw())
  .catch(onAnyErr.throw(err => new AppError(`Unexpected: ${err.message}`)))
```

No more `catch` blocks with nested `if/else` chains. Define what to match, what to do, and how to recover — in a readable, composable chain.

## Install

```bash
npm install catch-chain
```

## Why

A typical promise `.catch()` quickly turns into this:

```ts
await fetchUser(id).catch(err => {
  if (err instanceof NotFoundError) {
    return null
  }
  if (err instanceof RateLimitError) {
    logWarning(err)
    throw new RetryableError()
  }
  reportToSentry(err)
  throw new AppError('Unexpected failure')
})
```

Every handler mixes matching, side effects, and recovery in one block. As cases grow, readability suffers. catch-chain separates these concerns:

```ts
await fetchUser(id)
  .catch(onErr(isNotFound).return(null))
  .catch(onErr(isRateLimited).do(logWarning).throw(new RetryableError()))
  .catch(onAnyErr.do(reportToSentry).throw(err => new AppError(`Unexpected: ${err.message}`)))
```

Each `.catch()` handles one case. Unmatched errors pass through to the next handler — just like multi-catch in Java or pattern matching in Rust.

## API

### `onErr(matcher)`

Creates a chain that only activates when `matcher` returns `true` for the rejected value.

```ts
import { onErr } from 'catch-chain'

const isNotFound: ErrorMatcher<NotFoundError> = 
  (reason): reason is NotFoundError => reason instanceof NotFoundError

await fetchUser(id).catch(onErr(isNotFound).return(null))
```

A matcher is a [type guard](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates) — it receives `unknown` and narrows to a specific error type. This gives you full type safety in `.do()` and `.return()`/`.throw()` callbacks.

### `onAnyErr`

A pre-built chain that matches any `Error` instance. Shorthand for `onErr(reason => reason instanceof Error)`.

```ts
import { onAnyErr } from 'catch-chain'

await riskyOperation().catch(onAnyErr.return('fallback'))
```

Non-`Error` rejections (strings, objects, etc.) pass through unhandled.

### `.do(effect)`

Run a side effect when the error matches. Returns the chain for further chaining. The effect can be sync or async.

```ts
// Log and recover
.catch(onAnyErr.do(err => console.error(err)).return(defaults))

// Multiple effects, executed in order
.catch(onAnyErr
  .do(err => metrics.increment('errors'))
  .do(err => logger.error(err))
  .throw())

// Async effect
.catch(onAnyErr
  .do(async err => await alertOncall(err))
  .throw(new ServiceUnavailableError()))
```

If the effect throws, its error replaces the original.

### `.return(value)`

**Terminal.** Recover from the error by resolving the promise with `value`. If the error doesn't match, it's re-thrown unchanged.

```ts
// Static value
.catch(onErr(isNotFound).return(null))

// Compute from the error
.catch(onErr(isNotFound).return(async err => ({
  error: err.message,
  fallback: true,
})))
```

When `value` is a function, it's called with the matched error and its return value is used.

### `.throw(error?)`

**Terminal.** Re-throw the original error, replace it, or map it. If the error doesn't match, the original is re-thrown unchanged.

```ts
// No args — re-throw original (useful after side effects)
.catch(onErr(isDatabaseError)
  .do(err => logger.error(err))
  .throw())

// Constant — replace with a different error
.catch(onErr(isDatabaseError)
  .throw(new AppError('Something went wrong')))

// Mapper — transform the error
.catch(onErr(isDatabaseError)
  .throw(err => new AppError(`DB failed: ${err.code}`)))
```

## Patterns

### Multi-catch

Chain multiple `.catch()` calls — each handles one error type. Unmatched errors fall through.

```ts
const user = await fetchUser(id)
  .catch(onErr(isNotFound).return(null))
  .catch(onErr(isTimeout).throw(new RetryableError()))
  .catch(onAnyErr.throw(new AppError('Unexpected')))
```

### Log and re-throw

Use `.do()` for side effects, then `.throw()` to re-throw (same or different error).

```ts
await processPayment(order)
  .catch(onAnyErr
    .do(err => logger.error('Payment failed', { orderId: order.id, err }))
    .throw(err => new PaymentError(err.message)))
```

### Graceful degradation

Return a default value when a non-critical operation fails.

```ts
const preferences = await loadPreferences(userId)
  .catch(onAnyErr.return(DEFAULT_PREFERENCES))
```

### Custom matchers

A matcher is any function with the signature `(reason: unknown) => reason is E`. Build matchers that check properties, codes, or any condition.

```ts
const isConflict: ErrorMatcher<HttpError> =
  (reason): reason is HttpError =>
    reason instanceof HttpError && reason.status === 409

await saveDocument(doc)
  .catch(onErr(isConflict).return(await mergeAndRetry(doc)))
```

### Effect-only handling

Use `.do()` with `.return(undefined)` when you want to observe the error without changing the outcome.

```ts
await backgroundSync()
  .catch(onAnyErr
    .do(err => telemetry.record('sync_failed', err))
    .return(undefined))
```

## Types

All types are inferred automatically. You don't need to import anything beyond `onErr` and `onAnyErr`.

A custom matcher is a type guard with this shape:

```ts
type ErrorMatcher<E extends Error> = (reason: unknown) => reason is E
```

The `.do()`, `.return()`, and `.throw()` callbacks receive the narrowed type from your matcher — no manual annotations needed.

## Design

- **Match or pass through** — unmatched errors propagate unchanged, enabling composable multi-catch chains
- **Type-safe** — matchers are type guards, so `.do()`, `.return()`, and `.throw()` callbacks receive the narrowed error type
- **Zero dependencies** — only uses native `Error`, `Promise`, and `instanceof`
- **Tiny** — under 1.5 KB, ships ESM + CJS with full TypeScript declarations

## License

[MIT](./LICENSE)
