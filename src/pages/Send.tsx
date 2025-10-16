import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Send as SendIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useStarknet } from "@/contexts/StarknetContext";
import { openChiPayCheckout } from "@/lib/chipay";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { RpcProvider } from "starknet";

const Send = () => {
  const [username, setUsername] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { isConnected, address, sendToken } = useStarknet();
  const { privacyEnabled } = usePrivacy();
  const [onchainBalance, setOnchainBalance] = useState<string | null>(null);
  const [onchainBalanceUSD, setOnchainBalanceUSD] = useState<string | null>(null);
  const [tokenPrice, setTokenPrice] = useState<number | null>(null);
  const [appBalance, setAppBalance] = useState<number>(0);
  const tokenSymbol = "STRK";
  const navigate = useNavigate();

  const location = useLocation();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
    // Prefill username from query param ?to=
    const params = new URLSearchParams(location.search);
    const to = params.get('to');
    if (to) setUsername(to);
  }, [user, navigate, location.search]);

  // Fetch app balance (same as Dashboard)
  useEffect(() => {
    const fetchAppBalance = async () => {
      if (!user) return;
      try {
        const { data: walletData, error: walletError } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', user.id)
          .maybeSingle();
        if (walletError) {
          console.error('Error fetching wallet:', walletError);
        }
        setAppBalance(walletData?.balance ?? 0);
      } catch (error) {
        console.error('Error:', error);
      }
    };
    fetchAppBalance();
  }, [user]);

  // Price
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        if (tokenSymbol === 'STRK') {
          const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=starknet&vs_currencies=usd');
          const d = await r.json();
          const p = d?.starknet?.usd; if (p) setTokenPrice(p);
        } else if (tokenSymbol === 'ETH') {
          const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
          const d = await r.json();
          const p = d?.ethereum?.usd; if (p) setTokenPrice(p);
        }
      } catch {}
    };
    fetchPrice();
  }, [tokenSymbol]);

  // On-chain balance
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const defaultStrk = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
        const tokenAddress = defaultStrk;
        const rpcUrl = "https://starknet-sepolia.public.blastapi.io/rpc/v0_9";
        const decimals = 18;
        if (!isConnected || !address) { 
          console.log('Not connected or no address:', { isConnected, address });
          setOnchainBalance(null); 
          setOnchainBalanceUSD(null); 
          return; 
        }
        console.log('Fetching balance for:', { address, tokenAddress, rpcUrl });
        const provider = new RpcProvider({ nodeUrl: rpcUrl });
        let res: any;
        try {
          res = await provider.callContract({ contractAddress: tokenAddress, entrypoint: 'balance_of', calldata: [address] }, 'latest');
        } catch (err) {
          console.log('balance_of failed, trying balanceOf:', err);
          try {
            res = await provider.callContract({ contractAddress: tokenAddress, entrypoint: 'balanceOf', calldata: [address] }, 'latest');
          } catch (err2) {
            console.log('balanceOf also failed:', err2);
            throw err2;
          }
        }
        console.log('Balance response:', res);
        const out = (res.result || res);
        let low: any, high: any;
        if (Array.isArray(out)) [low, high] = out; else if (out?.low !== undefined) { low = out.low; high = out.high; }
        else if (out?.balance || out?.amount) { const named = out.balance || out.amount; if (Array.isArray(named)) [low, high] = named; else if (named?.low !== undefined) { low = named.low; high = named.high; } else { low = named; high = 0; } }
        else { low = out; high = 0; }
        const toBigInt = (v: any) => typeof v === 'string' ? BigInt(v) : BigInt(v ?? 0);
        const value = toBigInt(low) + (toBigInt(high) << 128n);
        const amount = Number(value) / Math.pow(10, decimals);
        console.log('Parsed balance:', { amount, decimals, value: value.toString() });
        setOnchainBalance(amount.toLocaleString(undefined, { maximumFractionDigits: 6 }));
        if (tokenPrice !== null) setOnchainBalanceUSD((amount * tokenPrice).toFixed(2));
      } catch (e) {
        console.error('Error fetching on-chain balance:', e);
        setOnchainBalance(null); setOnchainBalanceUSD(null);
      }
    };
    fetchBalance();
  }, [isConnected, address, tokenPrice]);

  const handleSend = async () => {
    if (!username || !amount) {
      toast.error("Please fill in all fields");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);

    try {
      // Get recipient by username (strip @ prefix)
      const cleanUsername = username.replace('@', '');
      console.log('Looking up user:', cleanUsername);
      const { data: recipientData, error: recipientError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', cleanUsername)
        .single();

      if (recipientError || !recipientData) {
        console.error('User lookup error:', recipientError);
        toast.error(`User @${cleanUsername} not found`);
        setLoading(false);
        return;
      }

      // Try on-chain transfer first if both users have Starknet addresses
      let txHash: string | null = null;
      
      // Get sender's Starknet address
      const { data: senderData } = await supabase
        .from('profiles')
        .select('starknet_address')
        .eq('id', user?.id)
        .single();

      // Get recipient's Starknet address  
      const { data: recipientStarknetData } = await supabase
        .from('profiles')
        .select('starknet_address')
        .eq('id', recipientData.id)
        .single();

      if (isConnected && address && senderData?.starknet_address && recipientStarknetData?.starknet_address) {
        const tokenAddress = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
        try {
          // Try backend-sponsored transfer first
          const backendUrl = "http://localhost:8787";
          const resp = await fetch(`${backendUrl}/api/payments/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              fromExternalId: user?.id, 
              toAddress: recipientStarknetData.starknet_address, 
              tokenAddress, 
              amountDecimals: amountNum.toString() 
            })
          });
          if (resp.ok) {
            const json = await resp.json();
            txHash = json?.tx_hash || null;
          }
          
          // Fallback to direct wallet transfer if backend fails
          if (!txHash && tokenAddress) {
            txHash = await sendToken({ 
              tokenAddress, 
              to: recipientStarknetData.starknet_address, 
              amountDecimals: amountNum.toString() 
            });
          }
        } catch (chainErr) {
          console.error('On-chain transfer failed, falling back to off-chain record:', chainErr);
        }
      }

      // Create transaction (status completed if on-chain hash exists, else pending until ChiPay completes)
      const status = txHash ? 'completed' : 'pending';
      const { data: newTx, error: txError } = await supabase
        .from('transactions')
        .insert({
          from_user_id: user?.id,
          to_user_id: recipientData.id,
          amount: amountNum,
          transaction_type: 'send',
          status,
          tx_hash: txHash,
          processor: txHash ? null : 'chipay',
          note: privacyEnabled ? '[private]' : null
        })
        .select('id')
        .single();

      if (txError) {
        toast.error("Failed to send money");
        console.error(txError);
      } else {
        if (txHash) {
          toast.success(`Sent $${amount} on-chain to @${username}!`);
          setUsername("");
          setAmount("");
          navigate("/dashboard");
        } else {
          // Open ChiPay checkout
          const ref = `tx_${newTx?.id}`;
          openChiPayCheckout({ amountUsd: amountNum, reference: ref, email: user?.email || undefined, metadata: { to_username: username } });
          toast.message("Complete payment in ChiPay window", { description: "We will mark it as completed once processed." });
          setUsername("");
          setAmount("");
          navigate("/dashboard");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="text-slate-300 hover:bg-slate-800">
            <Link to="/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold text-white">Send Money</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Card className="p-6 bg-slate-800/50 border-slate-700">
          {/* Balance summary */}
          <div className="mb-6 p-4 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 rounded-lg border border-purple-500/30">
            <div className="text-sm text-purple-300 mb-2">Your Balance</div>
            <div className="flex items-center gap-3">
              {onchainBalanceUSD && (
                <div className="text-lg text-purple-200">{privacyEnabled ? "≈ $••••" : `≈ $${onchainBalanceUSD} USD`}</div>
              )}
            </div>
            {onchainBalance && (
              <div className="text-sm text-purple-300 mt-2">On‑chain: {privacyEnabled ? "••••" : onchainBalance} {tokenSymbol}</div>
            )}
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-300">Send to</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  @
                </span>
                <Input
                  id="username"
                  placeholder="username"
                  className="pl-7 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-purple-500"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-slate-300">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  $
                </span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  className="pl-7 text-2xl font-semibold bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-purple-500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              {[10, 25, 50, 100].map((value) => (
                <Button
                  key={value}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                  onClick={() => setAmount(value.toString())}
                >
                  ${value}
                </Button>
              ))}
            </div>

            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              size="lg"
              onClick={handleSend}
              disabled={loading}
            >
              <SendIcon className="mr-2 w-4 h-4" />
              {loading ? "Sending..." : `Send $${amount || "0.00"}`}
            </Button>

            <div className="text-sm text-slate-400 text-center space-y-2 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
              <p className="font-medium text-slate-300">🚀 Gas Sponsorship</p>
              <p>
                We try to route via our ChiPay paymaster so you don't pay gas. If sponsorship isn't available, we use your connected wallet.
              </p>
              <p>
                Every transfer logs on Starknet (tx hash when on‑chain) or creates a pending ChiPay reference that finalizes via webhook.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Send;
