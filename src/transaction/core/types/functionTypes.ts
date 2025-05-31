/* 반환값이 Promise 가 아닌 순수 동기 함수 */
export type SyncFn<
	Parameters extends readonly unknown[] = readonly unknown[],
	R = unknown,
> = (...parameters: Parameters) => R extends Promise<unknown> ? never : R;

/* 반환값이 Promise 인 비동기 함수 */
export type AsyncFn<
	Parameters extends readonly unknown[] = readonly unknown[],
	R = unknown,
> = (...parameters: Parameters) => Promise<R>;

export type AnyFn = SyncFn | AsyncFn;

/* 두 함수 모두 Promise 기반으로 승격 */
export const toPromise =
	<F extends AnyFn>(func: F) =>
	async (...parameters: Parameters<F>): Promise<Awaited<ReturnType<F>>> => {
		const result = await Promise.resolve().then(() => func(...parameters));
		return result as Awaited<ReturnType<F>>;
	};
