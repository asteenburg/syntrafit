"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Activity,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className='relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080808] px-6 py-24 text-white'>
      {/* BACKGROUND GLOW */}
      <div className='pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#A4FF00]/10 blur-[150px]' />

      <div className='pointer-events-none absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-[#A4FF00]/5 blur-[120px]' />

      {/* BACK TO HOME */}
      <Link
        href='/'
        className='absolute left-6 top-8 flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white sm:left-10'
      >
        <ArrowLeft size={18} />
        Back to home
      </Link>

      <div className='relative w-full max-w-md'>
        {/* BRANDING */}
        <div className='mb-10 text-center'>
          <Link
            href='/'
            className='inline-flex items-center gap-3'
          >
            <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-[#A4FF00] text-black'>
              <Activity
                size={28}
                strokeWidth={3}
              />
            </div>

            <span className='text-3xl font-black tracking-tight'>
              Syntra<span className='text-[#A4FF00]'>Fit</span>
            </span>
          </Link>

          <h1 className='mt-8 text-4xl font-black tracking-tight'>
            Welcome back.
          </h1>

          <p className='mt-3 text-sm text-zinc-400'>
            Your fitness journey continues here.
          </p>
        </div>

        {/* LOGIN CARD */}
        <div className='rounded-[28px] border border-white/10 bg-[#111111] p-6 shadow-2xl sm:p-8'>
          <form
            onSubmit={handleLogin}
            className='space-y-6'
          >
            {/* ERROR MESSAGE */}
            {error && (
              <div
                role='alert'
                className='flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400'
              >
                <AlertCircle
                  size={20}
                  className='shrink-0'
                />
                <p>{error}</p>
              </div>
            )}

            {/* EMAIL */}
            <div>
              <label
                htmlFor='email'
                className='mb-2 block text-sm font-medium text-zinc-300'
              >
                Email address
              </label>

              <div className='relative'>
                <Mail
                  size={20}
                  className='absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500'
                />

                <input
                  id='email'
                  name='email'
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='you@example.com'
                  autoComplete='email'
                  disabled={loading}
                  required
                  className='w-full rounded-xl border border-white/10 bg-[#191919] py-4 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[#A4FF00] disabled:opacity-50'
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label
                htmlFor='password'
                className='mb-2 block text-sm font-medium text-zinc-300'
              >
                Password
              </label>

              <div className='relative'>
                <Lock
                  size={20}
                  className='absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500'
                />

                <input
                  id='password'
                  name='password'
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='Enter your password'
                  autoComplete='current-password'
                  disabled={loading}
                  required
                  className='w-full rounded-xl border border-white/10 bg-[#191919] py-4 pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[#A4FF00] disabled:opacity-50'
                />

                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className='absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-white'
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className='mt-3 text-right'>
                <Link
                  href='/forgot-password'
                  className='text-xs font-medium text-[#A4FF00] hover:underline'
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* SIGN IN BUTTON */}
            <button
              type='submit'
              disabled={loading}
              className='flex w-full items-center justify-center gap-3 rounded-xl bg-[#A4FF00] py-4 font-bold text-black transition hover:bg-[#baff40] disabled:cursor-not-allowed disabled:opacity-50'
            >
              {loading ? (
                <>
                  <Loader2
                    size={20}
                    className='animate-spin'
                  />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* DIVIDER */}
          <div className='my-8 h-px bg-white/10' />

          {/* REGISTRATION */}
          <p className='text-center text-sm text-zinc-400'>
            Don't have an account?{" "}
            <Link
              href='/signup'
              className='font-semibold text-[#A4FF00] hover:underline'
            >
              Create an account
            </Link>
          </p>
        </div>

        {/* MOBILE APP NOTICE */}
        <div className='mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center'>
          <p className='text-xs leading-relaxed text-zinc-500'>
            Already using SyntraFit Mobile? Sign in with your existing account
            to access your workout history and training data.
          </p>
        </div>

        {/* COPYRIGHT */}
        <p className='mt-10 text-center text-xs text-zinc-600'>
          &copy; 2026 SyntraFit. All rights reserved.
        </p>
      </div>
    </main>
  );
}
