import { randomUUID } from "node:crypto";
import type { AnyFn } from "../types";
import { RollbackFailedError } from "./RollbackFailedError";

export type RollbackablePromise<T> = Promise<T> & {
	rollback(rollbackFn: AnyFn): RollbackablePromise<T>;
};

export class LocalTransactionContext {
	private readonly contextId: string;
	private rollbackStack: Array<AnyFn> = [];
	private isRollbackExecuted = false;
	private isRollbackSuccess = false;

	constructor() {
		this.contextId = randomUUID();
	}

	addRollback(fn: AnyFn): void {
		if (this.isRollbackExecuted) {
			throw new RollbackFailedError("rollback already executed");
		}

		const wrappedFn = async () => {
			await Promise.resolve().then(fn);
		};
		this.rollbackStack.push(wrappedFn);
	}

	async rollbackAll(): Promise<void> {
		if (this.isRollbackExecuted) {
			return;
		}

		try {
			await this.rollbackStack.reverse().reduce(async (prev, rollbackFn) => {
				await prev;
				await rollbackFn();
			}, Promise.resolve());
			this.isRollbackSuccess = true;
		} catch (error) {
			this.isRollbackSuccess = false;
			throw new RollbackFailedError("rollback failed");
		} finally {
			this.isRollbackExecuted = true;
		}
	}

	getContextId(): string {
		return this.contextId;
	}

	isExecuted(): boolean {
		return this.isRollbackExecuted;
	}

	isSuccess(): boolean {
		return this.isRollbackSuccess;
	}

	hasRollbacks(): boolean {
		return this.rollbackStack.length > 0;
	}
}
