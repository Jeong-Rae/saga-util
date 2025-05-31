import { getOrCreateContext } from "../core/context/ContextStorage";

type ForwardFn<R = unknown> = () => R | Promise<R>;
type CompensationFn = () => void | Promise<void>;

interface Step<R = unknown> {
	forward: ForwardFn<R>;
	compensation: CompensationFn;
}

export class SagaBuilder {
	private readonly steps: Step[] = [];

	static begin(): SagaBuilder {
		return new SagaBuilder();
	}

	step<R>(forward: ForwardFn<R>, compensation: CompensationFn): this {
		this.steps.push({ forward, compensation });
		return this;
	}

	async run(): Promise<void> {
		const context = getOrCreateContext();
		for (const { forward, compensation } of this.steps) {
			const result = await forward();
			void result; // forward 결과를 바깥에서 잡도록 할 수도 있음
			context.addRollback(compensation);
		}
	}
}
