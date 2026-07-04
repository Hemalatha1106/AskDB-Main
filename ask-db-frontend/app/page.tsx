'use client';

import { LandingHeader } from '@/components/landing/header';
import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';
import { Timeline } from '@/components/landing/timeline';
import { Footer } from '@/components/landing/footer';

export default function Page() {
  return (
    <main>
      <LandingHeader />
      <Hero />
      <Features />
      <Timeline />
      <Footer />
    </main>
  );
}
