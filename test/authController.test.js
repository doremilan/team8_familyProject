const authController = require("../controllers/authController");
const httpMocks = require("node-mocks-http");
const User = require("../schemas/user");

//json으로 만든 가짜 프론트 req.body 데이터 값.
const signup1 = require("../data/signup1.json");
const signup2 = require("../data/signup2.json");
const signup4 = require("../data/signup4.json");
const signup5 = require("../data/signup5.json");
const signup6 = require("../data/signup6.json");
const signup7 = require("../data/signup7.json");
const signup8 = require("../data/signup8.json");

User.findOne = jest.fn();
User.create = jest.fn();
User.updateOne = jest.fn();

beforeEach(() => {
  req = httpMocks.createRequest();
  res = httpMocks.createResponse();
  next = null;
});

//회원가입 테스트
describe("회원가입", () => {
  test("회원가입 가능할 때", async () => {
    req.body = signup4;

    User.create.mockResolvedValue(signup5);
    await authController.signup(req, res, next);

    expect(res._getJSONData()).toStrictEqual({
      success: "회원가입이 완료되었습니다.",
    });
  });

  test("password와 passwordChk가 다른 경우 에러 발생!", async () => {
    req.body = signup1;

    await authController.signup(req, res, next);
    expect(res._getJSONData()).toStrictEqual({
      fail: "비밀번호가 일치하지 않습니다.",
    });
  });

  test("이미 가입되어 있는 email인 경우 에러 발생!", async () => {
    req.body = signup2;
    User.findOne.mockResolvedValue(signup2);

    await authController.signup(req, res, next);
    expect(res._getJSONData()).toStrictEqual({
      fail: "중복된 이메일이 있습니다.",
    });
  });

  test("email input이 email 양식에 맞지 않을 때 에러 발생!", async () => {
    req.body = signup6;

    await authController.signup(req, res, next);
    expect(res._getJSONData()).toStrictEqual({
      fail: "이메일 형식을 확인해주세요.",
    });
  });

  test("password input이 양식에 맞지 않을 때 에러 발생!", async () => {
    req.body = signup7;

    await authController.signup(req, res, next);
    expect(res._getJSONData()).toStrictEqual({
      fail: "비밀번호는 최소 8자 이상, 20자 이하의 영문 대소문자와 최소 1개의 숫자 혹은 특수문자(!@#$%^*_-)를 포함해야 합니다.",
    });
  });

  test("nickname input이 양식에 맞지 않을 때 에러 발생!", async () => {
    req.body = signup8;

    await userController.userSignup(req, res, next);
    expect(res._getJSONData()).toStrictEqual({
      fail: "닉네임은 2자 이상, 15자 이하의 영어 대소문자나 한글입니다.",
    });
  });

  test("회원가입의 각 항목은 필수 값으로 하나라도 없다면 에러 발생!", () => {
    const email = "";
    const password = null;
    const passwordCheck = "";
    const nickname = undefined;

    expect(() => {
      email, password, passwordCheck, nickname === "" || undefined || null;
    }).toThrow();
  });
});
