'use client';

import { Button } from '@/components/ui/button';
import { AskDBLogo } from '@/components/ui/logo';
import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-background to-secondary/20">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/">
            <AskDBLogo />
          </Link>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border border-border/40 p-8 shadow-lg">
          {!submitted ? (
            <>
              <h1 className="text-2xl font-bold mb-2 text-center">
                Reset Password
              </h1>
              <p className="text-center text-muted-foreground mb-8">
                Enter your email address and we&apos;ll send you a link to reset
                your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                  />
                </div>

                <Button type="submit" size="lg" className="w-full mt-6">
                  Send Reset Link
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Remember your password?{' '}
                <Link
                  href="/auth/login"
                  className="text-blue-500 hover:text-blue-600 font-medium transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="text-center">
                <div className="text-5xl mb-4">📧</div>
                <h1 className="text-2xl font-bold mb-2">Check Your Email</h1>
                <p className="text-muted-foreground mb-6">
                  We&apos;ve sent a password reset link to{' '}
                  <strong>{email}</strong>
                </p>
                <p className="text-sm text-muted-foreground mb-8">
                  The link will expire in 24 hours. If you don&apos;t see it,
                  check your spam folder.
                </p>

                <Button
                  onClick={() => setSubmitted(false)}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  Try Another Email
                </Button>

                <Link href="/auth/login">
                  <Button variant="ghost" size="lg" className="w-full mt-2">
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
