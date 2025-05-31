import { AsyncLocalStorage } from "node:async_hooks";
import { TransactionContext } from "./TransactionContext";

export const contextStore = new AsyncLocalStorage<TransactionContext>();

export const getCurrentContext = () => contextStore.getStore();

export const getOrCreateContext = (): TransactionContext => {
	let context = contextStore.getStore();
	if (!context) {
		context = new TransactionContext();
		contextStore.enterWith(context);
	}
	return context;
};
