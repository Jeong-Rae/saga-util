import {localTransactionContextStorage} from "./LocalTransactionContextStorage";

export class LocalTransactionContext {
    private rollbackStack: (() => Promise<void>)[] = [];

    static current: LocalTransactionContext | null = null;

    addRollback(fn: () => Promise<void>): void {
        this.rollbackStack.push(fn);
    }

    async rollbackAll(): Promise<void> {
        for (const fn of this.rollbackStack.reverse()) {
            try {
                await fn();
            } catch (error) {
                console.error('Rollback failed', error);
            }
        }
    }
}

export type RollbackFn<T = void> = () => Promise<T>;

export type RollbackablePromise<T> = Promise<T> & {
    rollback: <U>(rollbackFn: RollbackFn<U>) => RollbackablePromise<T>;
};

/**
 * withRollback
 * @param action (Promise<T>) - 비동기 action
 * @returns RollbackablePromise<T>
 */
export function withRollback<T>(action: Promise<T>): RollbackablePromise<T> {
    const wrapper: RollbackablePromise<T> = Object.assign(action, {
        rollback<U>(rollbackFn: RollbackFn<U>): RollbackablePromise<T> {
            const context = localTransactionContextStorage.getStore();
            if (!context) {
                throw new Error('No active transaction context');
            }
            context.addRollback(rollbackFn as RollbackFn<void>);
            return wrapper;
        }
    });

    return wrapper;
}

