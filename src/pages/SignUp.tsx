import { SignUp as ClerkSignUp } from "@clerk/clerk-react";

export default function SignUp() {
  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <ClerkSignUp routing="path" path="/sign-up" />
    </div>
  );
}