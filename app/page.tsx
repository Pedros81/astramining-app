'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/login'); return; }
      const { data: isAdmin } = await supabase.rpc('is_admin');
      if (isAdmin === true) router.replace('/admin');
      else router.replace('/dashboard');
    })();
  }, [router]);

  return null;
}
