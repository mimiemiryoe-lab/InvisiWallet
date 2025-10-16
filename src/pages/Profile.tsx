import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Copy, Settings } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ username: string; created_at: string } | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, created_at')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  const copyUsername = () => {
    if (profile?.username) {
      navigator.clipboard.writeText(`@${profile.username}`);
      toast.success("Username copied!");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

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
          <h1 className="text-xl font-semibold text-white">Profile</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Card className="p-8 bg-slate-800/50 border-slate-700">
          <div className="flex flex-col items-center mb-8">
            <Avatar className="w-24 h-24 mb-4">
              <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white text-3xl">
                {getInitials(user.email || '')}
              </AvatarFallback>
            </Avatar>
            
            <h2 className="text-2xl font-bold mb-1 text-white">@{profile.username}</h2>
            
            <button
              onClick={copyUsername}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <span>@{profile.username}</span>
              <Copy className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <p className="text-sm text-slate-400 mb-1">Email</p>
              <p className="font-medium text-white">{user.email}</p>
            </div>

            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <p className="text-sm text-slate-400 mb-1">Member since</p>
              <p className="font-medium text-white">{formatDate(profile.created_at)}</p>
            </div>

            <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white" size="lg">
              <Settings className="mr-2 w-4 h-4" />
              Settings
            </Button>

            <Button 
              variant="ghost" 
              className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
