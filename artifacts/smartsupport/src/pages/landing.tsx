import { Link } from "wouter";
import { useMemo, useEffect, useRef, useState } from "react";
import {
  Bot, Zap, Shield, BarChart3, Code2, Globe, Check, ArrowRight,
  MessageSquare, Star, Users, TrendingUp, Sparkles, ChevronRight, Menu, X
} from "lucide-react";

const getFeatures = () => [
  { icon: Bot, title: "Custom AI Chatbots", description: "Train chatbots exclusively on your docs and knowledge base. No hallucinations — only answers grounded in your data.", color: "#3b82f6" },
  { icon: Zap, title: "One-Line Embed", description: "Paste a single script tag and your chatbot goes live instantly. No complex integrations required.", color: "#f59e0b" },
  { icon: Shield, title: "Context-Aware Responses", description: "Powered by GPT-4o with RAG retrieval. The AI only responds using your uploaded content.", color: "#10b981" },
  { icon: BarChart3, title: "Conversation Analytics", description: "Track every conversation and understand what your customers are asking about in real-time.", color: "#8b5cf6" },
  { icon: Code2, title: "Developer Friendly", description: "Clean REST API, embeddable widget, and full conversation history. Integrate with your existing stack.", color: "#ec4899" },
  { icon: Globe, title: "Multi-Platform", description: "Embed on any website, e-commerce store, or SaaS product. One chatbot, everywhere.", color: "#06b6d4" },
];

const getPlans = () => [
  {
    name: "Free", price: "$0", period: "/mo",
    description: "Try SmartSupport with no commitment.",
    features: ["1 chatbot", "10 documents", "100 conversations/mo", "Community support", "Basic analytics"],
    cta: "Get started free", highlighted: false, badge: null,
  },
  {
    name: "Basic", price: "$29", period: "/mo",
    description: "Perfect for small businesses.",
    features: ["2 chatbots", "50 documents", "1,000 conversations/mo", "Email support", "Basic analytics"],
    cta: "Start free trial", highlighted: false, badge: null,
  },
  {
    name: "Pro", price: "$99", period: "/mo",
    description: "For growing teams that need more power.",
    features: ["10 chatbots", "500 documents", "10,000 conversations/mo", "Priority support", "Advanced analytics", "Custom branding", "API access"],
    cta: "Start free trial", highlighted: true, badge: "Most popular",
  },
  {
    name: "Enterprise", price: "$399", period: "/mo",
    description: "Full-scale for serious support needs.",
    features: ["Unlimited chatbots", "Unlimited documents", "Unlimited conversations", "Dedicated support", "SSO & SAML", "SLA guarantee", "Custom integrations"],
    cta: "Contact sales", highlighted: false, badge: null,
  },
];

export default function LandingPage() {
  const features = useMemo(() => getFeatures(), []);
  const plans = useMemo(() => getPlans(), []);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();

    // Fewer particles on mobile for performance
    const count = window.innerWidth < 768 ? 25 : 60;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
      });
    }

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${p.opacity})`;
        ctx.fill();
      });
      particles.forEach((p, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const d = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.15 * (1 - d / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      animId = requestAnimationFrame(animate);
    };
    animate();

    window.addEventListener("resize", setSize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", setSize); };
  }, []);

  return (
    <div className="min-h-screen bg-[#020817] text-white overflow-x-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Syne:wght@700;800&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        .glow { box-shadow: 0 0 40px rgba(99,102,241,0.3); }
        .glow-sm { box-shadow: 0 0 20px rgba(99,102,241,0.2); }
        .gradient-text {
          background: linear-gradient(135deg, #ffffff 0%, #a5b4fc 50%, #818cf8 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .gradient-text-gold {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .card-glass {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(10px);
        }
        .card-glass:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(99,102,241,0.3);
          transform: translateY(-2px);
          transition: all 0.3s ease;
        }
        .hero-glow { background: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.25), transparent); }
        .nav-glass { background: rgba(2,8,23,0.9); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.06); }
        .btn-primary { background: linear-gradient(135deg, #4f46e5, #7c3aed); border: none; transition: all 0.3s ease; }
        .btn-primary:hover { background: linear-gradient(135deg, #4338ca, #6d28d9); transform: translateY(-1px); box-shadow: 0 8px 25px rgba(99,102,241,0.4); }
        .tag-pill { background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.3); color: #a5b4fc; }
        .plan-popular { background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(124,58,237,0.15)); border: 1px solid rgba(99,102,241,0.4); }
        .plan-free { background: rgba(16,185,129,0.05); border: 1px solid rgba(16,185,129,0.2); }
        .chat-bubble-user { background: linear-gradient(135deg, #4f46e5, #7c3aed); }
        .chat-bubble-bot { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); }
        .stat-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); }
        .mobile-menu { background: rgba(2,8,23,0.98); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.08); }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(99,102,241,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(99,102,241,0); }
        }
        .animate-fadeup { animation: fadeUp 0.8s ease forwards; }
        .animate-fadeup-delay-1 { animation: fadeUp 0.8s ease 0.1s both; }
        .animate-fadeup-delay-2 { animation: fadeUp 0.8s ease 0.2s both; }
        .animate-fadeup-delay-3 { animation: fadeUp 0.8s ease 0.3s both; }
        .live-dot { animation: pulse-ring 2s infinite; }
        * { box-sizing: border-box; }
      `}</style>

      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none opacity-60" style={{ zIndex: 0 }} />

      {/* Nav */}
      <nav className="nav-glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg btn-primary flex items-center justify-center glow-sm flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-base sm:text-lg font-bold tracking-tight">SmartSupport</span>
            <span className="tag-pill text-xs px-2 py-0.5 rounded-full font-medium hidden sm:inline">AI</span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8 text-sm text-white/50">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#demo" className="hover:text-white transition-colors">Demo</a>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/sign-in">
              <button className="text-sm text-white/70 hover:text-white transition-colors px-4 py-2">Sign in</button>
            </Link>
            <Link href="/sign-up">
              <button className="btn-primary text-sm font-medium px-5 py-2 rounded-lg text-white flex items-center gap-2">
                Get started <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>

          {/* Mobile: Sign in + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <Link href="/sign-in">
              <button className="text-sm text-white/70 hover:text-white transition-colors px-3 py-1.5">Sign in</button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-lg card-glass text-white/70 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="mobile-menu md:hidden px-4 py-4 space-y-1">
            {[["#features", "Features"], ["#pricing", "Pricing"], ["#demo", "Demo"]].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium">
                {label}
              </a>
            ))}
            <div className="pt-2 border-t border-white/8">
              <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                <button className="btn-primary w-full py-3 rounded-xl text-sm font-semibold text-white mt-2">
                  Get started free
                </button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      <main id="main-content" className="relative" style={{ zIndex: 1 }}>

        {/* Hero */}
        <section className="relative pt-16 sm:pt-24 pb-16 sm:pb-24 px-4 sm:px-6">
          <div className="hero-glow absolute inset-0 pointer-events-none" />
          <div className="max-w-5xl mx-auto text-center">
            <div className="tag-pill inline-flex items-center gap-2 text-xs font-medium px-3 sm:px-4 py-2 rounded-full mb-6 sm:mb-8 animate-fadeup">
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Powered by GPT-4o + RAG — Production ready</span>
            </div>

            <h1 className="font-display text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tight mb-5 sm:mb-6 leading-[0.95] animate-fadeup-delay-1">
              <span className="gradient-text">AI support</span>
              <br />
              <span className="text-white">built for your</span>
              <br />
              <span className="gradient-text-gold">business</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed animate-fadeup-delay-2 px-2">
              Upload your docs, train a custom AI assistant, and embed it anywhere in minutes.
              Context-aware support that knows your product inside out.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6 animate-fadeup-delay-3 px-4 sm:px-0">
              <Link href="/sign-up" className="w-full sm:w-auto">
                <button className="btn-primary text-base font-semibold px-8 py-3.5 rounded-xl text-white flex items-center justify-center gap-2.5 glow w-full sm:w-auto">
                  Start building free
                  <ArrowRight className="w-4 h-4 flex-shrink-0" />
                </button>
              </Link>
              <Link href="/sign-in" className="w-full sm:w-auto">
                <button className="card-glass text-base font-medium px-8 py-3.5 rounded-xl text-white/80 hover:text-white flex items-center justify-center gap-2 transition-all w-full sm:w-auto">
                  Sign in to dashboard
                  <ChevronRight className="w-4 h-4 flex-shrink-0" />
                </button>
              </Link>
            </div>
            <p className="text-xs text-white/30 animate-fadeup-delay-3">No credit card required · 14-day free trial · Cancel anytime</p>
          </div>
        </section>

        {/* Stats */}
        <section className="py-10 sm:py-12 px-4 sm:px-6 border-y border-white/5">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {[
              { value: "10k+", label: "Daily conversations", icon: MessageSquare, color: "#818cf8" },
              { value: "98%", label: "Response accuracy", icon: TrendingUp, color: "#34d399" },
              { value: "500+", label: "Businesses", icon: Users, color: "#f59e0b" },
              { value: "4.9★", label: "Average rating", icon: Star, color: "#f472b6" },
            ].map((stat) => (
              <div key={stat.label} className="stat-card rounded-2xl p-4 sm:p-5 text-center">
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-1">
                  <stat.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" style={{ color: stat.color }} />
                  <span className="font-display text-2xl sm:text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</span>
                </div>
                <p className="text-xs text-white/40 font-medium leading-tight">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Demo */}
        <section id="demo" className="py-16 sm:py-24 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
                <span className="gradient-text">See it in action</span>
              </h2>
              <p className="text-white/40 text-base sm:text-lg">Your chatbot answers instantly from your knowledge base</p>
            </div>

            <div className="card-glass rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 glow-sm">
              {/* Chat messages - always visible */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 mb-4 sm:mb-6">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 live-dot flex-shrink-0" />
                  <span className="text-xs text-white/40 font-medium tracking-wider uppercase">Live preview</span>
                </div>
                {[
                  { role: "user", text: "What's your refund policy?" },
                  { role: "bot", text: "We offer a 30-day money-back guarantee on all plans. Contact support with your order number — refunds processed within 5-7 business days." },
                  { role: "user", text: "How do I cancel my subscription?" },
                  { role: "bot", text: "Cancel anytime from Settings → Billing. Your access continues until the end of the billing period." },
                ].map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] sm:max-w-sm px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "chat-bubble-user text-white rounded-br-sm"
                        : "chat-bubble-bot text-white/80 rounded-bl-sm"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Code snippet - only on larger screens */}
              <div className="hidden md:flex items-start gap-10 mt-8 pt-8 border-t border-white/8">
                <div className="flex-1" />
                <div className="w-64 space-y-4 flex-shrink-0">
                  <p className="text-xs font-semibold text-white/30 uppercase tracking-widest">Embed in seconds</p>
                  <div className="rounded-xl p-5 font-mono text-xs leading-relaxed" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <span className="text-white/30">{"<"}</span><span className="text-indigo-400">script</span><br />
                    <span className="text-violet-400 pl-3">src</span><span className="text-white/30">="</span><span className="text-emerald-400">/widget.js</span><span className="text-white/30">"</span><br />
                    <span className="text-violet-400 pl-3">data-uid</span><span className="text-white/30">="</span><span className="text-amber-400">your-uid</span><span className="text-white/30">"</span><br />
                    <span className="text-white/30">{">"}</span><span className="text-white/30">{"</"}script{">"}</span>
                  </div>
                  <p className="text-xs text-white/30">That's it. Your chatbot is live instantly.</p>
                </div>
              </div>

              {/* Mobile code snippet */}
              <div className="md:hidden mt-6 pt-6 border-t border-white/8">
                <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">Embed in seconds</p>
                <div className="rounded-xl p-4 font-mono text-xs leading-relaxed overflow-x-auto" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span className="text-white/30">{"<"}</span><span className="text-indigo-400">script </span>
                  <span className="text-violet-400">src</span><span className="text-white/30">="</span><span className="text-emerald-400">/widget.js</span><span className="text-white/30">" </span>
                  <span className="text-violet-400">data-uid</span><span className="text-white/30">="</span><span className="text-amber-400">uid</span><span className="text-white/30">"></span><span className="text-white/30">{"</"}script{">"}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10 sm:mb-16">
              <span className="tag-pill text-xs px-3 py-1 rounded-full font-medium inline-block mb-4">Features</span>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4 gradient-text">Everything you need</h2>
              <p className="text-white/40 max-w-xl mx-auto text-base sm:text-lg px-2">
                From knowledge base management to embeddable widgets — the full stack covered.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {features.map((feature) => (
                <div key={feature.title} className="card-glass rounded-2xl p-5 sm:p-7 group cursor-default transition-all duration-300">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-4 sm:mb-5 transition-transform group-hover:scale-110"
                    style={{ background: `${feature.color}18`, border: `1px solid ${feature.color}30` }}>
                    <feature.icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: feature.color }} />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg mb-2 text-white">{feature.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10 sm:mb-16">
              <span className="tag-pill text-xs px-3 py-1 rounded-full font-medium inline-block mb-4">Pricing</span>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4 gradient-text">Simple pricing</h2>
              <p className="text-white/40 text-base sm:text-lg">Start free, scale as you grow. No hidden fees.</p>
            </div>

            {/* Free plan callout on mobile */}
            <div className="md:hidden mb-6 plan-free rounded-2xl p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-display text-xl font-bold text-white">Free</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)" }}>$0/mo</span>
                </div>
                <p className="text-xs text-white/40">1 chatbot · 10 docs · 100 conversations</p>
              </div>
              <Link href="/sign-up">
                <button className="btn-primary text-xs font-semibold px-4 py-2.5 rounded-xl text-white whitespace-nowrap">
                  Start free
                </button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {plans.map((plan) => (
                <div key={plan.name}
                  className={`rounded-2xl p-5 sm:p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                    plan.highlighted ? "plan-popular glow" :
                    plan.name === "Free" ? "plan-free hidden md:flex" :
                    "card-glass"
                  }`}>
                  {plan.badge && (
                    <div className="inline-flex items-center gap-1.5 tag-pill text-xs font-semibold px-3 py-1 rounded-full self-start mb-3">
                      <Sparkles className="w-3 h-3" /> {plan.badge}
                    </div>
                  )}
                  {plan.name === "Free" && (
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full self-start mb-3"
                      style={{ background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)" }}>
                      ✦ Always free
                    </div>
                  )}
                  <h3 className="font-display text-xl sm:text-2xl font-bold mb-1 text-white">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="font-display text-3xl sm:text-4xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-white/30 text-sm">{plan.period}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-white/40 mb-4 sm:mb-5 leading-relaxed">{plan.description}</p>
                  <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 flex-1">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 text-xs sm:text-sm text-white/70">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: plan.name === "Free" ? "rgba(16,185,129,0.2)" : "rgba(99,102,241,0.2)", border: plan.name === "Free" ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(99,102,241,0.3)" }}>
                          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" style={{ color: plan.name === "Free" ? "#34d399" : "#818cf8" }} />
                        </div>
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Link href="/sign-up">
                    <button className={`w-full py-2.5 sm:py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      plan.highlighted ? "btn-primary text-white glow-sm" :
                      plan.name === "Free" ? "text-emerald-400 font-semibold" :
                      "card-glass text-white/70 hover:text-white"
                    }`}
                    style={plan.name === "Free" ? { background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" } : {}}>
                      {plan.cta}
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/5">
          <div className="max-w-3xl mx-auto text-center">
            <div className="rounded-2xl sm:rounded-3xl p-8 sm:p-14 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.2), rgba(124,58,237,0.2))", border: "1px solid rgba(99,102,241,0.3)" }}>
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10 pointer-events-none" />
              <div className="relative">
                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4 gradient-text">
                  Ready to get started?
                </h2>
                <p className="text-white/50 mb-8 sm:mb-10 text-base sm:text-lg max-w-xl mx-auto px-2">
                  Join hundreds of businesses delivering better customer support with SmartSupport AI.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 px-4 sm:px-0">
                  <Link href="/sign-up" className="w-full sm:w-auto">
                    <button className="btn-primary text-base font-semibold px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl text-white flex items-center justify-center gap-2.5 glow w-full sm:w-auto">
                      Start for free <ArrowRight className="w-4 h-4 flex-shrink-0" />
                    </button>
                  </Link>
                  <Link href="/sign-in" className="w-full sm:w-auto">
                    <button className="card-glass text-base font-medium px-8 py-3.5 rounded-xl text-white/70 hover:text-white w-full sm:w-auto">
                      Sign in
                    </button>
                  </Link>
                </div>
                <p className="text-xs text-white/20 mt-4">No credit card required</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 sm:py-10 px-4 sm:px-6" style={{ zIndex: 1, position: "relative" }}>
        <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-sm text-white/30">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg btn-primary flex items-center justify-center flex-shrink-0">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-white/70">SmartSupport AI</span>
          </div>
          <p className="text-xs text-center sm:text-left">Built with GPT-4o and pgvector. All conversations are private.</p>
          <div className="flex gap-5 text-xs">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link href="/sign-in" className="hover:text-white transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
