import AuthForm from '@/components/auth/AuthForm';

export default function SignupPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <AuthForm initialMode="signup" />
    </div>
  );
}