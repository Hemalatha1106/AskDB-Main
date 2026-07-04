'use client';

import { PremiumCard } from '@/components/ui/premium-card';

const features = [
  {
    icon: '🤖',
    title: 'Natural Language Queries',
    description:
      'Ask your database questions in plain English. No SQL knowledge required.',
  },
  {
    icon: '⚡',
    title: 'Instant Results',
    description:
      'Get lightning-fast responses with AI-optimized query execution.',
  },
  {
    icon: '🔐',
    title: 'Enterprise Security',
    description:
      'Bank-level encryption and compliance with SOC 2, GDPR, and HIPAA.',
  },
  {
    icon: '📊',
    title: 'Beautiful Visualizations',
    description:
      'Automatic chart generation and interactive data exploration tools.',
  },
  {
    icon: '🔗',
    title: 'Multi-Database Support',
    description:
      'Connect PostgreSQL, MySQL, SQL Server, SQLite, Oracle, and more.',
  },
  {
    icon: '📈',
    title: 'Smart Suggestions',
    description:
      'AI-powered recommendations for query optimization and data insights.',
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-4">
            Powerful Features
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to master your data with AI assistance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <PremiumCard
              key={index}
              className="p-6 interactive hover:border-blue-500/40 hover:shadow-lg"
            >
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-semibold mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </PremiumCard>
          ))}
        </div>
      </div>
    </section>
  );
}
