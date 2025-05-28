/* 동기 함수 */
export type SyncFn<
	// biome-ignore lint/suspicious/noExplicitAny: function argument
	Args extends readonly any[] = readonly any[],
	R = unknown,
> = (...args: Args) => R extends Promise<unknown> ? never : R;

/* 반환값이 Promise 인 비동기 함수 */
export type AsyncFn<
	// biome-ignore lint/suspicious/noExplicitAny: function argument
	Args extends readonly any[] = readonly any[],
	R = unknown,
> = (...args: Args) => Promise<R>;

export type AnyFn = SyncFn | AsyncFn;
