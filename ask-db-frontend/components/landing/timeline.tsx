'use client';

import { PremiumCard } from '@/components/ui/premium-card';

const steps = [
  {
    number: '01',
    title: 'Connect Your Database',
    description:
      'Simply add your database credentials. We support PostgreSQL, MySQL, SQL Server, and more.',
    icon: '🔌',
  },
  {
    number: '02',
    title: 'Ask Your Questions',
    description:
      'Use natural language to ask anything about your data. No SQL required.',
    icon: '💬',
  },
  {
    number: '03',
    title: 'Get Instant Answers',
    description:
      'Receive AI-generated insights, visualizations, and recommendations instantly.',
    icon: '✨',
  },
];

export function Timeline() {
  return (
    <section id="timeline" className="py-20 sm:py-32 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started in three simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector lines (hidden on mobile) */}
          <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent transform -translate-y-1/2" />

          {steps.map((step, index) => (
            <PremiumCard key={index} className="p-8 relative z-10">
              <div className="text-5xl mb-4">{step.icon}</div>
              <div className="text-sm font-bold text-blue-500 mb-2">
                STEP {step.number}
              </div>
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </PremiumCard>
          ))}
        </div>
      </div>
    </section>
  );
}
