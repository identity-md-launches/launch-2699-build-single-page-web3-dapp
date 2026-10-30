import { test } from "node:test";
import assert from "node:assert/strict";
import {
  APPEAL_WINDOW,
  DEADMAN_WINDOW,
  DEMO_TEXT,
  MockContract,
  MOCK_PRICE,
  OBJECTION_WINDOW,
  SELL_WINDOW,
  VERDICT_WINDOW,
} from "../lib/mock-contract";
import {
  calculateFacts,
  maximumSell,
  utf8Bytes,
  validateAmount,
  validateText,
} from "../lib/validation";
const valid = (s: string) => validateText(s).every((v) => v.valid);
function fixture() {
  let now = 1_800_000_000_000;
  const c = new MockContract(() => now);
  c.approveFee();
  return {
    c,
    tick: (ms: number) => {
      now += ms;
    },
    submit: () => c.submitPlea(90_000, DEMO_TEXT),
  };
}
test("counts UTF-8 bytes for Latin, Cyrillic and CJK", () => {
  assert.equal(utf8Bytes("abc"), 3);
  assert.equal(utf8Bytes("д"), 2);
  assert.equal(utf8Bytes("我"), 3);
});
test("rejects empty text", () => assert.equal(valid(""), false));
test("accepts the 280-byte boundary", () =>
  assert.equal(valid("a".repeat(280)), true));
test("rejects text over the byte boundary", () =>
  assert.equal(valid("д".repeat(141)), false));
test("rejects newlines, carriage returns and controls", () => {
  for (const char of ["\n", "\r", "\t", "\x00", "\x7f", "\u2028"])
    assert.equal(valid("case" + char), false);
});
test("rejects zero-width and direction characters", () => {
  for (const char of ["\u200b", "\u200d", "\u202e", "\u2066", "\ufeff"])
    assert.equal(valid("case" + char), false);
});
test("rejects variation selectors and invisible fillers", () => {
  for (const char of ["\ufe0f", "\u{e0100}", "\u3164", "\u034f"])
    assert.equal(valid("case" + char), false);
});
test("rejects reserved markers in every case", () => {
  for (const s of ["PLEA", "my PleA", "objection", "ObJeCtIoN"])
    assert.equal(valid(s), false);
});
test("accepts multilingual single-line text", () =>
  assert.equal(valid("Мне нужна аренда. 我需要付房租."), true));
test("limits sales to half the balance or 2.5 million", () => {
  assert.equal(maximumSell(450_000), 225_000);
  assert.equal(maximumSell(10_000_000), 2_500_000);
});
test("validates amount minimum, balance, decimals and malformed numbers", () => {
  for (const amount of [
    "0",
    "-1",
    "NaN",
    "Infinity",
    "225001",
    "1e4",
    "1.1234567",
  ])
    assert.notEqual(validateAmount(amount, 450_000), "");
  assert.equal(validateAmount("90000", 450_000), "");
});
test("calculates the requested example: fact 36, need 35", () => {
  const f = calculateFacts(90_000, 450_000);
  assert.equal(f.total, 36);
  assert.equal(f.need, 35);
});
test("checks text before taking a fee", () => {
  const { c } = fixture();
  const before = c.imdBalance;
  assert.throws(() => c.submitPlea(90_000, "PLEA"));
  assert.equal(c.imdBalance, before);
});
test("checks amount before taking a fee", () => {
  const { c } = fixture();
  assert.throws(() => c.submitPlea(225_001, DEMO_TEXT));
  assert.equal(c.imdBalance, 12.5);
});
test("requires one-time approval", () => {
  const c = new MockContract();
  assert.throws(() => c.submitPlea(90_000, DEMO_TEXT), /Approve/);
  c.approveFee();
  assert.equal(c.submitPlea(90_000, DEMO_TEXT).id, 14);
});
test("submission charges exactly 0.5 IMD and starts pending", () => {
  const { c, submit } = fixture();
  const p = submit();
  assert.equal(p.status, "pending");
  assert.equal(c.imdBalance, 12);
  assert.equal(c.balance, 450_000);
});
test("prevents duplicate active cases", () => {
  const { submit } = fixture();
  submit();
  assert.throws(submit, /current case/);
});
test("approved panel has 30 scores and uses the seventeenth sorted value", () => {
  const { c, submit } = fixture();
  const p = c.resolve(submit().id);
  assert.equal(p.judges.length, 30);
  assert.equal(p.score, [...p.judges].sort((a, b) => a - b)[16]);
  assert.equal(p.status, "approved");
});
test("selling debits PLEA, credits IMD and cannot sell twice", () => {
  const { c, submit } = fixture();
  const p = c.resolve(submit().id);
  assert.equal(c.sell(p.id).status, "sold");
  assert.equal(c.balance, 360_000);
  assert.equal(c.imdBalance, 12 + 90_000 * MOCK_PRICE * 0.99);
  assert.throws(() => c.sell(p.id));
});
test("approval expires after seven minutes", () => {
  const { c, submit, tick } = fixture();
  const p = c.resolve(submit().id);
  tick(SELL_WINDOW);
  assert.equal(c.getPleaStatus(p.id).status, "expired");
  assert.throws(() => c.sell(p.id));
});
test("denied mode scores below the need", () => {
  const { c, submit } = fixture();
  c.setMode("denied");
  const p = c.resolve(submit().id);
  assert.equal(p.status, "denied");
  assert.ok(p.score < p.facts.need);
});
test("denial blocks a new case during the four-hour cooldown", () => {
  const { c, submit, tick } = fixture();
  c.setMode("denied");
  c.resolve(submit().id);
  assert.throws(submit, /four-hour/);
  tick(APPEAL_WINDOW);
  assert.equal(submit().status, "pending");
});
test("allows one paid appeal and rejects a second appeal", () => {
  const { c, submit } = fixture();
  c.setMode("denied");
  const p = c.resolve(submit().id);
  assert.equal(c.appeal(p.id, "I have rent to pay.").status, "pending");
  assert.equal(c.imdBalance, 11.5);
  c.resolve(p.id);
  assert.throws(() => c.appeal(p.id, "One more time."), /one appeal/);
});
test("appeal closes after four hours", () => {
  const { c, submit, tick } = fixture();
  c.setMode("denied");
  const p = c.resolve(submit().id);
  tick(APPEAL_WINDOW + 1);
  assert.throws(() => c.appeal(p.id, DEMO_TEXT), /closed/);
});
test("no verdict gives no refund and permits a new case", () => {
  const { c, submit, tick } = fixture();
  const p = submit();
  tick(VERDICT_WINDOW);
  assert.equal(c.getPleaStatus(p.id).status, "no-verdict");
  assert.equal(c.imdBalance, 12);
  assert.equal(submit().status, "pending");
});
test("an objection charges 0.1 IMD and a sustained objection preserves the sale", () => {
  const { c, submit } = fixture();
  c.setMode("objection");
  const p = c.resolve(submit().id);
  c.sell(p.id);
  const before = c.imdBalance;
  assert.equal(c.object(p.id).status, "objecting");
  assert.equal(c.imdBalance, before - 0.1);
  assert.equal(c.resolve(p.id).status, "sustained");
  assert.equal(c.balance, 360_000);
});
test("an overruled objection keeps the original sale", () => {
  const { c, submit } = fixture();
  const p = c.resolve(submit().id);
  c.sell(p.id);
  c.object(p.id);
  assert.equal(c.resolve(p.id).status, "overruled");
  assert.equal(
    c.getLeaderboard().find((row) => row.name === "you.demo")?.points,
    p.score,
  );
  assert.equal(c.balance, 360_000);
});
test("objections close after twenty minutes", () => {
  const { c, submit, tick } = fixture();
  const p = c.resolve(submit().id);
  c.sell(p.id);
  tick(OBJECTION_WINDOW);
  assert.throws(() => c.object(p.id), /closed/);
});
test("the 33-hour switch closes pleas and opens free selling", () => {
  const { c, tick } = fixture();
  assert.equal(c.getDeadmanRemaining(), DEADMAN_WINDOW);
  tick(DEADMAN_WINDOW);
  assert.equal(c.getDeadmanRemaining(), 0);
  assert.throws(() => c.submitPlea(100, DEMO_TEXT), /dead/);
  assert.ok(c.freeSell(100) > 0);
});
test("buying, leaderboard copies and demo reset work without a backend", () => {
  const { c } = fixture();
  assert.equal(c.buy(1), 41666);
  assert.equal(c.balance, 491666);
  const board = c.getLeaderboard();
  board[0].name = "changed";
  assert.equal(c.getLeaderboard()[0].name, "rentis.due");
  c.setMode("cabal-dead");
  c.reset();
  assert.equal(c.balance, 450_000);
  assert.equal(c.imdBalance, 12.5);
  assert.equal(c.allowance, false);
  assert.equal(c.mode, "approved");
});
