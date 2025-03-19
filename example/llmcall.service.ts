import UserRepository from "./user.repository";
import UsageRepository from "./usage.repository";
import {LocalTransaction} from "../util/LocalTransactionDecorator";
import {withRollback} from "../util/LocalTransactionContext";

export default class LlmCallService {
    constructor(
        private userRepository: UserRepository,
        private usageRepository: UsageRepository,
    ) {
    }

    @LocalTransaction({ catchUnhandledError: true })
    async process(userId: string): Promise<any> {
        const usage = await withRollback(this.usageRepository.decreaseCount(userId))
            .rollback(() => this.usageRepository.increaseCount(userId));
        if (!usage) {
            throw new Error('Not found usage');
        }

        if (usage.remainingCount <= 0) {
            await withRollback(this.userRepository.updatePricingType(userId, 'free'))
                .rollback(() => this.userRepository.updatePricingType(userId, 'freetrial'));
        }

        const response = await withRollback(this.callLlm());
        return response;


    }

    async callLlm() {
        throw new Error("call fail");
    }
}