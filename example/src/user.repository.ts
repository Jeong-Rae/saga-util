import UserModel from "./user.model";
import type { UserDocument } from "./user.model";

export type User = {
	id: string;
	pricingType: UserDocument["pricingType"];
};

export default class UserRepository {
	async updatePricingType(
		id: string,
		pricingType: UserDocument["pricingType"],
	): Promise<User | null> {
		const result = await UserModel.findOneAndUpdate(
			{ id },
			{ pricingType },
			{ new: true },
		)
			.lean<User>()
			.exec();

		console.log("=== update pricingType ===");
		console.log(result);
		console.log("=== update pricingType ===");

		return result;
	}
}
