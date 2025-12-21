"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/components/ui/notification-context";

export default function OTPPage() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingData, setPendingData] = useState<Record<string, any> | null>(null);
  const router = useRouter();
  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    const data = localStorage.getItem('pendingRegistration');
    if (!data) {
      router.push('/signup');
      return;
    }
    setPendingData(JSON.parse(data));
  }, [router]);

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingData) return;

    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp, ...(pendingData || {}) }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'OTP verification failed');
      }

      const responseData = await res.json();

      // Store tokens and user
      localStorage.setItem('accessToken', responseData.accessToken);
      localStorage.setItem('refreshToken', responseData.refreshToken);
      localStorage.setItem('user', JSON.stringify(responseData.user));

      // Clear pending registration
      localStorage.removeItem('pendingRegistration');

      showSuccess("Account Created", "Welcome to PocketTrack!");
      router.push("/dashboard");
    } catch (error) {
      console.error('OTP verification error:', error);
      showError("Verification Failed", error instanceof Error ? error.message : 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!pendingData?.email) return;

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: pendingData.email }),
      });

      if (!res.ok) {
        throw new Error('Failed to resend OTP');
      }

      showSuccess("OTP Resent", "Check your email for the new code");
    } catch (error) {
      showError("Resend Failed", error instanceof Error ? error.message : 'Failed to resend OTP. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a 6-digit code to your email address
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleVerifyOTP}>
          <div>
            <label htmlFor="otp" className="sr-only">
              OTP Code
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </div>
          <div className="text-center">
            <button
              type="button"
              onClick={handleResendOTP}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Didn't receive the code? Resend
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}