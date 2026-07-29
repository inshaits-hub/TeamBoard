import { useState } from "react";
import { LayoutGrid, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

interface LoginPageProps {
  onSuccess?: () => void;
}

// Forest Green #465E20 only — used at varying tints/shades for hierarchy

export function LoginPage({ onSuccess }: LoginPageProps) {
  const { login, signup } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let success: boolean;
      if (isSignUp) {
        if (!name.trim()) {
          setError("Please enter your name");
          setLoading(false);
          return;
        }
        success = await signup(name.trim(), email.trim(), password);
      } else {
        success = await login(email.trim(), password);
      }

      if (success) {
        onSuccess?.();
      } else {
        setError("Invalid credentials. Try alice@team.com");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-app-bg px-4">
      {/* Animated background orbs — sage / olive / gold */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-72 w-72 animate-pulse rounded-full bg-[#465E20]/25 blur-3xl dark:bg-[#465E20]/20" />
        <div className="absolute -right-32 -bottom-32 h-80 w-80 animate-pulse rounded-full bg-[#465E20]/20 blur-3xl dark:bg-[#465E20]/15" style={{ animationDelay: "1s" }} />
        <div className="absolute left-1/3 top-1/2 h-60 w-60 -translate-y-1/2 animate-pulse rounded-full bg-[#465E20]/15 blur-3xl dark:bg-[#465E20]/10" style={{ animationDelay: "2s" }} />
      </div>

      {/* Glass card */}
      <div className="relative w-full max-w-md">
        <div
          className="
          rounded-3xl
          border
          border-[#465E20]/25
          bg-[#465E20]/5
          p-8
          shadow-[0_15px_40px_rgba(70,94,32,0.15)]
          backdrop-blur-2xl
          transition-all
          duration-300
          dark:border-[#465E20]/50
          dark:bg-[#1F2918]/80
          "
        >
          {/* Logo */}
          <div className="mb-6 flex flex-col items-center gap-2">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#465E20] to-[#6E8A3E] shadow-lg">
              <LayoutGrid className="h-7 w-7 text-white" />
            </div>
            <h1 className="mt-2 text-2xl font-bold text-[#2C381F] dark:text-[#F8F3E6]">
              Team Task Board
            </h1>
            <p className="text-sm text-[#465E20]/70 dark:text-[#A9BFA0]">
              {isSignUp ? "Create your team account" : "Sign in to your account"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="grid gap-2">
                <Label htmlFor="signup-name" className="text-sm font-medium text-app-card-foreground">
                  Full Name
                </Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="
                  h-11
                  rounded-xl
                  border
                  border-[#465E20]/30
                  bg-[#465E20]/5
                  text-[#2C381F]
                  placeholder:text-[#465E20]/40
                  backdrop-blur-sm
                  transition-all
                  duration-300
                  focus-visible:border-[#465E20]
                  focus-visible:ring-2
                  focus-visible:ring-[#465E20]/40
                  dark:border-[#465E20]/50
                  dark:bg-[#2C381F]/80
                  dark:text-[#F8F3E6]
                  "
                  required
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="login-email" className="text-sm font-medium text-app-card-foreground">
                Email
              </Label>
              <Input
                id="login-email"
                type="email"
                placeholder="alice@team.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="
                h-11
                rounded-xl
                border
                border-[#465E20]/30
                bg-[#465E20]/5
                text-[#2C381F]
                placeholder:text-[#465E20]/40
                backdrop-blur-sm
                transition-all
                duration-300
                focus-visible:border-[#465E20]
                focus-visible:ring-2
                focus-visible:ring-[#465E20]/40
                dark:border-[#465E20]/50
                dark:bg-[#2C381F]/80
                dark:text-[#F8F3E6]
                "
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="login-password" className="text-sm font-medium text-app-card-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="
                  h-11
                  rounded-xl
                  border
                  border-[#465E20]/30
                  bg-[#465E20]/5
                  pr-10
                  text-[#2C381F]
                  placeholder:text-[#465E20]/40
                  backdrop-blur-sm
                  transition-all
                  duration-300
                  focus-visible:border-[#465E20]
                  focus-visible:ring-2
                  focus-visible:ring-[#465E20]/40
                  dark:border-[#465E20]/50
                  dark:bg-[#2C381F]/80
                  dark:text-[#F8F3E6]
                  "
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#465E20]/60 transition-colors hover:text-[#465E20] dark:text-[#A9BFA0]/70 dark:hover:text-[#F8F3E6]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-xl bg-[#465E20]/10 px-3 py-2 text-xs text-[#465E20] dark:bg-[#465E20]/20 dark:text-[#A9BFA0]">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-xl bg-[#2C381F] text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:bg-[#232D19] hover:shadow-xl focus-visible:ring-2 focus-visible:ring-[#465E20]/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  {isSignUp ? "Creating account..." : "Signing in..."}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {isSignUp ? "Create Account" : "Sign In"}
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="text-xs text-[#465E20]/70 underline underline-offset-2 transition-colors hover:text-[#465E20] dark:text-[#A9BFA0]/80 dark:hover:text-[#F8F3E6]"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>

          
        </div>
      </div>
    </div>
  );
}