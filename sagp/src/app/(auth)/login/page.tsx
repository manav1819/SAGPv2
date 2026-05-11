'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: { email?: string; password?: string } = {};
    if (!email || !email.includes('@')) e.email = 'Valid email required';
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
    <Card className="sagp-login-panel">
      <div className="p-8">
        <div className="sagp-login-header">
          <div className="sagp-login-logo">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="sagp-login-title sagp-neon-text">SAGP</h1>
          <p className="sagp-login-copy">Security Awareness Gamification Platform</p>
        </div>

        <h2 className="sagp-card-title mb-2 text-center">Welcome Back</h2>
        <p className="mb-6 text-center text-sm sagp-text-muted">
          Sign in to continue your security training
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium sagp-text-muted">
              Email
            </label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((p) => ({ ...p, email: '' }));
                }}
                className="pl-10"
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium sagp-text-muted">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((p) => ({ ...p, password: '' }));
                }}
                className="pl-10"
              />
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-cyan-300/25 bg-black/40 text-cyan-300"
            />
            <label htmlFor="rememberMe" className="text-sm sagp-text-muted">
              Remember me
            </label>
          </div>

          <Button type="submit" disabled={isLoading} variant="primary" className="w-full">
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm sagp-text-muted">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium sagp-text-cyan hover:text-white">
            Sign up
          </Link>
        </p>
      </div>
    </Card>
  );
}
