import { Link } from "wouter";
import { useMemo, useEffect, useRef, useState } from "react";
import {
  Bot, Zap, Shield, BarChart3, Code2, Globe, Check, ArrowRight,
  MessageSquare, Star, Users, TrendingUp, Sparkles, ChevronRight, Menu, X,
  Upload, Brain, Code, Clock, Award, Headphones, Mail, Lock, User, XCircle
} from "lucide-react";

// ... (keep all your existing style, feature, plan, howItWorks data exactly as before)

export default function LandingPage() {
  // ... (keep all your existing state and canvas effect)

  // New state for auth modals
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [authError, setAuthError] = useState("");

  // Demo handlers - replace with real API calls later
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setAuthError("Please fill in email and password");
      return;
    }
    // Simulate success
    alert(`Demo: Account created for ${authEmail}. In production, this would redirect to dashboard.`);
    setShowSignUp(false);
    resetAuthForm();
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setAuthError("Please enter email and password");
      return;
    }
    alert(`Demo: Signed in as ${authEmail}. In production, you'd be redirected.`);
    setShowSignIn(false);
    resetAuthForm();
  };

  const resetAuthForm = () => {
    setAuthEmail("");
    setAuthPassword("");
    setFirstName("");
    setLastName("");
    setAuthError("");
  };

  // Modals JSX (add at the end of your main component, before the closing </div>)
  // I'll integrate them properly below

  return (
    <div className="min-h-screen bg-[#020817] text-white overflow-x-hidden">
      {/* ... your existing canvas, nav, hero, stats, demo, features, how-it-works, pricing, trust, final CTA, footer... */}
      {/* BUT replace all Link href="/sign-up" and "/sign-in" buttons with onClick handlers that open modals */}

      {/* Then add the two modals at the bottom */}

      {/* Sign In Modal */}
      {showSignIn && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowSignIn(false)}>
          <div className="relative w-full max-w-md card-glass rounded-2xl p-6 sm:p-8 animate-fadeup" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowSignIn(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
              <XCircle className="w-5 h-5" />
            </button>
            <h2 className="font-display text-2xl font-bold mb-2 gradient-text">Welcome back</h2>
            <p className="text-white/40 text-sm mb-6">Sign in to your SmartSupport AI account</p>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 transition" placeholder="you@example.com" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 transition" placeholder="••••••••" required />
                </div>
              </div>
              {authError && <p className="text-red-400 text-xs">{authError}</p>}
              <button type="submit" className="btn-primary w-full py-2.5 rounded-xl font-semibold">Sign in</button>
              <p className="text-center text-white/40 text-xs mt-2">
                Don't have an account? <button type="button" onClick={() => { setShowSignIn(false); setShowSignUp(true); }} className="text-indigo-400 hover:text-indigo-300">Sign up</button>
              </p>
              <p className="text-center text-white/20 text-[10px] mt-4">Demo mode — no CAPTCHA, no real authentication</p>
            </form>
          </div>
        </div>
      )}

      {/* Sign Up Modal */}
      {showSignUp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowSignUp(false)}>
          <div className="relative w-full max-w-md card-glass rounded-2xl p-6 sm:p-8 animate-fadeup" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowSignUp(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
              <XCircle className="w-5 h-5" />
            </button>
            <h2 className="font-display text-2xl font-bold mb-2 gradient-text">Create your account</h2>
            <p className="text-white/40 text-sm mb-6">Start your 14-day free trial. No credit card required.</p>
            <form onSubmit={handleSignUp} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1">First name <span className="text-white/30">(Optional)</span></label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500" placeholder="John" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1">Last name <span className="text-white/30">(Optional)</span></label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500" placeholder="Doe" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500" placeholder="you@example.com" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500" placeholder="Create a strong password" required />
                </div>
              </div>
              {authError && <p className="text-red-400 text-xs">{authError}</p>}
              <button type="submit" className="btn-primary w-full py-2.5 rounded-xl font-semibold">Start building free</button>
              <p className="text-center text-white/40 text-xs mt-2">
                Already have an account? <button type="button" onClick={() => { setShowSignUp(false); setShowSignIn(true); }} className="text-indigo-400 hover:text-indigo-300">Sign in</button>
              </p>
              <p className="text-center text-white/20 text-[10px] mt-2">Demo mode — no CAPTCHA, no real authentication. Replace with your own auth logic.</p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
