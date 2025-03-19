import UsageModel from "./usage.model";

export type Usage = {
    userId: string;
    remainingCount: number;
}

export default class UsageRepository {
    constructor() {
    }

    async decreaseCount(userId: string): Promise<Usage | null> {
        const result = await UsageModel.findOneAndUpdate(
            {userId},
            {$inc: {remainingCount: -1}},
            {new: true}
        ).lean<Usage>().exec();

        console.log("=== decrease count ===");
        console.log(result);
        console.log("=== decrease count ===");
        return result
    }

    async increaseCount(userId: string): Promise<Usage | null> {
        const result = await UsageModel.findOneAndUpdate(
            {userId},
            {$inc: {remainingCount: 1}},
            {new: true}
        ).lean<Usage>().exec();

        console.log("=== increase count ===");
        console.log(result);
        console.log("=== increase count ===");
        return result
    }
}