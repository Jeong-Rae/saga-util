export type RollbackFn<T = void> = () => Promise<T>;

export type RollbackablePromise<T> = Promise<T> & {
    rollback: <U>(rollbackFn: RollbackFn<U>) => RollbackablePromise<T>;
};

export class LocalTransactionContext {
    static current: LocalTransactionContext | null = null;
    private rollbackStack: RollbackFn[] = [];

    addRollback(fn: RollbackFn): void {
        this.rollbackStack.push(fn);
    }

    async rollbackAll(): Promise<void> {
        await this.rollbackStack.reverse().reduce(async (prevPromise, fn) => {
            await prevPromise;
            try {
                await fn();
            } catch (error) {
                console.error('Rollback failed', error);
            }
        }, Promise.resolve());
    }
}