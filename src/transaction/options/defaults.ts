import type { ResolvedTransactionOptions } from "./types";
import { Propagation } from "./types";

export const LIB_DEFAULT_OPTIONS: ResolvedTransactionOptions = {
	catchUnhandledError: true,
	propagation: Propagation.Inherit,
	verbose: false,
	rollbackFailureStrategy: "stop",
} as const;

export let globalOptions: ResolvedTransactionOptions = LIB_DEFAULT_OPTIONS;

export function setGlobalTransactionOptions(
	options: Partial<ResolvedTransactionOptions>,
): void {
	globalOptions = { ...globalOptions, ...options };
}
