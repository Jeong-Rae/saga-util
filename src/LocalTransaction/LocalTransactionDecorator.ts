import {LocalTransactionContext} from "./LocalTransactionContext";
import {localTransactionContextStorage} from "./LocalTransactionContextStorage";

export type LocalTransactionOptions = {
    catchUnhandledError?: boolean;
    propagation?: 'new' | 'inherit';
    verbose?: boolean;
}

export function LocalTransaction(options: LocalTransactionOptions = {
    catchUnhandledError: true,
    propagation: 'inherit',
    verbose: false
}) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod: Function = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const transactionContext = localTransactionContextStorage.getStore();
            if (transactionContext && options.propagation === 'inherit') {
                return await executeWithContext(transactionContext, originalMethod, this, args, options);
            }

            const newContext = new LocalTransactionContext();
            return localTransactionContextStorage.run(newContext, async () => {
                return await executeWithContext(newContext, originalMethod, this, args, options);
            });
        }
    }
}

async function executeWithContext(
    context: LocalTransactionContext,
    method: Function,
    thisArg: any,
    args: any[],
    options?: LocalTransactionOptions
) {
    try {
        return await method.apply(thisArg, args);
    } catch (error) {
        if (options?.catchUnhandledError) {
            options?.verbose && console.error('unhandledCatchError', error);
            await context.rollbackAll();
        }
        throw error;
    }
}