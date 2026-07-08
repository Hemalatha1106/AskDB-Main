'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PremiumCard } from '@/components/ui/premium-card';
import { Spinner } from '@/components/ui/spinner';
import { AskDBLogo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Finalizing authentication...');

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const id = searchParams.get('id');

    if (!token || !email || !id) {
      setError('Missing authentication parameters. Please try signing in again.');
      return;
    }

    try {
      setStatus('Saving your session...');
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify({ id: Number(id), email }));
      
      setStatus('Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Failed to complete sign in. Please try again.');
    }
  }, [searchParams, router]);

  if (error) {
    return (
      <PremiumCard glass className="p-8 max-w-md w-full text-center border-red-500/20 shadow-lg shadow-red-500/5">
        <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Authentication Error</h2>
        <p className="text-muted-foreground text-sm mb-6">{error}</p>
        <Button onClick={() => router.push('/auth/login')} className="w-full">
          Back to Sign In
        </Button>
      </PremiumCard>
    );
  }

  return (
    <PremiumCard glass className="p-8 max-w-md w-full text-center flex flex-col items-center justify-center shadow-xl">
      <div className="relative mb-6">
        <div className="absolute inset-0 blur-xl opacity-20 bg-primary rounded-full animate-pulse" />
        <Spinner className="w-12 h-12 text-primary relative" />
      </div>
      <h2 className="text-xl font-bold mb-2 animate-pulse">{status}</h2>
      <p className="text-muted-foreground text-sm">Please wait while we set up your secure session.</p>
    </PremiumCard>
  );
}

export default function CallbackPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-background to-secondary/15">
      <div className="mb-8">
        <AskDBLogo />
      </div>
      <Suspense fallback={
        <PremiumCard glass className="p-8 max-w-md w-full text-center flex flex-col items-center justify-center">
          <Spinner className="w-12 h-12 text-primary mb-4" />
          <h2 className="text-xl font-bold mb-2">Loading session...</h2>
        </PremiumCard>
      }>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}
