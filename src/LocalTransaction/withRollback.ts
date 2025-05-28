import type { AnyFn } from "../types";
import type { RollbackablePromise } from "./LocalTransactionContext";
import { localTransactionContextStorage } from "./LocalTransactionContextStorage";
import { NoActiveTransactionContextError } from "./NoActiveTransactionContextError";

export function withRollback<T>(
	action: T | Promise<T>,
): RollbackablePromise<T> {
	const promise = Promise.resolve(action);
	const wrapper: RollbackablePromise<T> = Object.assign(promise, {
		rollback(rollbackFn: AnyFn): RollbackablePromise<T> {
			const context = localTransactionContextStorage.getStore();
			if (!context) {
				throw new NoActiveTransactionContextError(
					"no active transaction context",
				);
			}

			const wrappedRollback = async () => {
				await Promise.resolve().then(rollbackFn);
			};
			context.addRollback(wrappedRollback);

			return wrapper;
		},
	});
	return wrapper;
}
