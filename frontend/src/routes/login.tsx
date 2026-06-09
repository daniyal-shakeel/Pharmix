import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/store";
import type { Role } from "@/types";
import { Pill, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import api from "@/api/base";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Pharmix" }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);

  useEffect(() => {
    if (user) {
      navigate({ to: "/app/dashboard" });
    }
  }, [user, navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>("admin");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fullEmail = email.includes("@") ? email : `${email}@pharmix.com`;
      const response = await api.post("/auth/login", { email: fullEmail, password, role });
      const { user, token } = response.data;

      localStorage.setItem("_phx_token", token);

      useAuth.setState({ token, user });

      toast.success("Login successful");
      navigate({ to: "/app/dashboard" });
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Invalid credentials or role mismatch. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-canvas items-center justify-center p-6">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-8">
          <div className="flex justify-center mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-primary/15 border border-primary/30 grid place-items-center">
                <Pill className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xl font-semibold tracking-tight">Pharmix</span>
            </Link>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Enter your credentials to access your workspace.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">
                Email
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 bg-surface border-border pr-24"
                  placeholder="username"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground pointer-events-none bg-surface-2 px-1.5 py-0.5 rounded border border-border">
                  @pharmix.com
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 bg-surface border-border pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role" className="text-xs">
                Role
              </Label>
              <Select value={role} onValueChange={(val) => setRole(val as Role)}>
                <SelectTrigger id="role" className="h-10 bg-surface border-border">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manufacturer">Manufacturer</SelectItem>
                  <SelectItem value="pharmacy">Pharmacy</SelectItem>
                  <SelectItem value="delivery">Delivery Partner</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 mt-2 bg-primary hover:bg-primary/90 text-sm font-medium"
            >
              {loading ? "Authenticating..." : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
