export class NoActiveTransactionContextError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "NoActiveTransactionContextError";
	}
}
