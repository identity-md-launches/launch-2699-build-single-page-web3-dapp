import {
  calculateFacts,
  validateAmount,
  validateText,
  type Facts,
} from "./validation";
export type DemoState = "approved" | "denied" | "objection" | "cabal-dead";
export type PleaState =
  | "pending"
  | "approved"
  | "denied"
  | "sold"
  | "objecting"
  | "sustained"
  | "overruled"
  | "expired"
  | "no-verdict";
export type Plea = {
  id: number;
  amount: number;
  balanceAtSubmission: number;
  text: string;
  status: PleaState;
  score: number;
  judges: number[];
  facts: Facts;
  submittedAt: number;
  resolvedAt?: number;
  soldAt?: number;
  saleScore?: number;
  objectionAt?: number;
  appealed: boolean;
};
export type Leader = {
  name: string;
  color: string;
  best: number[];
  points: number;
  prize: number;
  seat: boolean;
};
export const DEMO_TEXT =
  "My landlord does not accept conviction as payment. I need to make rent. The rest stays with the swarm.";
export const MOCK_PRICE = 0.000024;
export const ORACLE_FEE = 0.5;
export const OBJECTION_FEE = 0.1;
export const SELL_WINDOW = 7 * 60_000;
export const APPEAL_WINDOW = 4 * 3600_000;
export const OBJECTION_WINDOW = 20 * 60_000;
export const VERDICT_WINDOW = 20 * 60_000;
export const DEADMAN_WINDOW = 33 * 3600_000;
export const judgeScores = (answer: number) =>
  Array.from({ length: 30 }, (_, i) =>
    Math.max(
      0,
      Math.min(45, answer + Math.floor((((i * 13 + 7) % 30) - 16) / 3)),
    ),
  );
export const LEADERS: Leader[] = [
  {
    name: "rentis.due",
    color: "#FFD324",
    best: [45, 43, 42],
    points: 156,
    prize: 2480,
    seat: true,
  },
  {
    name: "exit_liquidity",
    color: "#C084FC",
    best: [44, 42, 40],
    points: 126,
    prize: 1960,
    seat: false,
  },
  {
    name: "yourhonor.eth",
    color: "#93C5FD",
    best: [42, 40, 39],
    points: 121,
    prize: 1540,
    seat: false,
  },
  {
    name: "diamondhands",
    color: "#4ADE80",
    best: [41, 39, 37],
    points: 117,
    prize: 1120,
    seat: false,
  },
  {
    name: "just_one_sell",
    color: "#F87171",
    best: [39, 37, 36],
    points: 112,
    prize: 840,
    seat: false,
  },
];
/** In-memory contract adapter. Replace this boundary with typed viem reads/writes for a real deployment. */
export class MockContract {
  balance = 450_000;
  imdBalance = 12.5;
  allowance = false;
  mode: DemoState = "approved";
  private pleas = new Map<number, Plea>();
  private nextId = 14;
  private deadmanUntil: number;
  constructor(private now: () => number = Date.now) {
    this.deadmanUntil = now() + DEADMAN_WINDOW;
  }
  reset() {
    this.balance = 450_000;
    this.imdBalance = 12.5;
    this.allowance = false;
    this.mode = "approved";
    this.pleas.clear();
    this.nextId = 14;
    this.deadmanUntil = this.now() + DEADMAN_WINDOW;
  }
  setMode(mode: DemoState) {
    this.mode = mode;
    if (mode !== "cabal-dead") this.deadmanUntil = this.now() + DEADMAN_WINDOW;
  }
  private alive() {
    if (this.getDeadmanRemaining() <= 0)
      throw new Error(
        "The Cabal is dead. Trading is open; pleas and objections are closed.",
      );
  }
  approveFee() {
    this.alive();
    this.allowance = true;
  }
  submitPlea(amount: number, text: string): Plea {
    this.alive();
    const error = validateAmount(String(amount), this.balance);
    if (error) throw new Error(error);
    if (!validateText(text).every((c) => c.valid))
      throw new Error("Fix the text checks before submitting.");
    if (!this.allowance) throw new Error("Approve the oracle fee first.");
    if (this.imdBalance < ORACLE_FEE)
      throw new Error("Not enough demo IMD for the oracle fee.");
    const last = [...this.pleas.values()].at(-1);
    const existing = last ? this.getPleaStatus(last.id) : undefined;
    if (
      existing &&
      ["pending", "approved", "objecting"].includes(existing.status)
    )
      throw new Error("Finish your current case first.");
    if (
      existing?.status === "denied" &&
      this.now() - (existing.resolvedAt ?? this.now()) < APPEAL_WINDOW
    )
      throw new Error(
        "Wait for the four-hour cooldown, or use your one appeal.",
      );
    this.imdBalance -= ORACLE_FEE;
    const facts = calculateFacts(amount, this.balance);
    const plea: Plea = {
      id: this.nextId++,
      amount,
      balanceAtSubmission: this.balance,
      text,
      status: "pending",
      score: 0,
      judges: [],
      facts,
      submittedAt: this.now(),
      appealed: false,
    };
    this.pleas.set(plea.id, plea);
    return { ...plea };
  }
  getPleaStatus(id: number): Plea {
    const p = this.pleas.get(id);
    if (!p) throw new Error("Case not found. Submit a new case.");
    if (p.status === "pending" && this.now() - p.submittedAt >= VERDICT_WINDOW)
      p.status = "no-verdict";
    if (
      p.status === "approved" &&
      this.now() - (p.resolvedAt ?? 0) >= SELL_WINDOW
    )
      p.status = "expired";
    return { ...p, judges: [...p.judges] };
  }
  resolve(id: number): Plea {
    this.alive();
    const p = this.getPleaStatus(id);
    if (p.status !== "pending" && p.status !== "objecting") return p;
    const isObjection = p.status === "objecting";
    const answer =
      this.mode === "denied" || (isObjection && this.mode === "objection")
        ? Math.max(0, p.facts.need - 9)
        : Math.min(
            45,
            p.facts.need + (isObjection && this.mode !== "objection" ? 3 : 0),
          );
    p.judges = judgeScores(answer);
    p.score = [...p.judges].sort((a, b) => a - b)[16];
    p.status = isObjection
      ? p.score < p.facts.need
        ? "sustained"
        : "overruled"
      : p.score >= p.facts.need
        ? "approved"
        : "denied";
    p.resolvedAt = this.now();
    this.deadmanUntil = this.now() + DEADMAN_WINDOW;
    this.pleas.set(id, p);
    return { ...p };
  }
  sell(id: number): Plea {
    this.alive();
    const p = this.getPleaStatus(id);
    if (p.status !== "approved")
      throw new Error(
        "Only an approved case inside its seven-minute window can sell.",
      );
    if (this.balance < p.amount) throw new Error("Not enough demo PLEA.");
    this.balance -= p.amount;
    this.imdBalance += p.amount * MOCK_PRICE * 0.99;
    p.status = "sold";
    p.saleScore = p.score;
    p.soldAt = this.now();
    this.pleas.set(id, p);
    return { ...p };
  }
  appeal(id: number, text: string): Plea {
    this.alive();
    const p = this.getPleaStatus(id);
    if (p.status !== "denied" || p.appealed)
      throw new Error("Only one appeal is available for a denied case.");
    if (this.now() - (p.resolvedAt ?? 0) > APPEAL_WINDOW)
      throw new Error("The four-hour appeal window has closed.");
    if (!validateText(text).every((c) => c.valid))
      throw new Error("Write a valid appeal in 1 to 280 bytes.");
    if (this.imdBalance < ORACLE_FEE)
      throw new Error("Not enough demo IMD for the oracle fee.");
    this.imdBalance -= ORACLE_FEE;
    p.text = text;
    p.status = "pending";
    p.submittedAt = this.now();
    p.appealed = true;
    this.pleas.set(id, p);
    return { ...p };
  }
  object(id: number): Plea {
    this.alive();
    const p = this.getPleaStatus(id);
    if (p.status !== "sold")
      throw new Error("An objection is only available after a sale.");
    if (this.now() - (p.soldAt ?? 0) >= OBJECTION_WINDOW)
      throw new Error("The twenty-minute objection window has closed.");
    if (this.imdBalance < OBJECTION_FEE)
      throw new Error("Not enough demo IMD for the objection fee.");
    this.imdBalance -= OBJECTION_FEE;
    p.status = "objecting";
    p.objectionAt = this.now();
    this.pleas.set(id, p);
    return { ...p };
  }
  getLeaderboard(): Leader[] {
    const rows = LEADERS.map((p) => ({ ...p, best: [...p.best] }));
    const best = [...this.pleas.values()]
      .filter((p) => ["sold", "objecting", "overruled"].includes(p.status))
      .map((p) => p.saleScore ?? p.score)
      .sort((a, b) => b - a)
      .slice(0, 3);
    if (best.length)
      rows.push({
        name: "you.demo",
        color: "#FFD324",
        best,
        points: best.reduce((a, b) => a + b, 0),
        prize: 0,
        seat: false,
      });
    return rows.sort((a, b) => b.points - a.points);
  }
  getDeadmanRemaining() {
    return this.mode === "cabal-dead"
      ? 0
      : Math.max(0, this.deadmanUntil - this.now());
  }
  buy(imd: number) {
    if (!Number.isFinite(imd) || imd <= 0)
      throw new Error("Enter an IMD amount greater than zero.");
    if (imd > this.imdBalance)
      throw new Error("Enter an amount within your demo IMD balance.");
    const received = Math.floor(imd / MOCK_PRICE);
    if (received < 1)
      throw new Error("Enter at least 0.000024 IMD to receive one demo PLEA.");
    this.imdBalance -= imd;
    this.balance += received;
    return received;
  }
  freeSell(amount: number) {
    if (this.getDeadmanRemaining() > 0)
      throw new Error("Selling still needs an approved case.");
    if (!Number.isFinite(amount) || amount <= 0 || amount > this.balance)
      throw new Error("Enter an amount within your demo PLEA balance.");
    this.balance -= amount;
    const received = amount * MOCK_PRICE * 0.99;
    this.imdBalance += received;
    return received;
  }
}
