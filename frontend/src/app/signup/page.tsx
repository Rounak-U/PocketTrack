"use client";

import { SignInPage } from "@/components/ui/sign-in";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const handleSignUp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    console.log("Sign Up submitted:", data);
    // Simulate signup
    alert("Account created successfully! Redirecting to dashboard.");
    router.push("/dashboard");
  };

  const handleGoogleSignIn = () => {
    console.log("Continue with Google clicked");
    alert("Google sign-in not implemented yet.");
  };

  const handleResetPassword = () => {
    alert("Reset Password clicked");
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
        onGoogleSignIn={handleGoogleSignIn}
        onResetPassword={handleResetPassword}
        onCreateAccount={handleSignIn}
        isSignUp={true}
      />
    </div>
  );
}