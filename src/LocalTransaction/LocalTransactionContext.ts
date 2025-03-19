import {RollbackFailedError} from "./RollbackFailedError";

export type SyncRollbackFn<T = void> = () => T;
export type AsyncRollbackFn<T = void> = () => Promise<T>;
export type RollbackFn<T = void> = () => Promise<T>;

export type RollbackablePromise<T> = Promise<T> & {
    rollback: <U>(rollbackFn: SyncRollbackFn<U> | AsyncRollbackFn<U>) => RollbackablePromise<T>;
};

export class LocalTransactionContext {
    static current: LocalTransactionContext | null = null;
    private rollbackStack: RollbackFn[] = [];

    addRollback<T>(fn: SyncRollbackFn<T>): void;
    addRollback<T>(fn: AsyncRollbackFn<T>): void;
    addRollback<T>(fn: SyncRollbackFn<T> | AsyncRollbackFn<T>): void {
        const wrappedFn = async () => {
            await Promise.resolve().then(fn);
            return;
        };
        this.rollbackStack.push(wrappedFn);
    }

    async rollbackAll(): Promise<void> {
        await this.rollbackStack.reverse().reduce(async (prevPromise, fn) => {
            await prevPromise;
            try {
                await fn();
            } catch (error) {
                throw new RollbackFailedError("rollback failed");
            }
        }, Promise.resolve());
    }
}