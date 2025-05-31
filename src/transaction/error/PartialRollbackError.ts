export class PartialRollbackError extends Error {
	constructor(public readonly causes: unknown[]) {
		super("some compensation functions failed");
		this.name = "PartialRollbackError";
	}
}
