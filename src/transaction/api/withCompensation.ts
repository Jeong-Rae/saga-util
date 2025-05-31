import { getOrCreateContext } from "../core/context/ContextStorage";

export type ForwardFn<R = unknown> = () => R | Promise<R>;
export type CompensationFn = () => void | Promise<void>;

/**
 * forward 실행 후 compensation 을 보상 스택에 등록한다.
 */
export async function withCompensation<R>(
	forward: ForwardFn<R>,
	compensation: CompensationFn,
): Promise<R> {
	const context = getOrCreateContext();
	const result = await forward();
	context.addRollback(compensation);
	return result;
}
