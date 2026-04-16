import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { login } = useAuth();
  const intent = location.state?.intent;
  const from = location.state?.from?.pathname;
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email address";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await login(form.email, form.password);
      toast("Welcome back!", "success");

      // Navigate based on role
      const role = result.role?.toLowerCase();
      if (intent === "booking") {
        navigate("/customer/booking");
      } else if (from && from !== "/login") {
        navigate(from);
      } else {
        const dashboardMap = { admin: "/admin", staff: "/staff", customer: "/customer" };
        navigate(dashboardMap[role] || "/customer");
      }
    } catch (err) {
      toast(err.message || "Invalid email or password", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex auth-gradient">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-on-surface items-center justify-center">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "repeating-linear-gradient(-45deg,transparent,transparent 40px,currentColor 40px,currentColor 41px)" }} />
        <motion.div
          className="relative z-10 max-w-md px-12"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-white">
              <Icon name="precision_manufacturing" filled className="text-2xl" />
            </div>
            <div>
              <h2 className="text-2xl font-headline font-extrabold text-white">Precision Parts</h2>
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Inventory & Service Hub</span>
            </div>
          </div>

          <h3 className="text-4xl font-headline font-extrabold text-white leading-tight mb-6">
            Book your motor
            <br />
            <span className="text-secondary">service smarter.</span>
          </h3>

          <p className="text-white/50 text-lg leading-relaxed mb-12">
            Book appointments, track service progress, and receive maintenance reminders from one app.
          </p>

          <div className="space-y-4">
            {[
              { icon: "event_available", text: "Instant appointment booking" },
              { icon: "schedule", text: "Live service status updates" },
              { icon: "smart_toy", text: "AI-powered maintenance predictions" },
            ].map((item, i) => (
              <motion.div
                key={item.text}
                className="flex items-center gap-3 text-white/60"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <Icon name={item.icon} className="text-secondary text-sm" />
                </div>
                <span className="text-sm">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center text-white">
              <Icon name="precision_manufacturing" filled />
            </div>
            <span className="font-headline font-extrabold text-lg">Precision Parts</span>
          </div>

          <h1 className="text-3xl font-headline font-extrabold tracking-tight mb-2">Welcome back</h1>
          <p className="text-on-surface-variant mb-8">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-secondary font-semibold hover:underline">Sign up</Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Email address</label>
              <div className="relative">
                <Icon name="mail" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className={`pl-10 ${errors.email ? "border-error ring-error/30 ring-2" : ""}`}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              {errors.email && <p className="text-error text-xs mt-1 flex items-center gap-1"><Icon name="error" className="text-xs" />{errors.email}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold">Password</label>
                <Link to="/forgot-password" className="text-xs text-secondary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Icon name="lock" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg" />
                <Input
                  type={showPw ? "text" : "password"}
                  placeholder="Enter your password"
                  className={`pl-10 pr-10 ${errors.password ? "border-error ring-error/30 ring-2" : ""}`}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
                  <Icon name={showPw ? "visibility_off" : "visibility"} className="text-lg" />
                </button>
              </div>
              {errors.password && <p className="text-error text-xs mt-1 flex items-center gap-1"><Icon name="error" className="text-xs" />{errors.password}</p>}
            </div>

            <Button type="submit" variant="secondary" className="w-full h-12 rounded-lg text-base" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Icon name="progress_activity" className="text-lg animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-on-surface-variant">
            By signing in, you agree to our{" "}
            <Link to="/info/terms" className="underline hover:text-on-surface">Terms</Link> and{" "}
            <Link to="/info/privacy" className="underline hover:text-on-surface">Privacy Policy</Link>.
          </p>

          {/* Demo hint */}
          <motion.div
            className="mt-6 p-4 rounded-xl bg-secondary/5 border border-secondary/20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <p className="text-xs text-on-surface-variant">
              <span className="font-semibold text-secondary">Demo credentials:</span>{" "}
              <br />Admin: <code className="text-secondary">admin@precision-parts.com</code> / <code>Demo123!</code>
              <br />Staff: <code className="text-secondary">s.mitchell@precision.com</code> / <code>Demo123!</code>
              <br />Customer: <code className="text-secondary">e.schmidt@email.de</code> / <code>Demo123!</code>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
