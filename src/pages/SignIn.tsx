import { SignIn as ClerkSignIn } from "@clerk/clerk-react";

export default function SignIn() {
  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <ClerkSignIn routing="path" path="/sign-in" />
    </div>
  );
}