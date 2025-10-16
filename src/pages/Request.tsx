import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const Request = () => {
  const [username, setUsername] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const handleRequest = async () => {
    if (!username || !amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);

    try {
      // Get recipient by username
      const { data: recipientData, error: recipientError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.replace('@', ''))
        .single();

      if (recipientError || !recipientData) {
        toast.error("User not found");
        setLoading(false);
        return;
      }

      // Create transaction request
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          from_user_id: recipientData.id,
          to_user_id: user?.id,
          amount: amountNum,
          type: 'request',
          status: 'pending',
          note: note || null
        });

      if (txError) {
        toast.error("Failed to create request");
        console.error(txError);
      } else {
        toast.success(`Requested $${amount} from @${username}!`);
        setUsername("");
        setAmount("");
        setNote("");
        navigate("/dashboard");
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
          <h1 className="text-xl font-semibold text-white">Request Money</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Card className="p-6 bg-slate-800/50 border-slate-700">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-300">Request from</Label>
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

            <div className="space-y-2">
              <Label htmlFor="note" className="text-slate-300">Note (optional)</Label>
              <Textarea
                id="note"
                placeholder="What's this for?"
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-purple-500"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              size="lg"
              onClick={handleRequest}
              disabled={loading}
            >
              <DollarSign className="mr-2 w-4 h-4" />
              {loading ? "Requesting..." : `Request $${amount || "0.00"}`}
            </Button>

            <div className="text-sm text-slate-400 text-center p-4 bg-slate-700/30 rounded-lg border border-slate-600">
              <p className="font-medium text-slate-300">📱 Notification</p>
              <p>They'll receive a notification about your request</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Request;
