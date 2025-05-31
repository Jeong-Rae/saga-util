export const Propagation = {
	Inherit: "inherit",
	New: "new",
} as const;
export type Propagation = (typeof Propagation)[keyof typeof Propagation];

export type RollbackFailureStrategy = "stop" | "continue";

export type TransactionOptions = {
	catchUnhandledError?: boolean;
	propagation?: Propagation;
	verbose?: boolean;
	rollbackFailureStrategy?: RollbackFailureStrategy;
};

export type ResolvedTransactionOptions = Readonly<Required<TransactionOptions>>;
