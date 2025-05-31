import type { ResolvedTransactionOptions } from "../../options";
import type { TransactionContext } from "../context/TransactionContext";
import type { AnyFn } from "../types";

export async function executeWithContext<T extends AnyFn>(
	context: TransactionContext,
	func: T,
	thisArg: ThisParameterType<T>,
	parameters: Parameters<T>,
	options: ResolvedTransactionOptions,
): Promise<ReturnType<T>> {
	try {
		return (await func.apply(thisArg, parameters)) as ReturnType<T>;
	} catch (error) {
		if (options.catchUnhandledError) {
			options.verbose && console.error("[transaction] unhandled error", error);
			try {
				await context.rollbackAll();
			} catch (rollbackError) {
				// 롤백 실패 시에도 원본 에러를 던짐
				// 롤백 에러는 무시하고 원본 에러를 우선시
			}
		}
		throw error;
	}
}
