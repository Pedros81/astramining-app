'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import TopBar from '@/components/TopBar';

export default function AdminPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/login'); return; }
      const { data: isAdmin } = await supabase.rpc('is_admin');
      if (isAdmin !== true) { router.replace('/dashboard'); return; }
      setReady(true);
    })();
  }, [router]);

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <TopBar />
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-2">Area Amministratore</h1>
        <p className="text-neutral-400">Qui metteremo: lista clienti, split mensile, storico PU.</p>
      </div>
    </div>
  );
}
