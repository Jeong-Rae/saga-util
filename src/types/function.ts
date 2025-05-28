/* 동기 함수 */
export type SyncFn<
	Args extends readonly unknown[] = readonly unknown[],
	R = unknown,
> = (...args: Args) => R extends Promise<unknown> ? never : R;

/* 반환값이 Promise 인 비동기 함수 */
export type AsyncFn<
	Args extends readonly unknown[] = readonly unknown[],
	R = unknown,
> = (...args: Args) => Promise<R>;

export type AnyFn = SyncFn | AsyncFn;
