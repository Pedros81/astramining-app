'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import TopBar from '@/components/TopBar';

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/login'); return; }

      const { data } = await supabase
        .from('profiles')
        .select('first_name,last_name,pu_total,pu_converted,auto_convert,carryover_usd')
        .eq('id', session.user.id)
        .maybeSingle();

      setProfile(data ?? null);
      setReady(true);
    })();
  }, [router]);

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <TopBar />
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-2">
          {profile?.first_name ? `Ciao ${profile.first_name}!` : 'Dashboard Cliente'}
        </h1>
        <p className="text-neutral-400">Qui inseriremo riquadri, grafici e storico transazioni.</p>
      </div>
    </div>
  );
}
