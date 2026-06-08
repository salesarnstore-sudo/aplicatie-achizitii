'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Logare
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Preluare Rol (verificăm coloana 'role')
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      // 3. Redirecționare corectă conform Supabase (rolul este 'sales')
      if (profile.role === 'sales') {
        router.push('/dashboard/vanzari');
      } else {
        router.push('/dashboard/achizitii');
      }
      
    } catch (err: any) {
      alert("Eroare: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <form 
        onSubmit={handleLogin} 
        className="p-8 bg-white shadow-md rounded-lg w-96 border border-gray-200"
      >
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Login ARN Store</h1>
        
        <input 
          type="email" 
          placeholder="Email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)} 
          className="w-full border p-2 mb-4 rounded" 
          required
        />
        
        <input 
          type="password" 
          placeholder="Parola" 
          value={password}
          onChange={(e) => setPassword(e.target.value)} 
          className="w-full border p-2 mb-6 rounded" 
          required
        />
        
        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          {loading ? 'Se verifică...' : 'Intră în sistem'}
        </button>
      </form>
    </div>
  );
}