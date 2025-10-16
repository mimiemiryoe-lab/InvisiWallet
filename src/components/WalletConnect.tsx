import { Button } from "@/components/ui/button";
import { useStarknet } from "@/contexts/StarknetContext";

const WalletConnect = () => {
  const { isConnected, address, connect, disconnect } = useStarknet();

  return (
    <div className="flex items-center gap-2">
      {isConnected ? (
        <>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
          <Button variant="outline" size="sm" onClick={disconnect}>Disconnect</Button>
        </>
      ) : (
        <Button variant="secondary" size="sm" onClick={connect}>Connect Wallet</Button>
      )}
    </div>
  );
};

export default WalletConnect;


