'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative py-20 sm:py-32 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-b from-blue-500/20 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-purple-500/20 to-transparent blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/40 bg-secondary/50 mb-8">
          <span className="text-xs font-medium text-accent">✨ New</span>
          <span className="text-xs text-muted-foreground">
            AI-powered database insights in seconds
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter mb-6">
          Understand Your
          <br />
          <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Database Like Never Before
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          AskDB is an AI-powered SQL assistant that helps you query, analyze,
          and optimize your databases with natural language. Ask anything about
          your data.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" asChild className="min-w-40">
            <Link href="/auth/signup">Start Free Trial</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="min-w-40">
            <Link href="#features">See How It Works</Link>
          </Button>
        </div>


      </div>
    </section>
  );
}
