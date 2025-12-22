"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Zap } from "lucide-react";

interface OTPVerificationProps {
  /** Optional email to display under the title */
  email?: string;
  /** Number of OTP digits */
  digits?: number;
  /** Called when user submits a complete OTP */
  onVerify?: (otpCode: string) => Promise<void> | void;
  /** Called when user taps Resend */
  onResend?: () => Promise<void> | void;
}

export function OTPVerification({
  email,
  digits = 6,
  onVerify,
  onResend,
}: OTPVerificationProps) {
  const [otp, setOtp] = useState<string[]>(Array(digits).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [resendMessage, setResendMessage] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const RESEND_DELAY = 120; // seconds
  const RESEND_STORAGE_KEY = email ? `otp_resend_${email}` : "otp_resend_default";

  const startCooldown = useCallback(
    (seconds: number) => {
      setResendSeconds(seconds);
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setResendSeconds((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setResendMessage("");
            localStorage.removeItem(RESEND_STORAGE_KEY);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [RESEND_STORAGE_KEY],
  );

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(RESEND_STORAGE_KEY);
    if (!stored) return;

    const elapsed = Math.floor((Date.now() - Number(stored)) / 1000);
    const remaining = RESEND_DELAY - elapsed;
    if (remaining > 0) {
      setResendMessage("OTP Resent");
      startCooldown(remaining);
    } else {
      localStorage.removeItem(RESEND_STORAGE_KEY);
    }
  }, [RESEND_STORAGE_KEY, startCooldown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const next = [...otp];
    next[index] = value;
    setOtp(next);

    if (value && index < digits - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== digits) return;

    setIsLoading(true);
    try {
      if (onVerify) {
        await onVerify(code);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.log("OTP verified:", code);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const triggerResend = async () => {
    if (onResend) {
      await onResend();
    } else {
      console.log("Resending OTP...");
    }
  };

  const handleResend = async () => {
    if (resendSeconds > 0) return;

    if (intervalRef.current) clearInterval(intervalRef.current);

    setResendMessage("OTP Resent");
    localStorage.setItem(RESEND_STORAGE_KEY, Date.now().toString());
    await triggerResend();
    startCooldown(RESEND_DELAY);
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-black px-4 py-6 sm:p-6 overflow-hidden">
      <div className="relative w-full max-w-sm sm:max-w-md max-h-[92vh] overflow-hidden rounded-3xl shadow-2xl">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=1200&q=80&auto=format&fit=crop"
            alt="Abstract background"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/80 via-emerald-700/90 to-black/95" />
        </div>

        <div className="relative z-10 px-5 py-8 sm:p-6 sm:py-10 md:p-8 md:py-14">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-8 h-8 mx-auto mb-4 sm:mb-6 text-white flex items-center justify-center">
              <Zap className="w-full h-full" />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-white mb-2 sm:mb-3">
              Enter verification code
            </h1>
            <p className="text-white/70 text-xs sm:text-sm leading-relaxed">
              We emailed you a verification code
              {email && (
                <>
                  <br />
                  <span className="text-white">{email}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex justify-center gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8">
            {otp.map((digit, index) => (
              <div key={index} className="relative">
                <input
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 text-center text-sm sm:text-base md:text-lg font-medium bg-white/5 border-white/15 text-white placeholder-white/40 focus:bg-white/10 focus:border-emerald-300/70 focus:outline-none transition-all duration-200 border shadow-lg opacity-100 rounded-2xl"
                  placeholder=""
                />
              </div>
            ))}
          </div>

          <div className="text-center mb-8 space-y-3">
            <button
              onClick={handleVerify}
              disabled={isLoading || otp.join("").length !== digits}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-500 py-3 text-sm font-medium text-white shadow-lg transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Verifying..." : "Verify"}
            </button>
            <div className="space-y-1">
              <span className="block text-white/60 text-sm">
                Didn't get the code?{" "}
                <button
                  onClick={handleResend}
                  disabled={resendSeconds > 0}
                  className="text-white/80 hover:text-white text-sm font-medium transition-colors duration-200 underline-offset-4 hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {resendSeconds > 0 ? `Next in ${formatTime(resendSeconds)}` : "Resend"}
                </button>
              </span>
              {resendMessage && (
                <p className="text-emerald-200 text-xs font-medium">{resendMessage}</p>
              )}
            </div>
          </div>

          <div className="text-center">
            <p className="text-white/50 text-xs leading-relaxed">
              By continuing, you agree to our{" "}
              <button className="text-white/70 hover:text-white underline transition-colors">
                Terms of Service
              </button>{" "}
              &{" "}
              <button className="text-white/70 hover:text-white underline transition-colors">
                Privacy Policy
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


