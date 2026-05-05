'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Mail, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  const [errors, setErrors]         = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: { email?: string; password?: string } = {};
    if (!email || !email.includes('@'))    e.email    = 'Valid email required';
    if (!password || password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error || !data.user) {
        toast({
          title: 'Login Failed',
          description: error?.message || 'Invalid email or password',
          variant: 'destructive',
        });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      const role = profile?.role ?? 'employee';

      toast({ title: 'Welcome back!', description: 'Signed in successfully.' });

      if (role === 'superadmin') {
        router.push('/superadmin/dashboard');
      } else if (role === 'org_admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }

    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-slate-700 bg-slate-800 shadow-2xl">
      <div className="p-8">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-teal-600">
            <span className="text-lg font-bold text-white">🛡️</span>
          </div>
          <h1 className="ml-3 text-2xl font-bold text-white">SAGP</h1>
        </div>

        <h2 className="mb-2 text-center text-2xl font-bold text-white">Welcome Back</h2>
        <p className="mb-6 text-center text-sm text-slate-400">
          Sign in to continue your security training
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-300">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
              <Input id="email" type="email" placeholder="your@email.com"
                value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
                className="border-slate-600 bg-slate-700 pl-10 text-white placeholder-slate-400" />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
              <Input id="password" type="password" placeholder="••••••••"
                value={password} onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
                className="border-slate-600 bg-slate-700 pl-10 text-white placeholder-slate-400" />
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
          </div>

          {/* Remember me */}
          <div className="flex items-center gap-2">
            <input id="rememberMe" type="checkbox" checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-teal-600" />
            <label htmlFor="rememberMe" className="text-sm text-slate-400">Remember me</label>
          </div>

          <Button type="submit" disabled={isLoading} variant="primary" className="w-full">
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-teal-400 hover:text-teal-300">Sign up</Link>
        </p>
      </div>
    </Card>
  );
}
