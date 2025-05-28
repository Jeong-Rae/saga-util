import { AsyncLocalStorage } from "node:async_hooks";
import type { LocalTransactionContext } from "./LocalTransactionContext";

export const localTransactionContextStorage =
	new AsyncLocalStorage<LocalTransactionContext>();
