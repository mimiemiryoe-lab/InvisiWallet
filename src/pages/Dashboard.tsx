import { Button } from "@/components/ui/button";
import WalletConnect from "@/components/WalletConnect";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, ArrowDownLeft, Eye, EyeOff, Wallet, User, Users, Activity, Database, Link as LinkIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { useStarknet } from "@/contexts/StarknetContext";
import { RpcProvider } from "starknet";

interface Transaction {
  id: string;
  amount: number;
  transaction_type?: 'send' | 'receive' | 'request';
  status: string;
  created_at: string;
  from_user?: { username: string } | null;
  to_user?: { username: string } | null;
}

const Dashboard = () => {
  const [showBalance, setShowBalance] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [blockchainTransactions, setBlockchainTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<Array<{ id: string; username: string }>>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { privacyEnabled, togglePrivacy } = usePrivacy();
  const { isConnected, address } = useStarknet();
  const [onchainBalance, setOnchainBalance] = useState<string | null>(null);
  const [onchainBalanceUSD, setOnchainBalanceUSD] = useState<string | null>(null);
  const [tokenPrice, setTokenPrice] = useState<number | null>(null);
  const tokenSymbol = "STRK";

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch wallet balance
        const { data: walletData, error: walletError } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', user.id)
          .maybeSingle();

        if (walletError) {
          console.error('Error fetching wallet:', walletError);
        }
        setBalance(walletData?.balance ?? 0);

        // Fetch transactions with user information
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select(`
            id, 
            amount, 
            transaction_type, 
            status, 
            created_at,
            from_user_id,
            to_user_id,
            from_user:profiles!from_user_id(username),
            to_user:profiles!to_user_id(username)
          `)
          .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(10);

        if (txError) {
          console.error('Error fetching transactions:', txError);
          toast.error('Failed to load transactions');
        } else {
          setTransactions((txData || []) as any);
        }

        // Fetch friends (all users except me)
        const { data: friendsData, error: friendsErr } = await supabase
          .from('profiles')
          .select('id, username')
          .neq('id', user.id)
          .order('username', { ascending: true })
          .limit(20);
        if (friendsErr) {
          console.error('Error fetching users:', friendsErr);
        } else {
          setFriends((friendsData || []) as any);
        }

        // Fetch blockchain transactions (transactions with tx_hash)
        const { data: blockchainTxData, error: blockchainTxError } = await supabase
          .from('transactions')
          .select(`
            id, 
            amount, 
            transaction_type, 
            status, 
            created_at,
            tx_hash,
            from_user_id,
            to_user_id,
            from_user:profiles!from_user_id(username),
            to_user:profiles!to_user_id(username)
          `)
          .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
          .not('tx_hash', 'is', null)
          .order('created_at', { ascending: false })
          .limit(10);

        if (blockchainTxError) {
          console.error('Error fetching blockchain transactions:', blockchainTxError);
        } else {
          setBlockchainTransactions((blockchainTxData || []) as any);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  // Fetch token price
  useEffect(() => {
    const fetchTokenPrice = async () => {
      try {
        // For STRK token, fetch from CoinGecko
        if (tokenSymbol === 'STRK') {
          const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=starknet&vs_currencies=usd');
          const data = await response.json();
          const price = data?.starknet?.usd;
          if (price) {
            setTokenPrice(price);
          }
        } else if (tokenSymbol === 'ETH') {
          const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
          const data = await response.json();
          const price = data?.ethereum?.usd;
          if (price) {
            setTokenPrice(price);
          }
        }
        // Add other tokens as needed
      } catch (error) {
        console.error('Error fetching token price:', error);
      }
    };

    fetchTokenPrice();
    // Refresh price every 60 seconds
    const interval = setInterval(fetchTokenPrice, 60000);
    return () => clearInterval(interval);
  }, [tokenSymbol]);

  useEffect(() => {
    // Fetch on-chain ERC20 balance using dedicated RPC provider
    const fetchChainBalance = async () => {
      try {
        const defaultStrk = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
        const tokenAddress = defaultStrk;
        const rpcUrl = "https://starknet-sepolia.public.blastapi.io/rpc/v0_9";
        const decimals = 18;
        
        if (!isConnected || !address) {
          setOnchainBalance(null);
          setOnchainBalanceUSD(null);
          return;
        }
        
        const provider = new RpcProvider({ nodeUrl: rpcUrl });
        let res: any;
        
        try {
          res = await provider.callContract(
            { 
              contractAddress: tokenAddress, 
              entrypoint: 'balance_of', 
              calldata: [address] 
            },
            'latest'
          );
        } catch {
          res = await provider.callContract(
            { 
              contractAddress: tokenAddress, 
              entrypoint: 'balanceOf', 
              calldata: [address] 
            },
            'latest'
          );
        }
        
        let low: any;
        let high: any;
        const out = (res.result || res);
        
        if (Array.isArray(out)) {
          [low, high] = out;
        } else if (out?.low !== undefined) {
          low = out.low; high = out.high;
        } else if (out?.balance || out?.amount) {
          const named = out.balance || out.amount;
          if (Array.isArray(named)) {
            [low, high] = named;
          } else if (named?.low !== undefined) {
            low = named.low; high = named.high;
          } else {
            low = named; high = 0;
          }
        } else if (out) {
          low = out; high = 0;
        }
        
        const toBigInt = (v: any) => typeof v === 'string' ? BigInt(v) : BigInt(v ?? 0);
        const value = toBigInt(low) + (toBigInt(high) << 128n);
        const amount = Number(value) / Math.pow(10, decimals);
        setOnchainBalance(amount.toLocaleString(undefined, { maximumFractionDigits: 6 }));
        
        // Calculate USD value
        if (tokenPrice !== null) {
          const usdValue = amount * tokenPrice;
          setOnchainBalanceUSD(usdValue.toFixed(2));
        }
        
      } catch (e) {
        console.error('Error fetching on-chain balance:', e);
        setOnchainBalance(null);
        setOnchainBalanceUSD(null);
      }
    };
    
    fetchChainBalance();
  }, [isConnected, address, tokenPrice]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            InvisiWallet
          </h1>
          <div className="flex items-center gap-2">
            <WalletConnect />
            <Button variant="ghost" asChild className="text-slate-300 hover:bg-slate-800">
              <Link to="/profile">Profile</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Balance Card */}
        <Card className="p-8 mb-8 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white shadow-2xl border-0">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-sm opacity-90 mb-2">Total Balance</p>
              <div className="flex items-center gap-3">
              {onchainBalanceUSD && (
                    <h2 className="text-4xl font-bold">
                      {privacyEnabled ? "$••••" : `≈ $${onchainBalanceUSD} USD`}
                    </h2>
                  )}
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="opacity-80 hover:opacity-100 transition-opacity"
                >
                  {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {onchainBalance && (
                <div className="mt-3 space-y-1">
                  <p className="text-sm opacity-90">
                    On-chain: {privacyEnabled ? "••••" : onchainBalance} {tokenSymbol}
                  </p>
                 
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1 bg-white/20 hover:bg-white/30 text-white border-white/30" asChild>
              <Link to="/send">
                <ArrowUpRight className="mr-2 w-4 h-4" />
                Send
              </Link>
            </Button>
            <Button variant="secondary" className="flex-1 bg-white/20 hover:bg-white/30 text-white border-white/30" asChild>
              <Link to="/request">
                <ArrowDownLeft className="mr-2 w-4 h-4" />
                Request
              </Link>
            </Button>
            <Button variant="secondary" className="flex-1 bg-white/20 hover:bg-white/30 text-white border-white/30" onClick={togglePrivacy}>
              <Eye className="mr-2 w-4 h-4" />
              {privacyEnabled ? "Privacy: On" : "Privacy: Off"}
            </Button>
          </div>
        </Card>

        {/* Friends */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Friends
          </h3>
          {friends.length === 0 ? (
            <Card className="p-6 text-center bg-slate-800/50 border-slate-700">
              <p className="text-slate-400">No friends yet</p>
            </Card>
          ) : (
            <Card className="p-4 bg-slate-800/50 border-slate-700">
              <div className="space-y-2">
                {friends.map((f) => (
                  <div key={f.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-b-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-sm text-purple-300">@</div>
                      <span className="font-medium text-white">{f.username}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="secondary" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => navigate(`/send?to=${encodeURIComponent(f.username)}`)}>Send</Button>
                      <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700" onClick={() => navigate(`/request?from=${encodeURIComponent(f.username)}`)}>Request</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Recent Activity */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity
          </h3>
          
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border-slate-700">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                All Transactions
              </TabsTrigger>
              <TabsTrigger value="blockchain" className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                On-Chain
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              {loading ? (
                <div className="text-center text-slate-400 py-8">Loading...</div>
              ) : transactions.length === 0 ? (
                <Card className="p-8 text-center bg-slate-800/50 border-slate-700">
                  <p className="text-slate-400">No transactions yet</p>
                  <p className="text-sm text-slate-500 mt-2">Send or request money to get started</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => {
                    const ttype = (tx as any).transaction_type as 'send' | 'receive' | 'request' | undefined;
                    const isReceived = ttype === 'receive';
                    const displayUsername = isReceived 
                      ? ((tx as any).from_user?.username ? `@${(tx as any).from_user.username}` : 'Unknown')
                      : ((tx as any).to_user?.username ? `@${(tx as any).to_user.username}` : 'Unknown');
                    const displayAmount = ttype === 'receive' ? tx.amount : -tx.amount;
                    const timeAgo = new Date(tx.created_at).toLocaleDateString();

                    return (
                      <Card key={tx.id} className="p-4 bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              ttype === "receive" ? "bg-green-500/20" : "bg-purple-500/20"
                            }`}>
                              {ttype === "receive" ? (
                                <ArrowDownLeft className="w-5 h-5 text-green-400" />
                              ) : (
                                <ArrowUpRight className="w-5 h-5 text-purple-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-white">{privacyEnabled ? "@••••••" : displayUsername}</p>
                              <p className="text-sm text-slate-400">{timeAgo}</p>
                            </div>
                          </div>
                          <div className={`text-lg font-semibold ${
                            ttype === "receive" ? "text-green-400" : "text-purple-400"
                          }`}>
                            {privacyEnabled ? "$••••" : `${displayAmount > 0 ? "+" : ""}$${Math.abs(displayAmount).toFixed(2)}`}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="blockchain" className="mt-4">
              {loading ? (
                <div className="text-center text-slate-400 py-8">Loading...</div>
              ) : blockchainTransactions.length === 0 ? (
                <Card className="p-8 text-center bg-slate-800/50 border-slate-700">
                  <p className="text-slate-400">No on-chain transactions yet</p>
                  <p className="text-sm text-slate-500 mt-2">Connect your wallet and send tokens to see blockchain transactions</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {blockchainTransactions.map((tx) => {
                    const ttype = (tx as any).transaction_type as 'send' | 'receive' | 'request' | undefined;
                    const isReceived = ttype === 'receive';
                    const displayUsername = isReceived 
                      ? ((tx as any).from_user?.username ? `@${(tx as any).from_user.username}` : 'Unknown')
                      : ((tx as any).to_user?.username ? `@${(tx as any).to_user.username}` : 'Unknown');
                    const displayAmount = ttype === 'receive' ? tx.amount : -tx.amount;
                    const timeAgo = new Date(tx.created_at).toLocaleDateString();
                    const txHash = (tx as any).tx_hash;

                    return (
                      <Card key={tx.id} className="p-4 bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              ttype === "receive" ? "bg-green-500/20" : "bg-purple-500/20"
                            }`}>
                              {ttype === "receive" ? (
                                <ArrowDownLeft className="w-5 h-5 text-green-400" />
                              ) : (
                                <ArrowUpRight className="w-5 h-5 text-purple-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-white">{privacyEnabled ? "@••••••" : displayUsername}</p>
                              <p className="text-sm text-slate-400">{timeAgo}</p>
                              {txHash && (
                                <p className="text-xs text-blue-400 font-mono">
                                  {privacyEnabled ? "••••••••" : `${txHash.slice(0, 8)}...${txHash.slice(-8)}`}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className={`text-lg font-semibold ${
                            ttype === "receive" ? "text-green-400" : "text-purple-400"
                          }`}>
                            {privacyEnabled ? "$••••" : `${displayAmount > 0 ? "+" : ""}$${Math.abs(displayAmount).toFixed(2)}`}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;