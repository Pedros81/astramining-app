'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) { setErr(error.message); return; }

    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (isAdmin === true) router.replace('/admin');
    else router.replace('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <form onSubmit={onSubmit} className="w-full max-w-sm p-6 rounded-lg border border-neutral-800">
        <h1 className="text-xl font-semibold mb-4">Accesso</h1>

        <label className="text-sm">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full mt-1 mb-3 px-3 py-2 rounded bg-neutral-900 border border-neutral-800 outline-none"
          placeholder="tuo@email.it"
        />

        <label className="text-sm">Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full mt-1 mb-4 px-3 py-2 rounded bg-neutral-900 border border-neutral-800 outline-none"
          placeholder="••••••••"
        />

        {err && <div className="mb-3 text-red-400 text-sm">{err}</div>}

        <button
          disabled={loading}
          className="w-full py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
        >
          {loading ? 'Accesso...' : 'Entra'}
        </button>
      </form>
    </div>
  );
}
