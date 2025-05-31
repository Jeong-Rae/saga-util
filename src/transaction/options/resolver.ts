import { globalOptions } from "./defaults";
import type {
	ResolvedTransactionOptions,
	RollbackFailureStrategy,
	TransactionOptions,
} from "./types";
import { Propagation } from "./types";

export function resolveOptions(
	userOptions: TransactionOptions = {},
): ResolvedTransactionOptions {
	const merged: ResolvedTransactionOptions = {
		...globalOptions,
		...userOptions,
	};
	validateOptions(merged);
	return merged;
}

function validateOptions(options: ResolvedTransactionOptions): void {
	if (!Object.values(Propagation).includes(options.propagation)) {
		throw new TypeError(
			`invalid propagation: ${options.propagation as string}`,
		);
	}
	const failStrat: RollbackFailureStrategy[] = ["stop", "continue"];
	if (!failStrat.includes(options.rollbackFailureStrategy)) {
		throw new TypeError(
			`invalid rollbackFailureStrategy: ${options.rollbackFailureStrategy}`,
		);
	}
}
