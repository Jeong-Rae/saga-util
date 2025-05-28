import { Schema, model } from "mongoose";
import type { Document, Model } from "mongoose";

export type PricingType = "free" | "freetrial" | "membership";

export type UserDocument = Document & {
	id: string;
	pricingType: PricingType;
};

const UserSchema = new Schema<UserDocument>(
	{
		id: { type: String, required: true },
		pricingType: {
			type: String,
			enum: ["free", "freetrial", "membership"],
			required: true,
		},
	},
	{ timestamps: true },
);

const UserModel: Model<UserDocument> = model<UserDocument>("User", UserSchema);

export default UserModel;
