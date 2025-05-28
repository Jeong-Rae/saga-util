import { randomUUID } from "node:crypto";
import { toPromise } from "@/utils/promise";
import type { AsyncFn, SyncFn } from "../types";
import { RollbackFailedError } from "./RollbackFailedError";

export type RollbackFn = SyncFn | AsyncFn;

export type RollbackablePromise<T> = Promise<T> & {
	rollback(fn: RollbackFn): RollbackablePromise<T>;
};

export class LocalTransactionContext {
	private readonly contextId: string;
	private rollbackStack: Array<RollbackFn> = [];
	private isRollbackExecuted = false;
	private isRollbackSuccess = false;

	constructor() {
		this.contextId = randomUUID();
	}

	addRollback(fn: RollbackFn): void {
		if (this.isRollbackExecuted) {
			throw new RollbackFailedError("rollback already executed");
		}
		this.rollbackStack.push(toPromise(fn));
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
