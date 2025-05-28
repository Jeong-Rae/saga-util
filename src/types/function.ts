export type AnyFn<Args extends unknown[] = unknown[], Return = unknown> = (
	...args: Args
) => Return;
