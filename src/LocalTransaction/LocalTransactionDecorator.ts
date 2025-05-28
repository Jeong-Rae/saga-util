import { LocalTransactionContext } from "./LocalTransactionContext";
import { localTransactionContextStorage } from "./LocalTransactionContextStorage";

export type AnyFn<Args extends unknown[] = unknown[], Return = unknown> = (
	...args: Args
) => Return;

export type LocalTransactionOptions = {
	catchUnhandledError?: boolean;
	propagation?: "new" | "inherit";
	verbose?: boolean;
};

export function LocalTransaction<T extends AnyFn>(
	options: LocalTransactionOptions = {
		catchUnhandledError: true,
		propagation: "inherit",
		verbose: false,
	},
) {
	return (
		target: unknown,
		propertyKey: string | symbol,
		descriptor: TypedPropertyDescriptor<T>,
	): void => {
		const originalMethod = descriptor.value as T;

		/*
		 *  새로운 구현은
		 *    - this 타입을 보존(ThisParameterType<T>)
		 *    - 파라미터 타입을 보존(Parameters<T>)
		 *    - 반환 타입을 Promise<ReturnType<T>> 로 통일
		 */
		descriptor.value = async function (
			this: ThisParameterType<T>,
			...args: Parameters<T>
		): Promise<ReturnType<T>> {
			const transactionContext = localTransactionContextStorage.getStore();

			if (transactionContext && options.propagation === "inherit") {
				return await executeWithContext(
					transactionContext,
					originalMethod,
					this,
					args,
					options,
				);
			}

			const newContext = new LocalTransactionContext();
			return localTransactionContextStorage.run(newContext, async () =>
				executeWithContext(newContext, originalMethod, this, args, options),
			);
		} as unknown as T; // T를 만족하도록 단언
	};
}

async function executeWithContext<T extends AnyFn>(
	context: LocalTransactionContext,
	method: T,
	thisArg: ThisParameterType<T>,
	args: Parameters<T>,
	options?: LocalTransactionOptions,
): Promise<ReturnType<T>> {
	try {
		return (await method.apply(thisArg, args)) as ReturnType<T>;
	} catch (error) {
		if (options?.catchUnhandledError) {
			options?.verbose && console.error("unhandledCatchError", error);
			await context.rollbackAll();
		}
		throw error;
	}
}
