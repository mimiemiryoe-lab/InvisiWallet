import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap, Users } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      {/* Hero Section */}
      <header className="container mx-auto px-4 pt-20 pb-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-block px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
            Next-Gen Crypto Payments
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Send money like{" "}
            <span className="bg-gradient-to-r from-primary to-[hsl(220,90%,56%)] bg-clip-text text-transparent">
              Venmo
            </span>
            <br />
            with crypto security
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            No addresses. No gas fees. No seed phrases. Just send money to a username 
            and we handle the rest on Starknet.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" variant="gradient" className="text-lg" asChild>
              <Link to="/signup">
                Get Started <ArrowRight className="ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-card p-8 rounded-2xl shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-all">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Instant Transfers</h3>
            <p className="text-muted-foreground">
              Send money to any username instantly. No waiting for confirmations.
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-all">
            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Self-Custody</h3>
            <p className="text-muted-foreground">
              Your keys, your crypto. Full control without the complexity.
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-all">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Social Payments</h3>
            <p className="text-muted-foreground">
              Pay friends using usernames. It's that simple.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-primary to-[hsl(220,90%,56%)] rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to send money invisibly?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands using the easiest way to send crypto
          </p>
          <Button size="lg" variant="secondary" className="text-lg" asChild>
            <Link to="/signup">
              Create Account <ArrowRight className="ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Landing;
