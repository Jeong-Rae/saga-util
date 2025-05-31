import { runInContext } from "../core/executor/runInContext";
import { Propagation } from "../options";

type ForwardFn<R = unknown> = () => R | Promise<R>;
type CompensationFn = () => void | Promise<void>;

export async function usingSaga<R>(
	func: (helpers: {
		forward: <T>(f: ForwardFn<T>) => Promise<T>;
		compensation: (f: CompensationFn) => void;
	}) => Promise<R>,
): Promise<R> {
	return runInContext({ propagation: Propagation.New }, async (context) =>
		func({
			forward: async (f) => {
				const result = await f();
				context.addRollback(() => Promise.resolve().then(() => undefined));
				return result;
			},
			compensation: (f) => context.addRollback(f),
		}),
	);
}
