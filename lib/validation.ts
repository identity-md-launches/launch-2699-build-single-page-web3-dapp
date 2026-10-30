export const MAX_BYTES = 280;
export const MIN_AMOUNT = 1;
export const MAX_AMOUNT = 2_500_000;
export const utf8Bytes = (text: string) =>
  new TextEncoder().encode(text).length;
export function validateText(text: string) {
  const bytes = utf8Bytes(text);
  return [
    { label: "1 to 280 bytes", valid: bytes >= 1 && bytes <= MAX_BYTES },
    {
      label: "One line, no control characters",
      valid: !/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/u.test(text),
    },
    {
      label: "No hidden characters",
      valid:
        !/[\p{Cf}\u034f\u115f\u1160\u17b4\u17b5\u180b-\u180f\u2800\u3164\ufe00-\ufe0f\uffa0\u{e0100}-\u{e01ef}]/u.test(
          text,
        ),
    },
    {
      label: "No “plea” or “objection” markers",
      valid: !/plea|objection/i.test(text),
    },
  ];
}
export function maximumSell(balance: number) {
  return Math.min(Math.floor(balance * 0.5), MAX_AMOUNT);
}
export function validateAmount(amount: string, balance: number) {
  if (!/^\d+(\.\d{1,6})?$/.test(amount))
    return "Enter an amount with up to 6 decimal places.";
  const value = Number(amount);
  if (!Number.isFinite(value) || value < MIN_AMOUNT)
    return `Enter at least ${MIN_AMOUNT} PLEA.`;
  if (value > maximumSell(balance))
    return `You can sell up to ${maximumSell(balance).toLocaleString("en-US")} PLEA.`;
  return "";
}
export type Facts = {
  share: number;
  held: number;
  pnl: number;
  trend: number;
  total: number;
  need: number;
};
export function calculateFacts(amount: number, balance: number): Facts {
  const share = Math.max(
    0,
    15 - Math.floor((amount / Math.max(balance, 1)) * 35),
  );
  const held = 12,
    pnl = 9,
    trend = 7;
  const total = share + held + pnl + trend;
  return {
    share,
    held,
    pnl,
    trend,
    total,
    need: Math.max(0, Math.min(45, 71 - total)),
  };
}
export const formatNumber = (value: number, decimals = 0) =>
  value.toLocaleString("en-US", { maximumFractionDigits: decimals });
export function formatDuration(ms: number, hours = false) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(seconds / 3600),
    m = Math.floor((seconds % 3600) / 60),
    s = seconds % 60;
  return (
    (hours ? `${String(h).padStart(2, "0")}:` : "") +
    `${String(hours ? m : Math.floor(seconds / 60)).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  );
}
