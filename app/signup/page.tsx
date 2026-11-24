"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  User,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.session) {
        window.location.assign("/dashboard");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle =
    "w-full rounded-xl border border-white/10 bg-[#151515] py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-600 outline-none transition focus:border-[#A4FF00]";

  return (
    <main className='min-h-screen bg-[#080808] text-white flex items-center justify-center px-5 py-12'>
      <div className='w-full max-w-md'>
        {/* Branding */}
        <Link
          href='/'
          className='flex items-center justify-center gap-2 mb-10'
        >
          <Activity
            size={32}
            className='text-[#A4FF00]'
          />

          <span className='text-3xl font-bold tracking-tight'>
            Syntra<span className='text-[#A4FF00]'>Fit</span>
          </span>
        </Link>

        {success ? (
          <div className='rounded-3xl border border-white/10 bg-[#111111] p-8 text-center'>
            <CheckCircle2
              size={56}
              className='mx-auto mb-5 text-[#A4FF00]'
            />

            <h1 className='text-2xl font-bold mb-3'>Check your email</h1>

            <p className='text-zinc-400 leading-relaxed'>
              Check your inbox for a confirmation link to activate your
              SyntraFit account.
            </p>

            <Link
              href='/login'
              className='mt-8 block rounded-xl bg-[#A4FF00] py-3.5 font-bold text-black'
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <div className='rounded-3xl border border-white/10 bg-[#111111] p-6 sm:p-8'>
            <h1 className='text-3xl font-bold tracking-tight'>
              Create your account
            </h1>

            <p className='mt-2 mb-8 text-zinc-400'>
              Your fitness journey starts here.
            </p>

            <form
              onSubmit={handleSignup}
              className='space-y-5'
            >
              {/* Full name */}
              <div>
                <label
                  htmlFor='fullName'
                  className='block mb-2 text-sm font-medium'
                >
                  Full name
                </label>

                <div className='relative'>
                  <User
                    size={19}
                    className='absolute left-4 top-4 text-zinc-500'
                  />

                  <input
                    id='fullName'
                    type='text'
                    autoComplete='name'
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder='John Smith'
                    className={inputStyle}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor='email'
                  className='block mb-2 text-sm font-medium'
                >
                  Email address
                </label>

                <div className='relative'>
                  <Mail
                    size={19}
                    className='absolute left-4 top-4 text-zinc-500'
                  />

                  <input
                    id='email'
                    type='email'
                    autoComplete='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='you@example.com'
                    className={inputStyle}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor='password'
                  className='block mb-2 text-sm font-medium'
                >
                  Password
                </label>

                <div className='relative'>
                  <Lock
                    size={19}
                    className='absolute left-4 top-4 text-zinc-500'
                  />

                  <input
                    id='password'
                    type={showPassword ? "text" : "password"}
                    autoComplete='new-password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='Minimum 8 characters'
                    className={`${inputStyle} pr-12`}
                    minLength={8}
                    required
                  />

                  <button
                    type='button'
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-4 top-4 text-zinc-500 hover:text-white'
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label
                  htmlFor='confirmPassword'
                  className='block mb-2 text-sm font-medium'
                >
                  Confirm password
                </label>

                <div className='relative'>
                  <Lock
                    size={19}
                    className='absolute left-4 top-4 text-zinc-500'
                  />

                  <input
                    id='confirmPassword'
                    type={showPassword ? "text" : "password"}
                    autoComplete='new-password'
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder='Confirm your password'
                    className={inputStyle}
                    required
                  />
                </div>
              </div>

              {error && (
                <div
                  role='alert'
                  className='rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400'
                >
                  {error}
                </div>
              )}

              <button
                type='submit'
                disabled={loading}
                className='flex w-full items-center justify-center gap-2 rounded-xl bg-[#A4FF00] py-4 font-bold text-black transition hover:bg-[#91E600] disabled:opacity-50'
              >
                {loading ? (
                  <Loader2
                    className='animate-spin'
                    size={20}
                  />
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            <p className='mt-7 text-center text-sm text-zinc-400'>
              Already have an account?{" "}
              <Link
                href='/login'
                className='font-semibold text-[#A4FF00] hover:underline'
              >
                Sign in
              </Link>
            </p>
          </div>
        )}

        <p className='mt-8 text-center text-xs text-zinc-500'>
          © 2026 SyntraFit
        </p>
      </div>
    </main>
  );
}
