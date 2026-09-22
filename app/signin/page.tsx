'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Mail,
  UserCheck,
  AlertCircle,
  ArrowRight,
  KeyRound,
  UserPlus,
  CheckCircle2,
  Eye,
  EyeOff,
  Copy,
  Check,
  Activity,
  Server,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuthStore, getRoleDashboardPath } from '@/lib/store/useAuthStore';
import { checkBackendHealth } from '@/lib/api/auth';
import clsx from 'clsx';

const ROLE_OPTIONS = [
  { label: 'Super Admin', value: 'SUPER_ADMIN', email: 'admin@landguard.ai', desc: 'Central System Admin' },
  { label: 'Project Head', value: 'PROJECT_HEAD', email: 'head@landguard.ai', desc: 'Director National Corridors' },
  { label: 'District Officer', value: 'DISTRICT_OFFICER', email: 'district@landguard.ai', desc: 'District Collector' },
  { label: 'Land Acquisition Officer', value: 'LAND_ACQUISITION_OFFICER', email: 'lao@landguard.ai', desc: 'Special LAO Corridor' },
  { label: 'Field Officer', value: 'FIELD_OFFICER', email: 'field@landguard.ai', desc: 'Cadastral Surveyor' },
  { label: 'Supervisor', value: 'SUPERVISOR', email: 'supervisor@landguard.ai', desc: 'Quality & Verification' },
  { label: 'Citizen', value: 'CITIZEN', email: 'citizen@landguard.ai', desc: 'Landowner / Grievances' },
  { label: 'Contractor', value: 'CONTRACTOR', email: 'contractor@landguard.ai', desc: 'EPC Infrastructure' },
];

const DISTRICT_OPTIONS = [
  'Chennai',
  'Salem',
  'Coimbatore',
  'Madurai',
  'Tiruchirappalli',
  'Krishnagiri',
  'Bengaluru Rural',
  'Pune',
  'Ernakulam',
  'Rangareddy',
];

export default function SignInPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const loginDemo = useAuthStore((s) => s.loginDemo);
  const register = useAuthStore((s) => s.register);

  // Tab: 'signin' | 'signup'
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Sign In Form State
  const [email, setEmail] = useState('admin@landguard.ai');
  const [password, setPassword] = useState('LandGuard@2026');
  const [selectedRoleUx, setSelectedRoleUx] = useState('SUPER_ADMIN');
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up Form State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDistrict, setRegDistrict] = useState('Chennai');
  const [regAddress, setRegAddress] = useState('');
  const [regRole, setRegRole] = useState<'CITIZEN' | 'CONTRACTOR'>('CITIZEN');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendOffline, setBackendOffline] = useState(false);
  const [backendStatusChecked, setBackendStatusChecked] = useState(false);
  const [backendIsLive, setBackendIsLive] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Probe backend on mount
  useEffect(() => {
    let mounted = true;
    checkBackendHealth().then((res) => {
      if (mounted) {
        setBackendIsLive(res.isOnline);
        setBackendStatusChecked(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleRoleSelect = (roleValue: string) => {
    setSelectedRoleUx(roleValue);
    const found = ROLE_OPTIONS.find((r) => r.value === roleValue);
    if (found) {
      setEmail(found.email);
      setPassword('LandGuard@2026');
      setError(null);
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText('LandGuard@2026');
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setBackendOffline(false);

    try {
      const authRes = await login(email.trim(), password);
      const dest = getRoleDashboardPath(authRes.role);
      router.push(dest);
    } catch (err: any) {
      const msg = err?.message || 'Authentication failed. Please verify credentials.';
      const isConnectionError =
        msg.toLowerCase().includes('backend unavailable') ||
        msg.toLowerCase().includes('failed to fetch') ||
        msg.toLowerCase().includes('network error') ||
        msg.toLowerCase().includes('connection refused');

      if (isConnectionError) {
        setBackendOffline(true);
        setError(
          'Backend server is not running on port 8000. Start it with uvicorn or click "Continue in Demo Mode" below to proceed immediately.'
        );
      } else {
        setError(msg);
      }
      setLoading(false);
    }
  };

  const handleOfflineDemoLogin = (roleOverride?: string) => {
    const chosenRole = roleOverride || selectedRoleUx;
    const authRes = loginDemo(email.trim() || 'admin@landguard.ai', chosenRole);
    const dest = getRoleDashboardPath(authRes.role);
    router.push(dest);
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regEmail || !regPassword) {
      setError('Please fill in all required fields.');
      return;
    }
    if (regPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await register({
        fullName: regFullName.trim(),
        email: regEmail.trim().toLowerCase(),
        phone: regPhone.trim() || '+91 90000-00000',
        district: regDistrict,
        address: regAddress.trim() || undefined,
        role: regRole,
        password: regPassword,
      });

      setSuccessMsg('Account created successfully in database! Signing in…');

      // Auto-login newly registered citizen/contractor
      const authRes = await login(regEmail.trim().toLowerCase(), regPassword);
      const dest = getRoleDashboardPath(authRes.role);
      setTimeout(() => {
        router.push(dest);
      }, 800);
    } catch (err: any) {
      const msg = err?.message || 'Registration failed. Email may already be registered.';
      const isConnectionError =
        msg.toLowerCase().includes('backend unavailable') ||
        msg.toLowerCase().includes('failed to fetch') ||
        msg.toLowerCase().includes('network error');

      if (isConnectionError) {
        setBackendOffline(true);
        setError('FastAPI backend is offline. You can proceed directly with offline simulation.');
      } else {
        setError(msg);
      }
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-screen flex-col items-center justify-center overflow-x-hidden bg-[#040c12] p-4 font-body text-txt-primary">
      {/* Background GIS Grid Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#0a2533]/40 via-void to-black opacity-80 pointer-events-none" />
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 229, 255, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 229, 255, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Main Sign In / Sign Up Modal Container */}
      <div className="relative z-10 w-full max-w-lg">
        {/* Top Header & Insignia */}
        <div className="mb-4 text-center">
          <div className="mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan/40 bg-gradient-to-br from-[#0e3042] to-[#051620] shadow-[0_0_25px_rgba(0,229,255,0.25)]">
            <ShieldCheck className="h-6 w-6 text-cyan" strokeWidth={2.4} />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-wide text-white">
            LANDGUARD <span className="text-cyan">AI</span>
          </h1>
          <p className="mt-0.5 text-[12px] text-txt-secondary">
            Predictive Analytics & Land Acquisition Decision Support System
          </p>

          {/* Backend Status Live Badge */}
          {backendStatusChecked && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-hair px-2.5 py-0.5 text-[10.5px] font-mono">
              <span
                className={clsx(
                  'h-2 w-2 rounded-full',
                  backendIsLive ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]' : 'bg-amber-400'
                )}
              />
              <span className="text-txt-secondary">
                {backendIsLive ? 'Backend Online (FastAPI :8000)' : 'Backend Standby (FastAPI / Demo Ready)'}
              </span>
            </div>
          )}
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="mb-3 grid grid-cols-2 gap-1.5 rounded-xl border border-hair bg-panel p-1">
          <button
            type="button"
            onClick={() => {
              setAuthMode('signin');
              setError(null);
              setSuccessMsg(null);
            }}
            className={clsx(
              'rounded-lg py-2 text-center font-mono text-[12px] font-bold transition-all',
              authMode === 'signin'
                ? 'bg-cyan-glow border border-cyanline text-cyan shadow-sm'
                : 'text-txt-tertiary hover:text-white'
            )}
          >
            SIGN IN
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setError(null);
              setSuccessMsg(null);
            }}
            className={clsx(
              'flex items-center justify-center gap-1.5 rounded-lg py-2 text-center font-mono text-[12px] font-bold transition-all',
              authMode === 'signup'
                ? 'bg-teal-500/20 border border-teal-400/40 text-teal-300 shadow-sm'
                : 'text-txt-tertiary hover:text-white'
            )}
          >
            <UserPlus className="h-3.5 w-3.5" /> CREATE ACCOUNT
          </button>
        </div>

        {/* Card Form Panel */}
        <div className="rounded-2xl border border-hair/80 bg-raised/90 p-5 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-4 rounded-xl border border-risk-critical/40 bg-risk-critical/15 p-3.5 text-[12px] text-risk-critical">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold">{backendOffline ? 'FastAPI Backend Offline' : 'Authentication Error'}</div>
                  <div className="text-[11.5px] opacity-90 mt-0.5">{error}</div>
                </div>
              </div>

              {backendOffline && (
                <div className="mt-3 pt-3 border-t border-risk-critical/20 flex flex-col gap-2">
                  <div className="text-[11px] text-txt-secondary font-mono">
                    To start FastAPI backend in terminal:
                    <div className="mt-1 p-2 rounded bg-black/60 text-cyan text-[10.5px]">
                      uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOfflineDemoLogin()}
                    className="flex items-center justify-center gap-2 rounded-lg bg-cyan/20 border border-cyan/40 px-3 py-2 text-[12px] font-bold text-cyan hover:bg-cyan/30 transition-colors"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    <span>Proceed in Offline Demo Mode ({selectedRoleUx})</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-3 text-[12px] text-emerald-300">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Success</div>
                <div className="text-[11.5px] opacity-90">{successMsg}</div>
              </div>
            </div>
          )}

          {authMode === 'signin' ? (
            /* --- SIGN IN FORM --- */
            <form onSubmit={handleSignInSubmit} className="space-y-3.5">
              {/* Email / Username */}
              <div>
                <label className="mb-1 block font-mono text-[11px] font-medium uppercase tracking-wider text-txt-tertiary">
                  Email / Account
                </label>
                <div className="relative flex items-center rounded-xl border border-hair bg-panel2 px-3 py-2 text-txt-secondary focus-within:border-cyan focus-within:text-cyan transition-colors">
                  <Mail className="h-4 w-4 mr-2.5 flex-shrink-0 text-txt-tertiary" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@landguard.ai"
                    required
                    className="w-full bg-transparent text-[13px] text-txt-primary outline-none placeholder:text-txt-tertiary font-mono"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block font-mono text-[11px] font-medium uppercase tracking-wider text-txt-tertiary">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="flex items-center gap-1 font-mono text-[10px] text-cyan hover:underline"
                    title="Copy default password"
                  >
                    {copiedPassword ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied LandGuard@2026</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Default: LandGuard@2026</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="relative flex items-center rounded-xl border border-hair bg-panel2 px-3 py-2 text-txt-secondary focus-within:border-cyan focus-within:text-cyan transition-colors">
                  <Lock className="h-4 w-4 mr-2.5 flex-shrink-0 text-txt-tertiary" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="w-full bg-transparent text-[13px] text-txt-primary outline-none placeholder:text-txt-tertiary font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="ml-2 text-txt-tertiary hover:text-white transition-colors focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Role Quick Selector */}
              <div>
                <label className="mb-1 block font-mono text-[11px] font-medium uppercase tracking-wider text-txt-tertiary">
                  Target Role Preset
                </label>
                <div className="relative flex items-center rounded-xl border border-hair bg-panel2 px-3 py-1.5 text-txt-secondary">
                  <UserCheck className="h-4 w-4 mr-2.5 flex-shrink-0 text-cyan" />
                  <select
                    value={selectedRoleUx}
                    onChange={(e) => handleRoleSelect(e.target.value)}
                    className="w-full bg-transparent text-[12px] text-txt-primary outline-none cursor-pointer"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value} className="bg-raised text-white">
                        {r.label} ({r.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-1 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={clsx(
                    'group flex w-full items-center justify-center gap-2 rounded-xl border border-transparent bg-gradient-to-r from-cyan via-cyan-bright to-cyan-dim py-2.5 text-[13.5px] font-bold text-[#05131a] shadow-[0_0_25px_rgba(0,229,255,0.4)] transition-all hover:opacity-95',
                    loading && 'opacity-70 cursor-not-allowed'
                  )}
                >
                  {loading ? (
                    <span className="flex items-center gap-2 font-mono text-[12px]">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#05131a] border-t-transparent" />
                      Authenticating with Backend…
                    </span>
                  ) : (
                    <>
                      <span>SIGN IN</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleOfflineDemoLogin()}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-hair bg-panel/60 py-2 text-[11.5px] font-medium text-txt-secondary hover:border-cyan/40 hover:text-cyan transition-all"
                >
                  <Sparkles className="h-3.5 w-3.5 text-cyan" />
                  <span>Instant Demo Login (Bypass Network Check)</span>
                </button>
              </div>
            </form>
          ) : (
            /* --- SIGN UP (CITIZEN / CONTRACTOR) FORM --- */
            <form onSubmit={handleSignUpSubmit} className="space-y-3">
              {/* Role Type Selection (Citizen vs Contractor) */}
              <div>
                <label className="mb-1 block font-mono text-[10.5px] font-medium uppercase tracking-wider text-txt-tertiary">
                  Register As
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('CITIZEN')}
                    className={clsx(
                      'rounded-lg border p-2 text-left text-[11.5px] transition-all',
                      regRole === 'CITIZEN'
                        ? 'border-teal-400/50 bg-teal-500/20 text-teal-300 font-bold'
                        : 'border-hair bg-panel2/60 text-txt-secondary hover:border-mid'
                    )}
                  >
                    <div>Citizen / Land Owner</div>
                    <div className="text-[9.5px] text-txt-tertiary font-normal">Track parcels & grievances</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('CONTRACTOR')}
                    className={clsx(
                      'rounded-lg border p-2 text-left text-[11.5px] transition-all',
                      regRole === 'CONTRACTOR'
                        ? 'border-orange-400/50 bg-orange-500/20 text-orange-300 font-bold'
                        : 'border-hair bg-panel2/60 text-txt-secondary hover:border-mid'
                    )}
                  >
                    <div>EPC Contractor</div>
                    <div className="text-[9.5px] text-txt-tertiary font-normal">Work packages & change reqs</div>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="mb-1 block font-mono text-[10.5px] font-medium uppercase tracking-wider text-txt-tertiary">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. K. Sundararajan"
                  required
                  className="w-full rounded-xl border border-hair bg-panel2 px-3 py-1.5 text-[12.5px] text-txt-primary outline-none focus:border-teal-400"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block font-mono text-[10.5px] font-medium uppercase tracking-wider text-txt-tertiary">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                    className="w-full rounded-xl border border-hair bg-panel2 px-3 py-1.5 font-mono text-[12px] text-txt-primary outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-mono text-[10.5px] font-medium uppercase tracking-wider text-txt-tertiary">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91 94440-12345"
                    className="w-full rounded-xl border border-hair bg-panel2 px-3 py-1.5 font-mono text-[12px] text-txt-primary outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              {/* District & Address */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block font-mono text-[10.5px] font-medium uppercase tracking-wider text-txt-tertiary">
                    District
                  </label>
                  <select
                    value={regDistrict}
                    onChange={(e) => setRegDistrict(e.target.value)}
                    className="w-full rounded-xl border border-hair bg-panel2 px-3 py-1.5 text-[12px] text-txt-primary outline-none cursor-pointer focus:border-teal-400"
                  >
                    {DISTRICT_OPTIONS.map((d) => (
                      <option key={d} value={d} className="bg-raised">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-mono text-[10.5px] font-medium uppercase tracking-wider text-txt-tertiary">
                    Village / Address
                  </label>
                  <input
                    type="text"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="Plot 14, Ward 3"
                    className="w-full rounded-xl border border-hair bg-panel2 px-3 py-1.5 text-[12px] text-txt-primary outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block font-mono text-[10.5px] font-medium uppercase tracking-wider text-txt-tertiary">
                    Password *
                  </label>
                  <div className="relative flex items-center rounded-xl border border-hair bg-panel2 px-2.5 py-1.5 focus-within:border-teal-400">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 8 chars"
                      required
                      className="w-full bg-transparent font-mono text-[12px] text-txt-primary outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="ml-1 text-txt-tertiary hover:text-white transition-colors"
                    >
                      {showRegPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block font-mono text-[10.5px] font-medium uppercase tracking-wider text-txt-tertiary">
                    Confirm Password *
                  </label>
                  <div className="relative flex items-center rounded-xl border border-hair bg-panel2 px-2.5 py-1.5 focus-within:border-teal-400">
                    <input
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      required
                      className="w-full bg-transparent font-mono text-[12px] text-txt-primary outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="ml-1 text-txt-tertiary hover:text-white transition-colors"
                    >
                      {showRegConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Register */}
              <button
                type="submit"
                disabled={loading}
                className={clsx(
                  'group mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-transparent bg-gradient-to-r from-teal-500 to-emerald-400 py-2.5 text-[13px] font-bold text-[#05131a] shadow-[0_0_20px_rgba(20,184,166,0.3)] transition-all hover:opacity-95',
                  loading && 'opacity-70 cursor-not-allowed'
                )}
              >
                {loading ? (
                  <span className="flex items-center gap-2 font-mono text-[12px]">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#05131a] border-t-transparent" />
                    Creating Database Record…
                  </span>
                ) : (
                  <>
                    <span>CREATE ACCOUNT</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo Switcher Badges (Only in Sign In Mode) */}
          {authMode === 'signin' && (
            <div className="mt-4 border-t border-hair/80 pt-3">
              <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-txt-tertiary">
                <span className="flex items-center gap-1">
                  <KeyRound className="h-3 w-3 text-cyan" /> Quick Role Autofill
                </span>
                <span className="text-cyan">Click to load</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleRoleSelect(opt.value)}
                    className={clsx(
                      'flex flex-col items-start rounded-lg border p-1.5 text-left transition-all',
                      selectedRoleUx === opt.value
                        ? 'border-cyanline bg-cyan-glow/30 text-cyan font-bold shadow-sm'
                        : 'border-hair bg-panel2/60 text-txt-secondary hover:border-mid hover:text-white'
                    )}
                  >
                    <span className="text-[11px] truncate w-full">{opt.label}</span>
                    <span className="text-[9px] text-txt-tertiary truncate w-full font-mono">{opt.email.split('@')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Security Badges */}
        <div className="mt-3 text-center space-y-1">
          <div className="font-mono text-[11px] text-txt-secondary">
            Secure Role-Based Access • Public Citizen & Contractor Portal
          </div>
          <div className="font-mono text-[10px] text-txt-tertiary">
            Demo Credentials: <span className="text-cyan font-semibold">admin@landguard.ai</span> / <span className="text-cyan font-semibold">LandGuard@2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
