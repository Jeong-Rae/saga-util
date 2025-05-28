import mongoose from "mongoose";
import LlmCallService from "./llmcall.service";
import UsageRepository from "./usage.repository";
import UserRepository from "./user.repository";

mongoose.connect(process.env.MONGO_URI as string);

const callService = new LlmCallService(
	new UserRepository(),
	new UsageRepository(),
);

callService.process("lyght").then(console.log);
