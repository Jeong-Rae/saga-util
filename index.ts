import mongoose from 'mongoose';
import LlmCallService from "./example/llmcall.service";
import UserRepository from "./example/user.repository";
import UsageRepository from "./example/usage.repository";

mongoose.connect('mongodb+srv://home:8pGjOvDeG0CpR04i@cluster0.wqyssre.mongodb.net/test');


const callService = new LlmCallService(
    new UserRepository(),
    new UsageRepository()
);

callService.process("lyght").then(console.log);