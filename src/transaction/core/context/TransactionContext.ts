import { randomUUID } from "node:crypto";
import { RollbackFailedError } from "../../error/RollbackFailedError";
import { type AnyFn, toPromise } from "../types";

export class TransactionContext {
	private readonly id = randomUUID();
	private rollbackStack: Array<() => Promise<unknown>> = [];
	private executed = false;
	private success = false;

	addRollback(func: AnyFn): void {
		if (this.executed) {
			throw new RollbackFailedError("rollback already executed");
		}
		this.rollbackStack.push(toPromise(func));
	}

	async rollbackAll(): Promise<void> {
		if (this.executed) return;

		try {
			await this.rollbackStack.reverse().reduce(async (prev, func) => {
				await prev;
				await func();
			}, Promise.resolve());
			this.success = true;
		} catch {
			this.success = false;
			throw new RollbackFailedError("rollback failed");
		} finally {
			this.executed = true;
		}
	}

	/* getters */
	getId(): string {
		return this.id;
	}
	isExecuted(): boolean {
		return this.executed;
	}
	isSuccess(): boolean {
		return this.success;
	}
}
