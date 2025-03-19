import {RollbackFailedError} from './RollbackFailedError';

export type AnyRollbackFn = () => any;

export type RollbackablePromise<T> = Promise<T> & {
    rollback(rollbackFn: AnyRollbackFn): RollbackablePromise<T>;
};

export class LocalTransactionContext {
    // 롤백 함수는 모두 async로 래핑해서 실행할 예정이므로 Promise<void> 목록을 관리
    private rollbackStack: Array<() => Promise<void>> = [];

    /**
     * 동기/비동기 상관없이 AnyRollbackFn을 등록하면,
     * 내부에서 async 함수로 래핑하여 rollbackStack에 추가.
     */
    addRollback(fn: AnyRollbackFn): void {
        const wrappedFn = async () => {
            await Promise.resolve().then(fn);
        };
        this.rollbackStack.push(wrappedFn);
    }

    /**
     * rollbackAll: 스택을 역순으로 실행하며, 하나라도 실패 시 RollbackFailedError 발생
     */
    async rollbackAll(): Promise<void> {
        await this.rollbackStack.reverse().reduce(async (prev, rollbackFn) => {
            await prev;
            try {
                await rollbackFn();
            } catch (error) {
                throw new RollbackFailedError('rollback failed');
            }
        }, Promise.resolve());
    }
}
