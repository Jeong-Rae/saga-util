import express from 'express';
import mongoose from 'mongoose';
import LlmCallService from "./example/llmcall.service";
import UserRepository from "./example/user.repository";
import UsageRepository from "./example/usage.repository";

const app = express();
const port = 3000;

// MongoDB 연결
mongoose.connect('mongodb+srv://home:8pGjOvDeG0CpR04i@cluster0.wqyssre.mongodb.net/test').then(() => {
    console.log('MongoDB에 성공적으로 연결되었습니다.');
}).catch((error) => {
    console.error('MongoDB 연결 오류:', error);
});

// Express 애플리케이션 시작
app.get('/', (req, res) => {
    res.send('Hello, world!');
});

app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});

const callService = new LlmCallService(
    new UserRepository(),
    new UsageRepository()
);

callService.process("lyght").then(console.log);