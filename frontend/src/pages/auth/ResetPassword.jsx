import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/toast";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const email = location.state?.email || "user@example.com";

  const [form, setForm] = useState({ password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

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

  const validate = () => {
    const e = {};
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Must be at least 8 characters";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) e.password = "Must include uppercase, lowercase, and number";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      addToast("Password reset successfully!", "success");
    }, 1500);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center auth-gradient px-6 py-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-8 shadow-glass text-center">
            <motion.div
              className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            >
              <Icon name="check_circle" className="text-green-600 text-5xl" />
            </motion.div>

            <h1 className="text-2xl font-headline font-extrabold tracking-tight mb-3">
              Password reset complete
            </h1>
            <p className="text-on-surface-variant text-sm mb-8">
              Your password has been successfully updated. You can now sign in with your new password.
            </p>

            <Link to="/login">
              <Button variant="secondary" className="w-full h-12 rounded-lg text-base">
                Continue to sign in
                <Icon name="arrow_forward" className="text-base ml-1" />
              </Button>
            </Link>

            <motion.div
              className="mt-6 flex items-center justify-center gap-2 text-xs text-on-surface-variant"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Icon name="shield" className="text-green-600 text-sm" />
              Your account is now secured with the new password
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center auth-gradient px-6 py-12">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Link to="/verify-otp" className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface mb-8 group">
          <Icon name="arrow_back" className="text-base transition-transform group-hover:-translate-x-1" />
          Back
        </Link>

        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-8 shadow-glass">
          <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6">
            <Icon name="password" className="text-secondary text-3xl" />
          </div>

          <h1 className="text-2xl font-headline font-extrabold tracking-tight mb-2">Set new password</h1>
          <p className="text-on-surface-variant text-sm mb-2">
            Create a new password for
          </p>
          <p className="font-mono text-sm font-semibold bg-surface-container-low px-3 py-1.5 rounded-lg inline-block mb-8">
            {email}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-semibold mb-1.5 block">New password</label>
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
              <label className="text-sm font-semibold mb-1.5 block">Confirm new password</label>
              <div className="relative">
                <Icon name="lock" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg" />
                <Input
                  type={showPw ? "text" : "password"}
                  placeholder="Re-enter your password"
                  className={`pl-10 ${errors.confirm ? "border-error ring-error/30 ring-2" : ""}`}
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                />
                {form.confirm && form.password === form.confirm && (
                  <Icon name="check_circle" className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-lg" />
                )}
              </div>
              {errors.confirm && <p className="text-error text-xs mt-1 flex items-center gap-1"><Icon name="error" className="text-xs" />{errors.confirm}</p>}
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
              <p className="text-xs font-semibold mb-2">Password requirements:</p>
              <ul className="space-y-1">
                {[
                  { label: "At least 8 characters", met: form.password.length >= 8 },
                  { label: "One uppercase letter", met: /[A-Z]/.test(form.password) },
                  { label: "One lowercase letter", met: /[a-z]/.test(form.password) },
                  { label: "One number", met: /\d/.test(form.password) },
                ].map((r) => (
                  <li key={r.label} className={`flex items-center gap-2 text-xs ${r.met ? "text-green-600" : "text-on-surface-variant"}`}>
                    <Icon name={r.met ? "check_circle" : "radio_button_unchecked"} className="text-xs" />
                    {r.label}
                  </li>
                ))}
              </ul>
            </div>

            <Button type="submit" variant="secondary" className="w-full h-12 rounded-lg text-base" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Icon name="progress_activity" className="text-lg animate-spin" />
                  Resetting password...
                </span>
              ) : (
                "Reset password"
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
