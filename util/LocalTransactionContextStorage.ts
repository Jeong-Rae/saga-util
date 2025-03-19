import { AsyncLocalStorage } from 'async_hooks';
import {LocalTransactionContext} from "./LocalTransactionContext";

export const localTransactionContextStorage = new AsyncLocalStorage<LocalTransactionContext>();