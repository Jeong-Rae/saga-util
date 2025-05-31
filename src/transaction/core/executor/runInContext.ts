import { Propagation } from "../../options";
import { contextStore, getCurrentContext } from "../context/ContextStorage";
import { TransactionContext } from "../context/TransactionContext";

export async function runInContext<R>(
	options: { propagation: Propagation },
	func: (context: TransactionContext) => Promise<R>,
): Promise<R> {
	const inherited = getCurrentContext();
	const context =
		inherited && options.propagation === Propagation.Inherit
			? inherited
			: new TransactionContext();

	const runner = () => func(context);
	return inherited && options.propagation === Propagation.Inherit
		? runner()
		: contextStore.run(context, runner);
}
