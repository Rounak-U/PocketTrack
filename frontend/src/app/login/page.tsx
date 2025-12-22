"use client";

import { SignInPage } from "@/components/ui/sign-in";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useNotifications } from "@/components/ui/notification-context";
import { useRef } from "react";
import { getApiBase } from "@/lib/api";

declare global {
  interface Window {
    google: any;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { showSuccess, showError, showInfo } = useNotifications();
  const API_BASE = getApiBase();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      console.log('Google Identity Services script loaded');
      // Initialize Google Sign-In
      if (window.google && window.google.accounts && window.google.accounts.id) {
        console.log('Initializing Google Sign-In with client ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          callback: handleGoogleSignInCallback,
        });
        console.log('Google Sign-In initialized successfully');

        // Try to render a Google Sign-In button into our hidden ref (fallback)
        setTimeout(() => {
          try {
            if (googleButtonRef.current && window.google.accounts.id) {
              window.google.accounts.id.renderButton(
                googleButtonRef.current,
                { theme: 'outline', size: 'large', type: 'standard', text: 'signin_with' }
              );
            }
          } catch (err) {
            console.error('Error rendering Google button:', err);
          }
        }, 50);
      } else {
        console.error('Google Identity Services not available');
      }
    };

    return () => {
      // Cleanup script
      document.head.removeChild(script);
    };
  }, []);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    console.log("Sign In submitted:", data);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        // If backend indicates the account is Google-only, show a helpful message
        if (errorData.requiresGoogleSignIn) {
          showInfo('Use Google Sign-In', errorData.error || 'Please sign in with Google for this account.');
          return;
        }

        throw new Error(errorData.error || 'Login failed');
      }

      const responseData = await res.json();
      console.log('Login response:', responseData);

      // Store tokens and user in local storage
      localStorage.setItem('accessToken', responseData.accessToken);
      localStorage.setItem('refreshToken', responseData.refreshToken);
      localStorage.setItem('user', JSON.stringify(responseData.user));

      showSuccess("Login Successful", "Redirecting to dashboard...");
      router.push("/dashboard");
    } catch (error) {
      console.error('Login error:', error);
      showError("Login Failed", error instanceof Error ? error.message : 'Login failed. Please try again.');
    }
  };

  const handleGoogleSignIn = () => {
    console.log('handleGoogleSignIn called');
    console.log('Google client ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
    console.log('Google object available:', !!window.google);
    console.log('Google accounts available:', !!(window.google && window.google.accounts));
    console.log('Google accounts id available:', !!(window.google && window.google.accounts && window.google.accounts.id));

    if (window.google && window.google.accounts && window.google.accounts.id) {
      try {
        // If we rendered a hidden Google button, try to click it programmatically
        if (googleButtonRef.current) {
          const googleButton = googleButtonRef.current.querySelector('div[role="button"]') as HTMLElement | null;
          if (googleButton) {
            googleButton.click();
            return;
          }
        }

        // Fallback: show the Google One Tap / prompt
        console.log('Calling google.accounts.id.prompt()');
        window.google.accounts.id.prompt((notification: any) => {
          console.log('Google prompt notification:', notification);
          if (notification.isNotDisplayed && notification.isNotDisplayed()) {
            console.log('Google One Tap not displayed');
          }
        });
      } catch (err) {
        console.error('Google sign-in error:', err);
        alert('Google sign-in error. Check console for details.');
      }
    } else {
      console.error('Google sign-in is not available');
      alert('Google sign-in is not available. Please try again later.');
    }
  };

  const handleGoogleSignInCallback = async (response: any) => {
    console.log('handleGoogleSignInCallback called with response:', response);
    try {
      console.log('Sending request to /api/auth/google');
      const res = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: response.credential,
        }),
      });

      console.log('Response status:', res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Response error:', errorText);
        throw new Error('Google sign-in failed');
      }

      const data = await res.json();
      console.log('Response data:', data);

      // Store the tokens and user in local storage
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Google sign-in error:', error);
      showError("Google Sign-in Failed", "Please try again.");
    }
  };

  const handleResetPassword = () => {
    showInfo("Reset Password", "Password reset functionality coming soon!");
  };

  const handleCreateAccount = () => {
    router.push("/signup");
  };

  return (
    <div className="bg-black text-white">
      {/* Hidden container for Google's official button (rendered by GSI) */}
      <div ref={googleButtonRef} style={{ display: 'none' }} />
      <SignInPage
        title={<span className="font-light text-white tracking-tighter">Welcome Back</span>}
        description="Sign in to your account to continue tracking your finances"
        heroImageSrc="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=2160&q=80"
        testimonials={[]}
        onSignIn={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        onResetPassword={handleResetPassword}
        onCreateAccount={handleCreateAccount}
        isSignUp={false}
      />
    </div>
  );
}