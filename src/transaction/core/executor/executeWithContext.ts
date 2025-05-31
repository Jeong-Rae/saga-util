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
			await context.rollbackAll();
		}
		throw error;
	}
}
