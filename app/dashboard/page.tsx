'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import TopBar from '@/components/TopBar';

type Profile = {
  first_name: string | null;
  last_name: string | null;
  pu_total: number;
  pu_converted: number;
  auto_convert: boolean;
  carryover_usd: number;
  bybit_uid: string | null;
  btc_address: string | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/login'); return; }

      const { data, error } = await supabase
        .from('profiles')
        .select('first_name,last_name,pu_total,pu_converted,auto_convert,carryover_usd,bybit_uid,btc_address')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!error) {
        setProfile((data as Profile) ?? null);
      }
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
