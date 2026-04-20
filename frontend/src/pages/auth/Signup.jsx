import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth";

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { signup } = useAuth();
  const intent = location.state?.intent;
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", vehicle: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);

  const validate1 = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email address";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validate2 = () => {
    const e = {};
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Must be at least 8 characters";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) e.password = "Must include uppercase, lowercase, and number";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (validate1()) setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate2()) return;
    setLoading(true);
    try {
      await signup({
        fullName: form.name,
        email: form.email,
        password: form.password,
        vehicleModel: form.vehicle || null,
      });
      toast("Account created successfully!", "success");
      if (intent === "booking") {
        navigate("/customer/booking");
      } else {
        navigate("/customer");
      }
    } catch (err) {
      toast(err.message || "Registration failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[a-z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ["", "Very weak", "Weak", "Fair", "Strong", "Very strong"][strength];
  const strengthColor = ["", "bg-error", "bg-error", "bg-yellow-500", "bg-green-500", "bg-green-600"][strength];

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
            Create your
            <br />
            <span className="text-secondary">customer account.</span>
          </h3>

          <p className="text-white/50 text-lg leading-relaxed mb-12">
            Book motor service appointments faster, track progress live, and keep all your service history in one place.
          </p>

          <div className="space-y-6">
            {[
              { val: "2 min", label: "Account setup time" },
              { val: "24/7", label: "Booking access" },
              { val: "0", label: "Booking fees" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                className="flex items-baseline gap-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <span className="text-3xl font-headline font-extrabold text-white">{item.val}</span>
                <span className="text-white/40 text-sm">{item.label}</span>
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
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center text-white">
              <Icon name="precision_manufacturing" filled />
            </div>
            <span className="font-headline font-extrabold text-lg">Precision Parts</span>
          </div>

          <h1 className="text-3xl font-headline font-extrabold tracking-tight mb-2">Create your account</h1>
          <p className="text-on-surface-variant mb-8">
            Already have an account?{" "}
            <Link to="/login" className="text-secondary font-semibold hover:underline">Sign in</Link>
          </p>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? "bg-secondary text-on-secondary" : "bg-surface-container-high text-on-surface-variant"}`}>
                  {step > s ? <Icon name="check" className="text-sm" /> : s}
                </div>
                <span className={`text-xs font-semibold ${step >= s ? "text-on-surface" : "text-on-surface-variant"}`}>
                  {s === 1 ? "Your info" : "Security"}
                </span>
                {s < 2 && <div className={`w-12 h-px ${step > 1 ? "bg-secondary" : "bg-outline-variant"}`} />}
              </div>
            ))}
          </div>

          {step === 1 ? (
            <form onSubmit={handleNext} className="space-y-5">
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Full name</label>
                <div className="relative">
                  <Icon name="person" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg" />
                  <Input
                    placeholder="John Smith"
                    className={`pl-10 ${errors.name ? "border-error ring-error/30 ring-2" : ""}`}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                {errors.name && <p className="text-error text-xs mt-1 flex items-center gap-1"><Icon name="error" className="text-xs" />{errors.name}</p>}
              </div>

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
                <label className="text-sm font-semibold mb-1.5 block">Vehicle model <span className="text-on-surface-variant font-normal">(optional)</span></label>
                <div className="relative">
                  <Icon name="directions_car" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg" />
                  <Input
                    placeholder="Honda City 2022"
                    className="pl-10"
                    value={form.vehicle}
                    onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
                  />
                </div>
              </div>

              <Button type="submit" variant="secondary" className="w-full h-12 rounded-lg text-base">
                Continue
                <Icon name="arrow_forward" className="text-base ml-1" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Password</label>
                <div className="relative">
                  <Icon name="lock" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg" />
                  <Input
                    type={showPw ? "text" : "password"}
                    placeholder="Create a strong password"
                    className={`pl-10 pr-10 ${errors.password ? "border-error ring-error/30 ring-2" : ""}`}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
                    <Icon name={showPw ? "visibility_off" : "visibility"} className="text-lg" />
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : "bg-outline-variant/30"}`} />
                      ))}
                    </div>
                    <p className="text-xs text-on-surface-variant">{strengthLabel}</p>
                  </div>
                )}
                {errors.password && <p className="text-error text-xs mt-1 flex items-center gap-1"><Icon name="error" className="text-xs" />{errors.password}</p>}
              </div>

              <div>
                <label className="text-sm font-semibold mb-1.5 block">Confirm password</label>
                <div className="relative">
                  <Icon name="lock" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg" />
                  <Input
                    type={showPw ? "text" : "password"}
                    placeholder="Re-enter your password"
                    className={`pl-10 ${errors.confirm ? "border-error ring-error/30 ring-2" : ""}`}
                    value={form.confirm}
                    onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  />
                </div>
                {errors.confirm && <p className="text-error text-xs mt-1 flex items-center gap-1"><Icon name="error" className="text-xs" />{errors.confirm}</p>}
              </div>

              <div className="flex items-start gap-3">
                <input type="checkbox" id="terms" className="mt-1 rounded border-outline-variant text-secondary focus:ring-secondary" required />
                <label htmlFor="terms" className="text-sm text-on-surface-variant">
                  I agree to the{" "}
                  <Link to="/info/terms" className="text-secondary hover:underline">Terms of Service</Link> and{" "}
                  <Link to="/info/privacy" className="text-secondary hover:underline">Privacy Policy</Link>
                </label>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="h-12 rounded-lg px-6" onClick={() => setStep(1)}>
                  <Icon name="arrow_back" className="text-base" />
                  Back
                </Button>
                <Button type="submit" variant="secondary" className="flex-1 h-12 rounded-lg text-base" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Icon name="progress_activity" className="text-lg animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    "Create account"
                  )}
                </Button>
              </div>
            </form>
          )}

          {step === 1 && (
            <>
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant/50" /></div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-4 text-xs text-on-surface-variant uppercase tracking-wider">or continue with</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-11 rounded-lg gap-2" onClick={() => toast("Google SSO coming soon", "info")}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Google
                </Button>
                <Button variant="outline" className="h-11 rounded-lg gap-2" onClick={() => toast("Microsoft SSO coming soon", "info")}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="13" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="13" width="10" height="10" fill="#00A4EF"/><rect x="13" y="13" width="10" height="10" fill="#FFB900"/></svg>
                  Microsoft
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
