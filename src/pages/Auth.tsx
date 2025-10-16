import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const Auth = ({ mode }: { mode: "login" | "signup" }) => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || (mode === "signup" && !username)) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await signUp(email, password, username);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Please sign in instead.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Account created! Welcome to InvisiWallet!");
          navigate("/dashboard");
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Welcome back!");
          navigate("/dashboard");
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-[hsl(220,90%,56%)] bg-clip-text text-transparent mb-2">
            InvisiWallet
          </h1>
          <p className="text-muted-foreground">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </p>
          {mode === "signup" && (
            <div className="mt-4 text-left text-sm bg-secondary/40 rounded-md p-3">
              <p className="font-medium mb-1">What happens on sign up?</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>We create your Invisible Wallet via ChiPay (server‑side).</li>
                <li>Your Starknet address is saved to your profile.</li>
                <li>You can send by @username without seeing gas or addresses.</li>
              </ul>
            </div>
          )}
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-4" noValidate>
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  @
                </span>
                <Input
                  id="username"
                  placeholder="yourname"
                  className="pl-7"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="button" onClick={handleSubmit} className="w-full" size="lg" variant="gradient" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </Card>
    </div>
  );
};

export default Auth;
