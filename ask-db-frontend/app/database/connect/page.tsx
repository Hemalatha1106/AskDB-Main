'use client';

import { ConnectionWizard } from '@/components/database/connection-wizard';
import { useRouter } from 'next/navigation';

export default function DatabaseConnectPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Connect Your Database</h1>
          <p className="text-lg text-muted-foreground">
            Set up a secure connection to start querying your data with AI.
          </p>
        </div>

        <ConnectionWizard
          onConnect={(config) => {
            console.log('Connected:', config);
            router.push('/dashboard/connections');
          }}
        />
      </div>
    </div>
  );
}
