import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";

const CODE_LENGTH = 6;

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const addToast = useToast();
  const email = location.state?.email || "user@example.com";
  const from = location.state?.from || "forgot";
  const intent = location.state?.intent;

  const [code, setCode] = useState(Array(CODE_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError("");

    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newCode = [...code];
      newCode[index - 1] = "";
      setCode(newCode);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    const newCode = [...code];
    pasted.split("").forEach((ch, i) => { newCode[i] = ch; });
    setCode(newCode);
    const nextIdx = Math.min(pasted.length, CODE_LENGTH - 1);
    inputRefs.current[nextIdx]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otp = code.join("");
    if (otp.length < CODE_LENGTH) { setError("Please enter the complete code"); return; }
    
    setLoading(true);
    setError("");

    try {
      if (from === "signup") {
        // Implementation for signup verification if needed
        addToast("Email verified! Welcome aboard.", "success");
        navigate("/login", { state: { intent } });
      } else {
        await api.verifyOtp({ email, otp });
        addToast("Code verified! Set your new password.", "success");
        navigate("/reset-password", { state: { email, otp } });
      }
    } catch (err) {
      setError(err.message || "Invalid or expired verification code");
      addToast(err.message || "Verification failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (countdown > 0) return;
    try {
      await api.requestPasswordReset(email);
      setCountdown(60);
      addToast("New code sent!", "success");
    } catch (err) {
      addToast(err.message || "Failed to resend code", "error");
    }
  };

  const filled = code.every((d) => d !== "");

  return (
    <div className="min-h-screen flex items-center justify-center auth-gradient px-6 py-12">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Link to={from === "signup" ? "/signup" : "/forgot-password"} className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface mb-8 group">
          <Icon name="arrow_back" className="text-base transition-transform group-hover:-translate-x-1" />
          Back
        </Link>

        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-8 shadow-glass">
          <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6">
            <Icon name="pin" className="text-secondary text-3xl" />
          </div>

          <h1 className="text-2xl font-headline font-extrabold tracking-tight mb-2">
            {from === "signup" ? "Verify your email" : "Enter verification code"}
          </h1>
          <p className="text-on-surface-variant text-sm mb-2">
            We sent a 6-digit code to
          </p>
          <p className="font-mono text-sm font-semibold bg-surface-container-low px-3 py-1.5 rounded-lg inline-block mb-8">
            {email}
          </p>

          <form onSubmit={handleSubmit}>
            <div className="flex gap-2 sm:gap-3 justify-center mb-2" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <motion.input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={`w-10 sm:w-12 h-12 sm:h-14 text-center text-xl font-bold rounded-xl border-2 transition-all duration-200 bg-surface-container-lowest focus:outline-none otp-input
                    ${error ? "border-error focus:border-error" : digit ? "border-secondary" : "border-outline-variant/50 focus:border-secondary"}
                    ${digit ? "bg-secondary/5" : ""}
                  `}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                />
              ))}
            </div>

            {error && (
              <p className="text-error text-xs mt-2 text-center flex items-center justify-center gap-1">
                <Icon name="error" className="text-xs" />
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="secondary"
              className="w-full h-12 rounded-lg text-base mt-6"
              disabled={loading || !filled}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Icon name="progress_activity" className="text-lg animate-spin" />
                  Verifying...
                </span>
              ) : (
                <>
                  Verify code
                  <Icon name="arrow_forward" className="text-base ml-1" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-on-surface-variant">
              Didn&apos;t receive the code?{" "}
              {countdown > 0 ? (
                <span className="text-on-surface-variant/60">
                  Resend in <span className="font-mono font-semibold">{countdown}s</span>
                </span>
              ) : (
                <button onClick={resend} className="font-semibold text-secondary hover:underline">
                  Resend code
                </button>
              )}
            </p>
          </div>

          <motion.div
            className="mt-6 p-4 rounded-xl bg-secondary/5 border border-secondary/20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-xs text-on-surface-variant">
              <span className="font-semibold text-secondary">Demo tip:</span>{" "}
              Enter any 6 digits (e.g. <span className="font-mono bg-secondary/10 px-1 rounded">123456</span>) to proceed.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
