import { executeWithContext } from "../core/executor/executeWithContext";
import { runInContext } from "../core/executor/runInContext";
import type { AnyFn } from "../core/types";
import { type TransactionOptions, resolveOptions } from "../options";

export function Transaction<T extends AnyFn>(
	userOptions: TransactionOptions = {},
) {
	const options = resolveOptions(userOptions);

	return (
		_target: unknown,
		_key: string | symbol,
		descriptor: TypedPropertyDescriptor<T>,
	): void => {
		const original = descriptor.value as T;

		descriptor.value = async function (
			this: ThisParameterType<T>,
			...parameters: Parameters<T>
		): Promise<ReturnType<T>> {
			return runInContext({ propagation: options.propagation }, (context) =>
				executeWithContext(context, original, this, parameters, options),
			);
		} as unknown as T;
	};
}
