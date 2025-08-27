'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import TopBar from '@/components/TopBar';

type WalletType = 'bybit_uid' | 'btc_address';

type ProfileRow = {
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

type EditForm = {
  first_name: string;
  last_name: string;
  pu_total: number;
  pu_converted: number;
  auto_convert: boolean;
  carryover_usd: number;
  wallet_default: WalletType;
  bybit_uid: string;
  btc_address: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [q, setQ] = useState('');

  // editor riga
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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
  useEffect(() => { if (ready) void load(); }, [ready]);

  // Filtro ricerca
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

  // Entra in modalità modifica
  const startEdit = (r: ProfileRow) => {
    setErr(null);
    setEditingId(r.id);
    setForm({
      first_name: r.first_name ?? '',
      last_name: r.last_name ?? '',
      pu_total: r.pu_total,
      pu_converted: r.pu_converted,
      auto_convert: r.auto_convert,
      carryover_usd: r.carryover_usd,
      wallet_default: r.wallet_default,
      bybit_uid: r.bybit_uid ?? '',
      btc_address: r.btc_address ?? '',
    });
  };
  const cancelEdit = () => { setEditingId(null); setForm(null); setErr(null); };

  // Salva modifica
  const saveEdit = async () => {
    if (!editingId || !form) return;
    setSaving(true);
    setErr(null);

    // Validazioni minime
    if (form.wallet_default === 'bybit_uid' && !form.bybit_uid.trim()) {
      setErr('Inserisci un Bybit UID oppure cambia wallet default.');
      setSaving(false);
      return;
    }
    if (form.wallet_default === 'btc_address' && !form.btc_address.trim()) {
      setErr('Inserisci un indirizzo BTC oppure cambia wallet default.');
      setSaving(false);
      return;
    }

    const payload = {
      first_name: form.first_name || null,
      last_name: form.last_name || null,
      pu_total: Number(form.pu_total) || 0,
      pu_converted: Number(form.pu_converted) || 0,
      auto_convert: !!form.auto_convert,
      carryover_usd: Number(form.carryover_usd) || 0,
      wallet_default: form.wallet_default,
      bybit_uid: form.bybit_uid.trim() || null,
      btc_address: form.btc_address.trim() || null,
    };

    const { error } = await supabase.from('profiles').update(payload).eq('id', editingId);
    setSaving(false);
    if (error) { setErr(error.message); return; }

    await load();
    cancelEdit();
  };

  // Vai alla pagina cliente (vista admin)
  const openClient = (id: string) => {
    router.push(`/admin/client/${id}`);
  };

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

        {/* Messaggi */}
        {err && <div className="mb-3 text-red-400 text-sm">{err}</div>}

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
                <th className="text-left px-3 py-2">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const full = [r.first_name, r.last_name].filter(Boolean).join(' ') || '—';
                const dest =
                  r.wallet_default === 'bybit_uid'
                    ? (r.bybit_uid || '—')
                    : (r.btc_address || '—');

                const isEdit = editingId === r.id;

                return (
                  <tr key={r.id} className="border-t border-neutral-800 align-top hover:bg-neutral-900/40">
                    {/* Cliente */}
                    <td className="px-3 py-2">
                      {isEdit ? (
                        <div className="flex gap-2">
                          <input
                            value={form?.first_name ?? ''}
                            onChange={(e) => setForm(p => p ? ({ ...p, first_name: e.target.value }) : p)}
                            placeholder="Nome"
                            className="w-28 px-2 py-1 rounded bg-neutral-900 border border-neutral-800 outline-none"
                          />
                          <input
                            value={form?.last_name ?? ''}
                            onChange={(e) => setForm(p => p ? ({ ...p, last_name: e.target.value }) : p)}
                            placeholder="Cognome"
                            className="w-32 px-2 py-1 rounded bg-neutral-900 border border-neutral-800 outline-none"
                          />
                        </div>
                      ) : full}
                    </td>

                    {/* Email */}
                    <td className="px-3 py-2">{r.email ?? '—'}</td>

                    {/* PU */}
                    <td className="px-3 py-2 text-right">
                      {isEdit ? (
                        <input
                          type="number"
                          value={form?.pu_total ?? 0}
                          onChange={(e) => setForm(p => p ? ({ ...p, pu_total: Number(e.target.value) }) : p)}
                          className="w-24 text-right px-2 py-1 rounded bg-neutral-900 border border-neutral-800 outline-none"
                        />
                      ) : r.pu_total}
                    </td>

                    {/* PU convertite */}
                    <td className="px-3 py-2 text-right">
                      {isEdit ? (
                        <input
                          type="number"
                          value={form?.pu_converted ?? 0}
                          onChange={(e) => setForm(p => p ? ({ ...p, pu_converted: Number(e.target.value) }) : p)}
                          className="w-24 text-right px-2 py-1 rounded bg-neutral-900 border border-neutral-800 outline-none"
                        />
                      ) : r.pu_converted}
                    </td>

                    {/* Auto-conv */}
                    <td className="px-3 py-2">
                      {isEdit ? (
                        <select
                          value={form?.auto_convert ? 'ON' : 'OFF'}
                          onChange={(e) => setForm(p => p ? ({ ...p, auto_convert: e.target.value === 'ON' }) : p)}
                          className="px-2 py-1 rounded bg-neutral-900 border border-neutral-800 outline-none"
                        >
                          <option>ON</option>
                          <option>OFF</option>
                        </select>
                      ) : (r.auto_convert ? 'ON' : 'OFF')}
                    </td>

                    {/* Carryover */}
                    <td className="px-3 py-2 text-right">
                      {isEdit ? (
                        <input
                          type="number" step="0.01"
                          value={form?.carryover_usd ?? 0}
                          onChange={(e) => setForm(p => p ? ({ ...p, carryover_usd: Number(e.target.value) }) : p)}
                          className="w-28 text-right px-2 py-1 rounded bg-neutral-900 border border-neutral-800 outline-none"
                        />
                      ) : r.carryover_usd.toFixed(2)}
                    </td>

                    {/* Wallet default */}
                    <td className="px-3 py-2">
                      {isEdit ? (
                        <select
                          value={form?.wallet_default ?? 'bybit_uid'}
                          onChange={(e) => setForm(p => p ? ({ ...p, wallet_default: e.target.value as WalletType }) : p)}
                          className="px-2 py-1 rounded bg-neutral-900 border border-neutral-800 outline-none"
                        >
                          <option value="bybit_uid">bybit_uid</option>
                          <option value="btc_address">btc_address</option>
                        </select>
                      ) : r.wallet_default}
                    </td>

                    {/* Destinazione */}
                    <td className="px-3 py-2">
                      {isEdit ? (
                        form?.wallet_default === 'bybit_uid' ? (
                          <input
                            value={form?.bybit_uid ?? ''}
                            onChange={(e) => setForm(p => p ? ({ ...p, bybit_uid: e.target.value }) : p)}
                            placeholder="Bybit UID"
                            className="w-40 px-2 py-1 rounded bg-neutral-900 border border-neutral-800 outline-none"
                          />
                        ) : (
                          <input
                            value={form?.btc_address ?? ''}
                            onChange={(e) => setForm(p => p ? ({ ...p, btc_address: e.target.value }) : p)}
                            placeholder="BTC address"
                            className="w-64 px-2 py-1 rounded bg-neutral-900 border border-neutral-800 outline-none"
                          />
                        )
                      ) : dest}
                    </td>

                    {/* Azioni */}
                    <td className="px-3 py-2">
                      {isEdit ? (
                        <div className="flex gap-2">
                          <button
                            onClick={saveEdit}
                            disabled={saving}
                            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
                          >
                            {saving ? 'Salvo…' : 'Salva'}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
                          >
                            Annulla
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openClient(r.id)}
                            className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
                          >
                            Apri dashboard
                          </button>
                          <button
                            onClick={() => startEdit(r)}
                            className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
                          >
                            Modifica
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-neutral-400" colSpan={9}>
                    Nessun cliente trovato.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-neutral-500 mt-3">
          Ricerca, modifica campi e apertura dashboard cliente. Al prossimo step: split mensile, storico transazioni,
          e grafici.
        </p>
      </div>
    </div>
  );
}
