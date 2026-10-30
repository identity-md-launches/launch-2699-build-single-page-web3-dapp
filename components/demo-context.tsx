import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DEMO_TEXT,
  MockContract,
  type DemoState,
  type Plea,
} from "@/lib/mock-contract";
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
function useDemoState() {
  const [contract] = useState(() => new MockContract());
  const [mode, setMode] = useState<DemoState>("approved");
  const [active, setActiveState] = useState<Plea | null>(null);
  const activeRef = useRef<Plea | null>(null);
  function setActive(plea: Plea | null) {
    activeRef.current = plea;
    setActiveState(plea);
  }
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState<{
    action: string;
    message: string;
  } | null>(null);
  const [revision, setRevision] = useState(0);
  const refresh = () => setRevision((v) => v + 1);
  async function run<T>(name: string, action: () => T): Promise<T | null> {
    if (busy) return null;
    setBusy(name);
    setNotice("");
    setActionError(null);
    try {
      await pause(550);
      const result = action();
      refresh();
      return result;
    } catch (e) {
      setActionError({
        action: name,
        message:
          e instanceof Error ? e.message : "That action failed. Try again.",
      });
      setNotice(
        e instanceof Error ? e.message : "That action failed. Try again.",
      );
      return null;
    } finally {
      setBusy("");
    }
  }
  function reset() {
    setActionError(null);
    setActive(null);
    contract.reset();
    setMode("approved");
    setNotice("Demo reset. Your balance and cases are fresh.");
    refresh();
  }
  function changeMode(next: DemoState) {
    setActionError(null);
    contract.setMode(next);
    setMode(next);
    setNotice(
      next === "cabal-dead"
        ? "Demo: the Cabal is dead. Pleas are closed and selling is open."
        : `Demo outcome: ${next}. Submit a case to see it play out.`,
    );
    refresh();
  }
  async function submitPlea(amount: number, text: string) {
    const p = await run("submit", () => contract.submitPlea(amount, text));
    if (p) setActive(p);
    return p;
  }
  async function sell(id: number) {
    const p = await run("sell", () => contract.sell(id));
    if (p) setActive(p);
    return p;
  }
  async function object(id: number) {
    const p = await run("object", () => contract.object(id));
    if (p) setActive(p);
    return p;
  }
  async function appeal(id: number, text: string) {
    const p = await run("appeal", () => contract.appeal(id, text));
    if (p) setActive(p);
    return p;
  }
  function resolve() {
    const current = activeRef.current;
    if (!current) return;
    try {
      setActive(contract.resolve(current.id));
      refresh();
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  function updateStatus() {
    const current = activeRef.current;
    if (current) {
      const next = contract.getPleaStatus(current.id);
      if (next.status !== current.status) setActive(next);
    }
  }
  async function sampleCase() {
    const p = await run("sample", () => {
      if (
        active &&
        ["pending", "approved", "objecting"].includes(active.status)
      )
        return active;
      contract.approveFee();
      return contract.submitPlea(
        Math.min(90_000, Math.floor(contract.balance * 0.2)),
        DEMO_TEXT,
      );
    });
    if (p) setActive(p);
    return p;
  }
  return {
    contract,
    mode,
    changeMode,
    reset,
    active,
    busy,
    notice,
    setNotice,
    actionError,
    revision,
    refresh,
    run,
    submitPlea,
    sell,
    object,
    appeal,
    resolve,
    updateStatus,
    sampleCase,
  };
}
type DemoContextValue = ReturnType<typeof useDemoState>;
const DemoContext = createContext<DemoContextValue | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const value = useDemoState();
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
export function useMockContract() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("PLEA provider missing");
  return ctx;
}
