import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const addToast = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Invalid email address"); return; }
    
    setError("");
    setLoading(true);
    
    try {
      await api.requestPasswordReset(email);
      setSent(true);
      addToast("Verification code sent to your email", "success");
    } catch (err) {
      setError(err.message || "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  const goToOtp = () => {
    navigate("/verify-otp", { state: { email, from: "forgot" } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center auth-gradient px-6 py-12">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Link to="/login" className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface mb-8 group">
          <Icon name="arrow_back" className="text-base transition-transform group-hover:-translate-x-1" />
          Back to sign in
        </Link>

        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-8 shadow-glass">
          {!sent ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6">
                <Icon name="lock_reset" className="text-secondary text-3xl" />
              </div>

              <h1 className="text-2xl font-headline font-extrabold tracking-tight mb-2">Forgot your password?</h1>
              <p className="text-on-surface-variant text-sm mb-8">
                No worries. Enter your email and we&apos;ll send you a verification code to reset it.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Email address</label>
                  <div className="relative">
                    <Icon name="mail" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg" />
                    <Input
                      type="email"
                      placeholder="you@workshop.com"
                      className={`pl-11 ${error ? "border-error ring-error/30 ring-2" : ""}`}
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    />
                  </div>
                  {error && <p className="text-error text-xs mt-1 flex items-center gap-1"><Icon name="error" className="text-xs" />{error}</p>}
                </div>

                <Button type="submit" variant="secondary" className="w-full h-12 rounded-lg text-base" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Icon name="progress_activity" className="text-lg animate-spin" />
                      Sending code...
                    </span>
                  ) : (
                    "Send verification code"
                  )}
                </Button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <Icon name="mark_email_read" className="text-green-600 text-4xl" />
                </motion.div>
              </div>

              <h2 className="text-2xl font-headline font-extrabold mb-2">Check your email</h2>
              <p className="text-on-surface-variant text-sm mb-2">
                We&apos;ve sent a 6-digit verification code to
              </p>
              <p className="font-mono text-sm font-semibold bg-surface-container-low px-3 py-1.5 rounded-lg inline-block mb-6">
                {email}
              </p>

              <Button variant="secondary" className="w-full h-12 rounded-lg text-base mb-4" onClick={goToOtp}>
                Enter verification code
                <Icon name="arrow_forward" className="text-base ml-1" />
              </Button>

              <button
                className="text-sm text-on-surface-variant hover:text-secondary transition-colors"
                onClick={() => {
                  addToast("Code resent!", "success");
                }}
              >
                Didn&apos;t receive the code? <span className="font-semibold text-secondary">Resend</span>
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
