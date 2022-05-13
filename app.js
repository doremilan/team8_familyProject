const express = require('express');
const indexRouter = require('./routers/index');
const connect = require('./schemas/index');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');
const port = 3000;
const app = express();

connect();

// 각종 미들웨어
app.use(cors({ origin: "http://localhost:3000" }))
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(helmet()); //보안에 필요한 헤더 추가 미들웨어
app.use(morgan('tiny')); // 서버 요청 모니터링 미들웨어

// 라우터 연결
app.use(indexRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  res.sendStatus(404);
});



// cors test 
app.get("/cors-test", (req, res) => {
  console.log(process.env.CORS)
  res.send("hi")
})

// error handler
app.use((error, req, res, next) => {
  console.error(error);
  res.sendStatus(500);
});

// 서버 열기
app.listen(port, () => {
  console.log(port, 'Server is listening...');
});
