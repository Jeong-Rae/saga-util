import {RollbackFailedError} from './RollbackFailedError';
import {randomUUID} from 'node:crypto';

export type AnyRollbackFn = () => any;

export type RollbackablePromise<T> = Promise<T> & {
    rollback(rollbackFn: AnyRollbackFn): RollbackablePromise<T>;
};

export class LocalTransactionContext {
    private readonly contextId: string;
    private rollbackStack: Array<() => Promise<void>> = [];
    private isRollbackExecuted = false;
    private isRollbackSuccess = false;

    constructor() {
        this.contextId = randomUUID();
    }

    addRollback(fn: AnyRollbackFn): void {
        if (this.isRollbackExecuted) {
            throw new Error('롤백이 이미 실행되었습니다');
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
            throw new RollbackFailedError('rollback failed');
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