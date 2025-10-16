import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Account, Call, Provider, RpcProvider, Uint256, uint256 } from "starknet";

interface StarknetContextType {
  isConnected: boolean;
  address: string | null;
  chainId: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendToken: (params: { tokenAddress: string; to: string; amountDecimals: string }) => Promise<string>;
}

const StarknetContext = createContext<StarknetContextType | undefined>(undefined);

// Minimal ERC20 transfer calldata helper
function toUint256FromDecimals(decimalsAmount: string): Uint256 {
  // expect a decimal string; assume 18 decimals and convert by multiplying
  // by 10^18 using bigint to avoid floating precision
  // decimalsAmount like "0.01" or "1"
  const [whole, frac = ""] = decimalsAmount.split(".");
  const fracPadded = (frac + "000000000000000000").slice(0, 18);
  const asStr = `${whole}${fracPadded}`.replace(/^0+/, "");
  const value = BigInt(asStr.length ? asStr : "0");
  return uint256.bnToUint256(value);
}

export const StarknetProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const accountRef = useRef<Account | null>(null);
  const providerRef = useRef<Provider | null>(null);

  useEffect(() => {
    // Create a default public provider for read-only calls
    // default to sepolia if VITE_STARKNET_RPC not provided
    const rpcUrl = import.meta.env.VITE_STARKNET_RPC as string | undefined;
    providerRef.current = new RpcProvider({ nodeUrl: rpcUrl || "https://starknet-sepolia.public.blastapi.io/rpc/v0_7" });
  }, []);

  const connect = useCallback(async () => {
    // Prefer standardized injector if available
    const win = window as any;
    const injected = win?.starknet_braavos || win?.starknet_argentX || win?.starknet;
    if (!injected) throw new Error("No Starknet wallet detected. Install Argent X or Braavos.");

    // Some wallets require explicit connect, some expose enable
    let selectedAddress: string | undefined = undefined;
    try {
      if (typeof injected.enable === 'function') {
        const res = await injected.enable({ showModal: true, starknetVersion: 'v5' });
        selectedAddress = res?.selectedAddress || injected.selectedAddress;
      } else if (typeof injected.request === 'function') {
        const res = await injected.request({ type: 'wallet_requestAccounts' });
        selectedAddress = res?.[0] || injected.selectedAddress;
      }
    } catch (err) {
      console.error('Wallet connect error:', err);
      throw err;
    }

    if (!selectedAddress) {
      // Fallback: try reading accounts list if exposed
      const accs = injected?.accounts || [];
      selectedAddress = accs[0] || injected?.selectedAddress;
    }
    if (!selectedAddress) throw new Error("Failed to get selected address from wallet");

    // Use injected.account if present; otherwise construct Account with provider + signer
    const acc: Account = injected.account ?? new Account(providerRef.current as Provider, selectedAddress, injected);
    accountRef.current = acc;
    setAddress(selectedAddress);
    setIsConnected(true);
    try {
      const net = await (providerRef.current as Provider).getChainId();
      setChainId(typeof net === "string" ? net : (net as any).toString());
    } catch {
      setChainId(null);
    }
  }, []);

  const disconnect = useCallback(() => {
    accountRef.current = null;
    setAddress(null);
    setIsConnected(false);
  }, []);

  const sendToken = useCallback(async ({ tokenAddress, to, amountDecimals }: { tokenAddress: string; to: string; amountDecimals: string }) => {
    if (!accountRef.current) throw new Error("Wallet not connected");
    const amount: Uint256 = toUint256FromDecimals(amountDecimals);
    const calls: Call = {
      contractAddress: tokenAddress,
      entrypoint: "transfer",
      calldata: [to, amount.low, amount.high],
    };
    const { transaction_hash } = await accountRef.current.execute(calls);
    return transaction_hash;
  }, []);

  const value = useMemo<StarknetContextType>(() => ({
    isConnected,
    address,
    chainId,
    connect,
    disconnect,
    sendToken,
  }), [isConnected, address, chainId, connect, disconnect, sendToken]);

  return (
    <StarknetContext.Provider value={value}>{children}</StarknetContext.Provider>
  );
};

export const useStarknet = () => {
  const ctx = useContext(StarknetContext);
  if (!ctx) throw new Error("useStarknet must be used within a StarknetProvider");
  return ctx;
};


