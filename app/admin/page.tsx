'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import TopBar from '@/components/TopBar';

type ProfileRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  pu_total: number;
  pu_converted: number;
  auto_convert: boolean;
  carryover_usd: number;
  wallet_default: 'bybit_uid' | 'btc_address';
  bybit_uid: string | null;
  btc_address: string | null;
  start_date: string | null;
};

export default function AdminPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [q, setQ] = useState('');

  // Controllo login + ruolo admin
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/login'); return; }
      const { data: isAdmin } = await supabase.rpc('is_admin');
      if (isAdmin !== true) { router.replace('/dashboard'); return; }
      setReady(true);
    })();
  }, [router]);

  // Carica clienti
  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id,email,first_name,last_name,pu_total,pu_converted,auto_convert,carryover_usd,wallet_default,bybit_uid,btc_address,start_date')
      .order('created_at', { ascending: false })
      .limit(100);
    if (!error && data) setRows(data as unknown as ProfileRow[]);
    setLoading(false);
  };

  useEffect(() => {
    if (ready) void load();
  }, [ready]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(r => {
      const name = `${r.first_name ?? ''} ${r.last_name ?? ''}`.toLowerCase();
      return (
        (r.email ?? '').toLowerCase().includes(term) ||
        name.includes(term) ||
        (r.bybit_uid ?? '').toLowerCase().includes(term) ||
        (r.btc_address ?? '').toLowerCase().includes(term)
      );
    });
  }, [q, rows]);

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <TopBar />
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Area Amministratore</h1>

        {/* Barra azioni */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cerca per nome, email, UID Bybit o BTC address…"
            className="w-full sm:w-96 px-3 py-2 rounded bg-neutral-900 border border-neutral-800 outline-none"
          />
          <button
            onClick={load}
            className="px-3 py-2 rounded bg-neutral-800 hover:bg-neutral-700"
            disabled={loading}
          >
            {loading ? 'Aggiorno…' : 'Aggiorna'}
          </button>
        </div>

        {/* Tabella */}
        <div className="overflow-x-auto border border-neutral-800 rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-900">
              <tr>
                <th className="text-left px-3 py-2">Cliente</th>
                <th className="text-left px-3 py-2">Email</th>
                <th className="text-right px-3 py-2">PU</th>
                <th className="text-right px-3 py-2">PU conv.</th>
                <th className="text-left px-3 py-2">Auto-conv.</th>
                <th className="text-right px-3 py-2">Carryover (USD)</th>
                <th className="text-left px-3 py-2">Wallet default</th>
                <th className="text-left px-3 py-2">Destinazione</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const full = [r.first_name, r.last_name].filter(Boolean).join(' ') || '—';
                const dest =
                  r.wallet_default === 'bybit_uid'
                    ? (r.bybit_uid || '—')
                    : (r.btc_address || '—');
                return (
                  <tr key={r.id} className="border-t border-neutral-800 hover:bg-neutral-900/40">
                    <td className="px-3 py-2">{full}</td>
                    <td className="px-3 py-2">{r.email ?? '—'}</td>
                    <td className="px-3 py-2 text-right">{r.pu_total}</td>
                    <td className="px-3 py-2 text-right">{r.pu_converted}</td>
                    <td className="px-3 py-2">{r.auto_convert ? 'ON' : 'OFF'}</td>
                    <td className="px-3 py-2 text-right">{r.carryover_usd.toFixed(2)}</td>
                    <td className="px-3 py-2">{r.wallet_default}</td>
                    <td className="px-3 py-2">{dest}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-neutral-400" colSpan={8}>
                    Nessun cliente trovato.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-neutral-500 mt-3">
          Mostrati {filtered.length} clienti (max 100). A breve aggiungiamo: “Apri dashboard cliente”,
          modifica PU, storico, split mensile, ecc.
        </p>
      </div>
    </div>
  );
}
