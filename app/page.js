import React from 'react';
import dynamic from 'next/dynamic';

const DateNightPlanner = dynamic(() => import('./components/DateNightPlanner'), { ssr: false });

export default function Home() {
  return (
    <main className="min-h-screen">
      <DateNightPlanner />
    </main>
  );
}