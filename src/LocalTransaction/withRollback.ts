import {localTransactionContextStorage} from "./LocalTransactionContextStorage";
import {RollbackablePromise, RollbackFn} from "./LocalTransactionContext";
import {NoActiveTransactionContextError} from "./NoActiveTransactionContextError";

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
                throw new NoActiveTransactionContextError('No active transaction context');
            }
            context.addRollback(rollbackFn as RollbackFn);
            return wrapper;
        }
    });

    return wrapper;
}

