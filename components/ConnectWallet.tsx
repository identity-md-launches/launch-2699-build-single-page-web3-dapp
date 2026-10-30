import { useEffect, useState } from "react";
import {
  useConnection,
  useConnect,
  useConnectors,
  useDisconnect,
  useSwitchChain,
  type Connector,
} from "wagmi";
import { Wallet, ArrowUpRight, LogOut, Globe } from "lucide-react";
import { chain } from "@/lib/wallet";
import { isMobileBrowser, OPEN_IN } from "@/lib/open-in";
import { Modal } from "./ui";
export function ConnectWallet() {
  const [open, setOpen] = useState(false);
  const [mobileWithoutLegacy, setMobile] = useState(false);
  const [error, setError] = useState("");
  const { address, isConnected, chainId } = useConnection();
  const connectors = useConnectors();
  const { connectAsync, isPending, variables } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync, isPending: switching } = useSwitchChain();
  useEffect(() => {
    setMobile(isMobileBrowser());
  }, [open]);
  useEffect(() => {
    if (isConnected) setOpen(false);
  }, [isConnected]);
  const named = connectors.some(
    (c) => c.type === "injected" && c.id !== "injected",
  );
  const mobile = mobileWithoutLegacy && !named;
  const listed = [
    ...connectors.filter((c) => c.type === "injected"),
    ...connectors.filter((c) => c.type !== "injected"),
  ]
    .filter((c) => !(c.id === "injected" && named))
    .filter((c) => !mobile || c.type !== "injected");
  const label = (c: Connector) =>
    c.id === "injected"
      ? "Browser wallet"
      : /coinbase/i.test(c.id)
        ? mobile
          ? "Coinbase Smart Wallet"
          : "Coinbase Wallet"
        : c.name;
  async function connect(c: Connector) {
    setError("");
    try {
      await connectAsync({ connector: c });
      setOpen(false);
    } catch (e) {
      const text = (e as Error).message;
      setError(
        /reject|denied|cancel/i.test(text)
          ? "Connection declined. Choose a wallet to try again."
          : c.id === "injected"
            ? "No browser wallet found. Install a wallet or choose Coinbase Wallet."
            : "Could not connect. Try again in your wallet browser.",
      );
    }
  }
  async function switchNetwork() {
    setError("");
    try {
      await switchChainAsync({ chainId: chain.id });
    } catch {
      setError(
        "Network switch declined. Switch to Base Sepolia in your wallet, then try again.",
      );
      setOpen(true);
    }
  }
  return (
    <>
      <button
        className="button button-black wallet-button"
        onClick={() =>
          isConnected && chainId !== chain.id ? switchNetwork() : setOpen(true)
        }
        disabled={switching}
      >
        <Wallet size={17} aria-hidden="true" />
        <span>
          {switching
            ? "Switching…"
            : isConnected && address
              ? chainId !== chain.id
                ? "Switch to Base Sepolia"
                : `${address.slice(0, 6)}…${address.slice(-4)}`
              : "Connect wallet"}
        </span>
      </button>
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setError("");
        }}
        title={isConnected ? "Your wallet" : "Connect a wallet"}
      >
        <p className="muted modal-intro">
          Optional for this demo. All balances and actions are simulated. No
          signature needed.
        </p>
        {isConnected && address ? (
          <>
            <p className="wallet-address mono">{address}</p>
            <button
              className="wallet-row"
              onClick={() => {
                disconnect();
                setOpen(false);
              }}
            >
              <LogOut size={22} />
              Disconnect
            </button>
          </>
        ) : (
          <div className="wallet-list">
            {mobile &&
              OPEN_IN.map((w) => (
                <a
                  className="wallet-row"
                  href={w.href(location.href)}
                  key={w.id}
                >
                  <img
                    src={`./wallets/${w.id}.svg`}
                    width={28}
                    height={28}
                    alt=""
                  />
                  Open in {w.name}
                  <ArrowUpRight size={18} />
                </a>
              ))}
            {listed.map((c) => (
              <button
                className="wallet-row"
                key={c.uid}
                disabled={isPending}
                onClick={() => connect(c)}
              >
                {c.icon ? (
                  <img src={c.icon} width={28} height={28} alt="" />
                ) : /coinbase/i.test(c.id) ? (
                  <img
                    src="./wallets/coinbase.svg"
                    width={28}
                    height={28}
                    alt=""
                  />
                ) : (
                  <Globe size={28} />
                )}
                <span>
                  {label(c)}
                  {isPending && variables?.connector === c ? " · opening…" : ""}
                </span>
                <ArrowUpRight size={18} />
              </button>
            ))}
          </div>
        )}
        <p className="inline-error" role="status">
          {error}
        </p>
        <p className="small muted wallet-foot">
          Your keys stay in your wallet. PLEA never asks for a seed phrase.
        </p>
      </Modal>
    </>
  );
}
