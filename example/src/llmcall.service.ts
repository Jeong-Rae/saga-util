import { LocalTransaction, withRollback } from "@lyght/saga";
import type UsageRepository from "./usage.repository";
import type UserRepository from "./user.repository";

export default class LlmCallService {
	constructor(
		private userRepository: UserRepository,
		private usageRepository: UsageRepository,
	) {}

	@LocalTransaction()
	// biome-ignore lint/suspicious/noExplicitAny: example code
	async process(userId: string): Promise<any> {
		const usage = await withRollback(
			this.usageRepository.decreaseCount(userId),
		).rollback(() => this.usageRepository.increaseCount(userId));
		if (!usage) {
			throw new Error("Not found usage");
		}

		if (usage.remainingCount <= 0) {
			await withRollback(
				this.userRepository.updatePricingType(userId, "free"),
			).rollback(() =>
				this.userRepository.updatePricingType(userId, "freetrial"),
			);
		}

		const response = await this.callLlm();
		return response;
	}

	@LocalTransaction()
	// biome-ignore lint/suspicious/noExplicitAny: example code
	async process2(userId: string): Promise<any> {
		const usage = await this.usageRepository.decreaseCount(userId);
		if (!usage) {
			throw new Error("Not found usage");
		}

		if (usage.remainingCount <= 0) {
			await this.userRepository.updatePricingType(userId, "free");
		}

		const response = await this.callLlm();
		return response;
	}

	async callLlm() {
		throw new Error("call fail");
	}
}
