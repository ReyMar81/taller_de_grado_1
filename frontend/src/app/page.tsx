'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir automáticamente al login
    router.push('/login');
  }, [router]);

  return null;
}
