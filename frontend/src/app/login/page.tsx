"use client";

import { SignInPage } from "@/components/ui/sign-in";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleSignIn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    console.log("Sign In submitted:", data);
    // Simulate login
    alert("Login successful! Redirecting to dashboard.");
    router.push("/");
  };

  const handleGoogleSignIn = () => {
    console.log("Continue with Google clicked");
    alert("Google sign-in not implemented yet.");
  };

  const handleResetPassword = () => {
    alert("Reset Password clicked");
  };

  const handleCreateAccount = () => {
    router.push("/signup");
  };

  return (
    <div className="bg-black text-white">
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