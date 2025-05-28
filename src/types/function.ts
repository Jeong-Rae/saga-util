// biome-ignore lint/suspicious/noExplicitAny: any type
export type AnyFn<Args extends any[] = any[], Return = any> = (
	...args: Args
) => Return;
