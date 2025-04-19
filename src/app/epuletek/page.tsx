'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EpuletekPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/varosterkep?view=buildings');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <p className="text-lg mb-2">Átirányítás az egyesített térképoldalra...</p>
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
} 