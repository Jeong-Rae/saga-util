import type { AsyncFn, SyncFn } from "@/types";

export const toPromise =
	<F extends SyncFn | AsyncFn>(fn: F) =>
	async (...args: Parameters<F>): Promise<Awaited<ReturnType<F>>> =>
		(await Promise.resolve().then(() => fn(...args))) as Awaited<ReturnType<F>>;
