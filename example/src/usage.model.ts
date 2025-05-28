import mongoose, { Schema } from "mongoose";
import type { Document, Model } from "mongoose";

export type UsageDocument = Document & {
	userId: string;
	remainingCount: number;
};

const UsageSchema = new Schema<UsageDocument>(
	{
		userId: {
			type: String,
			required: true,
		},
		remainingCount: {
			type: Number,
			default: 10,
		},
	},
	{ timestamps: true },
);

const UsageModel: Model<UsageDocument> = mongoose.model<UsageDocument>(
	"Usage",
	UsageSchema,
);

export default UsageModel;
