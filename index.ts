import LlmCallService from "./example/llmcall.service";
import UserRepository from "./example/user.repository";
import UsageRepository from "./example/usage.repository";


const callService = new LlmCallService(
    new UserRepository(),
    new UsageRepository()
);

callService.process("lyght").then(console.log);