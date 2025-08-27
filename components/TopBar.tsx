'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function TopBar() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <div className="w-full flex items-center justify-between p-4 border-b border-neutral-800">
      <div className="font-semibold">Astra Mining</div>
      <button
        onClick={handleLogout}
        className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-sm"
      >
        Logout
      </button>
    </div>
  );
}
