'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import TopBar from '@/components/TopBar';

type WalletType = 'bybit_uid' | 'btc_address';
type Profile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  pu_total: number;
  pu_converted: number;
  auto_convert: boolean;
  carryover_usd: number;
  wallet_default: WalletType;
  bybit_uid: string | null;
  btc_address: string | null;
  start_date: string | null;
};

export default function ClientAdminPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/login'); return; }
      const { data: isAdmin } = await supabase.rpc('is_admin');
      if (isAdmin !== true) { router.replace('/dashboard'); return; }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .maybeSingle();

      setProfile((data as Profile) ?? null);
      setReady(true);
    })();
  }, [router, params.id]);

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <TopBar />
      <div className="p-6">
        <button
          onClick={() => router.back()}
          className="px-3 py-1 mb-4 rounded bg-neutral-800 hover:bg-neutral-700"
        >
          ← Torna indietro
        </button>

        <h1 className="text-2xl font-semibold mb-2">
          Dashboard cliente — {profile ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() : '—'}
        </h1>
        {profile ? (
          <div className="space-y-2 text-neutral-300">
            <div><b>Email:</b> {profile.email ?? '—'}</div>
            <div><b>PU totali:</b> {profile.pu_total} &nbsp; | &nbsp; <b>PU convertite:</b> {profile.pu_converted}</div>
            <div><b>Auto-conversione:</b> {profile.auto_convert ? 'ON' : 'OFF'}</div>
            <div><b>Carryover USD:</b> {profile.carryover_usd.toFixed(2)}</div>
            <div><b>Wallet default:</b> {profile.wallet_default}</div>
            <div><b>Destinazione:</b> {profile.wallet_default === 'bybit_uid' ? (profile.bybit_uid ?? '—') : (profile.btc_address ?? '—')}</div>
            <div><b>Inizio mining:</b> {profile.start_date ?? '—'}</div>
            <p className="text-neutral-500 pt-2">Qui metteremo grafici animati, minato giornaliero simulato,
              storico transazioni e pulsanti amministratore.</p>
          </div>
        ) : (
          <div className="text-neutral-400">Cliente non trovato.</div>
        )}
      </div>
    </div>
  );
}
