"use client";

import { SignInPage } from "@/components/ui/sign-in";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/components/ui/notification-context";
import { getApiBase } from "@/lib/api";
import { useEffect, useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const { showSuccess, showError, showInfo } = useNotifications();
  const API_BASE = getApiBase();
  const [otpEmail, setOtpEmail] = useState<string | undefined>(undefined);
  const [otpMode, setOtpMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const pending = localStorage.getItem("pendingRegistration");
    const storedOtpMode = localStorage.getItem("otpMode");
    setOtpMode(storedOtpMode === "true");
    if (pending) {
      try {
        const data = JSON.parse(pending);
        if (data?.email) {
          setOtpEmail(data.email);
        }
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    console.log("Sign Up submitted:", data);

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const responseData = await res.json();
      console.log('Registration response:', responseData);

      // Store registration data for OTP verification
      // Include MojoAuth stateId returned from the server so we can verify using it
      const pending = { ...data, stateId: responseData.stateId };
      localStorage.setItem('pendingRegistration', JSON.stringify(pending));

      if (typeof data.email === "string") {
        setOtpEmail(data.email);
      }
      showSuccess("OTP Sent", "Enter the code sent to your email");
      // Stay on signup page but switch to OTP mode — handled by SignInPage's otpMode
      // Add a flag in localStorage to indicate OTP mode
      localStorage.setItem('otpMode', 'true');
      setOtpMode(true);
    } catch (error) {
      console.error('Registration error:', error);
      showError("Registration Failed", error instanceof Error ? error.message : 'Registration failed. Please try again.');
    }
  };

  const handleGoogleSignIn = () => {
    console.log("Continue with Google clicked");
    showInfo("Google Sign-in", "Coming soon!");
  };

  const handleResetPassword = () => {
    showInfo("Reset Password", "Password reset functionality coming soon!");
  };

  const handleSignIn = () => {
    router.push("/login");
  };

  return (
    <div className="bg-black text-white">
      <SignInPage
        title={<span className="font-light text-white tracking-tighter">Create Account</span>}
        description="Join PocketTrack and start managing your finances smarter"
        heroImageSrc="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=2160&q=80"
        testimonials={[]}
        onSignIn={handleSignUp}
        otpMode={otpMode}
        otpEmail={otpEmail}
        onVerifyOtpCode={async (otpCode: string) => {
          const pending = localStorage.getItem('pendingRegistration');
          if (!pending) {
            showError('No registration data', 'Please enter your details again');
            return;
          }
          const data = JSON.parse(pending);

          try {
            const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...data, otp: otpCode })
            });

            if (!res.ok) {
              const err = await res.json();
              throw new Error(err.error || 'OTP verification failed');
            }

            const responseData = await res.json();
            localStorage.setItem('accessToken', responseData.accessToken);
            localStorage.setItem('refreshToken', responseData.refreshToken);
            localStorage.setItem('user', JSON.stringify(responseData.user));

            localStorage.removeItem('pendingRegistration');
            localStorage.removeItem('otpMode');
            setOtpMode(false);

            showSuccess('Account Created', 'Welcome to PocketTrack!');
            router.push('/dashboard');
          } catch (err) {
            console.error('OTP verify error', err);
            showError('OTP Verification Failed', err instanceof Error ? err.message : 'OTP verification failed. Please try again.');
          }
        }}
        onResendOtpCode={async () => {
          const pending = localStorage.getItem('pendingRegistration');
          if (!pending) {
            showError('No registration data', 'Please enter your details again');
            return;
          }
          const data = JSON.parse(pending);
          try {
            const res = await fetch(`${API_BASE}/api/auth/resend-otp`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: data.email })
            });
            if (!res.ok) {
              const err = await res.json();
              throw new Error(err.error || 'Resend failed');
            }
            const resp = await res.json();
            if (resp.stateId) {
              const updated = { ...data, stateId: resp.stateId };
              localStorage.setItem('pendingRegistration', JSON.stringify(updated));
            }
            showSuccess('OTP Resent', 'Check your email');
          } catch (err) {
            console.error('Resend failed', err);
            showError('Resend Failed', err instanceof Error ? err.message : 'Failed to resend OTP. Please try again.');
          }
        }}
        onGoogleSignIn={handleGoogleSignIn}
        onResetPassword={handleResetPassword}
        onCreateAccount={handleSignIn}
        isSignUp={true}
      />
    </div>
  );
}