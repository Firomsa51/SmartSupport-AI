import { Link } from "wouter";
import { useMemo, useEffect, useRef, useState } from "react";
import {
  Bot, Zap, Shield, BarChart3, Code2, Globe, Check, ArrowRight,
  MessageSquare, Star, Users, TrendingUp, Sparkles, ChevronRight, Menu, X,
  Upload, Brain, Code, Clock, Award, Headphones, ChevronDown, RefreshCw
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

const howItWorksSteps = [
  { icon: Upload, title: "1. Upload your knowledge", description: "Add your docs, FAQs, help center, or website. SmartSupport AI ingests everything in seconds.", color: "#3b82f6" },
  { icon: Brain, title: "2. Train your AI assistant", description: "Our AI learns your content using GPT-4o + RAG. No coding — just smart, accurate responses.", color: "#8b5cf6" },
  { icon: Code, title: "3. Embed & go live", description: "Copy a single script tag. Your custom chatbot appears on your site instantly — done.", color: "#f59e0b" },
];

const testimonials = [
  { initials: "SC", name: "Sarah Chen", role: "Founder, ScaleFlow", content: "SmartSupport reduced our support workload by 70% in the first month.", rating: 5 },
  { initials: "MR", name: "Michael Rodriguez", role: "Head of Operations, BrightCommerce", content: "Our customers get instant answers 24/7 without increasing support costs.", rating: 5 },
  { initials: "EW", name: "Emma Wilson", role: "Customer Success Manager, CloudForge", content: "Setup took less than 10 minutes and the results were immediate.", rating: 5 },
];

const faqItems = [
  {
    question: "How does SmartSupport AI work?",
    answer: "SmartSupport uses GPT-4o and Retrieval-Augmented Generation (RAG) to answer questions using your own documents and knowledge base."
  },
  {
    question: "Can I upload PDFs and documents?",
    answer: "Yes. Upload PDFs, guides, FAQs, and other business documentation."
  },
  {
    question: "Does SmartSupport use GPT-4o?",
    answer: "Yes. SmartSupport is powered by GPT-4o with context-aware retrieval."
  },
  {
    question: "Can I customize the chatbot branding?",
    answer: "Yes. Pro and Enterprise plans support custom branding."
  },
  {
    question: "Is API access available?",
    answer: "Yes. API access is included in the Pro and Enterprise plans."
  },
  {
    question: "Are conversations private?",
    answer: "Yes. All conversations are private and protected with secure infrastructure."
  }
];

export default function LandingPage() {
  const features = useMemo(() => getFeatures(), []);
  const plans = useMemo(() => getPlans(), []);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  
  // Live chat state
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'bot', content: string}>>([
    { role: 'bot', content: "Hi! I'm SmartSupport AI. Ask me about pricing, refund policy, or API access using the buttons below." }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll chat to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const addBotMessage = (content: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setChatMessages(prev => [...prev, { role: 'bot', content }]);
      setIsTyping(false);
    }, 600);
  };

  const handleDemoButtonClick = (type: string) => {
    let userMessage = "";
    let botResponse = "";
    
    switch(type) {
      case "refund":
        userMessage = "What is your refund policy?";
        botResponse = "We offer a 30-day money-back guarantee on all plans. Contact support with your order number — refunds processed within 5-7 business days.";
        break;
      case "pricing":
        userMessage = "Tell me about your pricing plans";
        botResponse = "We offer Free, Basic ($29/mo), Pro ($99/mo), and Enterprise ($399/mo) plans. All paid plans include a 14-day free trial. Check our pricing section for details!";
        break;
      case "api":
        userMessage = "Do you have API access?";
        botResponse = "Yes! API access is included in Pro and Enterprise plans. You can integrate our AI into your existing systems with full REST API support.";
        break;
      case "cancel":
        userMessage = "How do I cancel my subscription?";
        botResponse = "Cancel anytime from Settings → Billing in your dashboard. Your access continues until the end of the billing period. No cancellation fees.";
        break;
      default:
        return;
    }
    
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    addBotMessage(botResponse);
  };

  const clearChat = () => {
    setChatMessages([
      { role: 'bot', content: "Chat cleared! Ask me about pricing, refund policy, or API access using the buttons below." }
    ]);
  };

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

    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 15 : 50;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.3 + 0.05,
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
          if (d < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.1 * (1 - d / 100)})`;
            ctx.lineWidth = 0.4;
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
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Syne:wght@700;800&display=swap');
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
        .chat-bubble-user { background: linear-gradient(135deg, #4f46e5, #7c3aed); }
        .chat-bubble-bot { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); }
        .stat-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); transition: all 0.3s ease; }
        .stat-card:hover { transform: translateY(-2px); background: rgba(255,255,255,0.05); border-color: rgba(99,102,241,0.3); }
        .mobile-menu { background: rgba(2,8,23,0.98); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.08); }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(99,102,241,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(99,102,241,0); }
        }
        @keyframes slideDown {
          from { opacity: 0; max-height: 0; transform: translateY(-10px); }
          to { opacity: 1; max-height: 200px; transform: translateY(0); }
        }
        .animate-fadeup { animation: fadeUp 0.8s ease forwards; }
        .animate-fadeup-delay-1 { animation: fadeUp 0.8s ease 0.1s both; }
        .animate-fadeup-delay-2 { animation: fadeUp 0.8s ease 0.2s both; }
        .animate-fadeup-delay-3 { animation: fadeUp 0.8s ease 0.3s both; }
        .live-dot { animation: pulse-ring 2s infinite; }
        .faq-answer { animation: slideDown 0.3s ease forwards; overflow: hidden; }
        * { box-sizing: border-box; }
        img, svg, video, canvas { max-width: 100%; height: auto; }
        p, h1, h2, h3, h4, li { word-break: break-word; }
        .messages-container { scroll-behavior: smooth; }
      `}</style>

      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none opacity-60" style={{ zIndex: 0 }} />

      {/* Nav */}
      <nav className="nav-glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg btn-primary flex items-center justify-center glow-sm flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-base sm:text-lg font-bold tracking-tight">SmartSupport</span>
            <span className="tag-pill text-xs px-2 py-0.5 rounded-full font-medium hidden sm:inline">AI</span>
          </div>

          <div className="hidden md:flex items-center gap-6 lg:gap-8 text-sm text-white/50">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#live-demo" className="hover:text-white transition-colors">Demo</a>
          </div>

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

          <div className="flex md:hidden items-center gap-2">
            <Link href="/sign-in">
              <button className="text-sm text-white/70 hover:text-white transition-colors px-3 py-1.5">Sign in</button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-lg card-glass text-white/70 hover:text-white"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="mobile-menu md:hidden px-4 py-4 space-y-1">
            {[["#features", "Features"], ["#how-it-works", "How it works"], ["#pricing", "Pricing"], ["#live-demo", "Demo"]].map(([href, label]) => (
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
        <section className="relative pt-12 sm:pt-20 pb-12 sm:pb-16 px-4 sm:px-6">
          <div className="hero-glow absolute inset-0 pointer-events-none" />
          <div className="max-w-5xl mx-auto text-center">
            <div className="tag-pill inline-flex items-center gap-2 text-xs font-medium px-3 sm:px-4 py-2 rounded-full mb-6 sm:mb-8 animate-fadeup">
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Powered by GPT-4o + RAG — Production ready</span>
            </div>

            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-5 sm:mb-6 leading-[1.1] sm:leading-[0.95] animate-fadeup-delay-1">
              <span className="gradient-text">AI support</span>
              <br className="hidden sm:block" />
              <span className="text-white">built for your</span>
              <br className="hidden sm:block" />
              <span className="gradient-text-gold">business</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed animate-fadeup-delay-2 px-2">
              Upload your docs, train a custom AI assistant, and embed it anywhere in minutes.
              Context-aware support that knows your product inside out.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6 animate-fadeup-delay-3 px-4 sm:px-0">
              <Link href="/sign-up" className="w-full sm:w-auto">
                <button className="btn-primary text-base font-semibold px-6 sm:px-8 py-3.5 rounded-xl text-white flex items-center justify-center gap-2.5 glow w-full sm:w-auto min-h-[48px]">
                  Start building free
                  <ArrowRight className="w-4 h-4 flex-shrink-0" />
                </button>
              </Link>
              <Link href="/sign-in" className="w-full sm:w-auto">
                <button className="card-glass text-base font-medium px-6 sm:px-8 py-3.5 rounded-xl text-white/80 hover:text-white flex items-center justify-center gap-2 transition-all w-full sm:w-auto min-h-[48px]">
                  Sign in to dashboard
                  <ChevronRight className="w-4 h-4 flex-shrink-0" />
                </button>
              </Link>
            </div>
            <p className="text-xs text-white/30 animate-fadeup-delay-3">No credit card required · 14-day free trial · Cancel anytime</p>
          </div>
        </section>

        {/* Live Demo Chatbot Section */}
        <section id="live-demo" className="py-16 sm:py-20 px-4 sm:px-6 border-t border-white/5">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10 sm:mb-12">
              <span className="tag-pill text-xs px-3 py-1 rounded-full font-medium inline-block mb-4">Live Demo</span>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
                <span className="gradient-text">See SmartSupport in Action</span>
              </h2>
              <p className="text-white/40 text-base sm:text-lg">Watch how your AI assistant answers customer questions instantly.</p>
            </div>

            <div className="card-glass rounded-2xl sm:rounded-3xl overflow-hidden">
              {/* Chat Messages Area */}
              <div className="h-[400px] sm:h-[450px] overflow-y-auto p-4 sm:p-6 messages-container flex flex-col gap-3">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fadeup`}>
                    <div className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-sm sm:text-base leading-relaxed ${
                      msg.role === "user"
                        ? "chat-bubble-user text-white rounded-br-sm"
                        : "chat-bubble-bot text-white/80 rounded-bl-sm"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start animate-fadeup">
                    <div className="chat-bubble-bot rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Demo Buttons */}
              <div className="border-t border-white/10 p-4 sm:p-6 bg-black/20">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-4">
                  <button
                    onClick={() => handleDemoButtonClick("refund")}
                    className="tag-pill text-xs sm:text-sm px-4 py-2 rounded-full hover:bg-indigo-500/20 transition-all hover:scale-105"
                  >
                    Refund Policy
                  </button>
                  <button
                    onClick={() => handleDemoButtonClick("pricing")}
                    className="tag-pill text-xs sm:text-sm px-4 py-2 rounded-full hover:bg-indigo-500/20 transition-all hover:scale-105"
                  >
                    Pricing
                  </button>
                  <button
                    onClick={() => handleDemoButtonClick("api")}
                    className="tag-pill text-xs sm:text-sm px-4 py-2 rounded-full hover:bg-indigo-500/20 transition-all hover:scale-105"
                  >
                    API Access
                  </button>
                  <button
                    onClick={() => handleDemoButtonClick("cancel")}
                    className="tag-pill text-xs sm:text-sm px-4 py-2 rounded-full hover:bg-indigo-500/20 transition-all hover:scale-105"
                  >
                    Cancel Subscription
                  </button>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={clearChat}
                    className="text-white/30 hover:text-white/60 text-xs flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Clear chat
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats - Improved Trust Signals */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 border-y border-white/5">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <span className="tag-pill text-xs px-3 py-1 rounded-full font-medium inline-block mb-4">Trusted by Industry Leaders</span>
              <h3 className="font-display text-2xl sm:text-3xl font-bold gradient-text">Powering modern support teams</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {[
                { value: "10,000+", label: "Daily Conversations", icon: MessageSquare, color: "#818cf8", suffix: "" },
                { value: "98%", label: "Response Accuracy", icon: TrendingUp, color: "#34d399", suffix: "" },
                { value: "500+", label: "Businesses", icon: Users, color: "#f59e0b", suffix: "" },
                { value: "4.9★", label: "Average Rating", icon: Star, color: "#f472b6", suffix: "" },
              ].map((stat, idx) => (
                <div key={stat.label} className="stat-card rounded-2xl p-5 sm:p-6 text-center group animate-fadeup" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-transform group-hover:scale-110" style={{ color: stat.color }} />
                    <span className="font-display text-2xl sm:text-3xl md:text-4xl font-bold transition-all" style={{ color: stat.color }}>{stat.value}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-white/50 font-medium tracking-wide">{stat.label}</p>
                </div>
              ))}
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

        {/* How It Works */}
        <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/5 bg-gradient-to-b from-transparent to-indigo-950/10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10 sm:mb-16">
              <span className="tag-pill text-xs px-3 py-1 rounded-full font-medium inline-block mb-4">Simple workflow</span>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4 gradient-text">How SmartSupport works</h2>
              <p className="text-white/40 max-w-2xl mx-auto text-base sm:text-lg px-2">
                Get from zero to AI-powered support in three easy steps — no engineering team required.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {howItWorksSteps.map((step, idx) => (
                <div key={step.title} className="card-glass rounded-2xl p-6 sm:p-8 text-center group hover:-translate-y-1 transition-all duration-300 relative">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform"
                    style={{ background: `${step.color}15`, border: `1px solid ${step.color}30` }}>
                    <step.icon className="w-8 h-8" style={{ color: step.color }} />
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold mb-3 text-white">{step.title}</h3>
                  <p className="text-white/50 text-sm sm:text-base leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <div className="inline-flex items-center gap-2 card-glass rounded-full px-5 py-2.5 text-sm">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span className="text-white/70">Average setup time: <strong className="text-white">&lt; 5 minutes</strong></span>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10 sm:mb-16">
              <span className="tag-pill text-xs px-3 py-1 rounded-full font-medium inline-block mb-4">Testimonials</span>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4 gradient-text">Trusted by Growing Businesses</h2>
              <p className="text-white/40 max-w-2xl mx-auto text-base sm:text-lg px-2">
                Teams use SmartSupport AI to reduce support workload and improve customer experience.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {testimonials.map((testimonial, idx) => (
                <div key={testimonial.name} className="card-glass rounded-2xl p-6 sm:p-8 group hover:-translate-y-2 transition-all duration-300 animate-fadeup" style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {testimonial.initials}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-base">{testimonial.name}</h4>
                      <p className="text-xs text-white/40">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-white/70 text-sm sm:text-base leading-relaxed">"{testimonial.content}"</p>
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
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4 gradient-text">Simple, transparent pricing</h2>
              <p className="text-white/40 text-base sm:text-lg">Start free, scale as you grow. No hidden fees.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {plans.map((plan) => (
                <div key={plan.name}
                  className={`rounded-2xl p-5 sm:p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                    plan.highlighted ? "plan-popular glow" : "card-glass"
                  }`}>
                  {plan.badge && (
                    <div className="inline-flex items-center gap-1.5 tag-pill text-xs font-semibold px-3 py-1 rounded-full self-start mb-3">
                      <Sparkles className="w-3 h-3" /> {plan.badge}
                    </div>
                  )}
                  {plan.name === "Free" && !plan.badge && (
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
                          style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)" }}>
                          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-indigo-400" />
                        </div>
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Link href="/sign-up">
                    <button className={`w-full py-2.5 sm:py-3 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[44px] ${
                      plan.highlighted ? "btn-primary text-white glow-sm" : "card-glass text-white/80 hover:text-white"
                    }`}>
                      {plan.cta}
                    </button>
                  </Link>
                </div>
              ))}
            </div>
            <p className="text-center text-white/30 text-xs mt-8">All plans include a 14-day free trial. No credit card required for Free plan.</p>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10 sm:mb-12">
              <span className="tag-pill text-xs px-3 py-1 rounded-full font-medium inline-block mb-4">FAQ</span>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4 gradient-text">Frequently Asked Questions</h2>
              <p className="text-white/40 text-base sm:text-lg">Everything you need to know about SmartSupport AI</p>
            </div>
            <div className="space-y-4">
              {faqItems.map((item, idx) => (
                <div key={idx} className="card-glass rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                  >
                    <span className="font-medium text-white text-sm sm:text-base">{item.question}</span>
                    <ChevronDown className={`w-5 h-5 text-indigo-400 transition-transform duration-300 ${openFaqIndex === idx ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`faq-answer transition-all duration-300 ${openFaqIndex === idx ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-6 pb-4 text-white/60 text-sm sm:text-base leading-relaxed">
                      {item.answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust & Conversion booster */}
        <section className="py-8 px-4">
          <div className="max-w-4xl mx-auto flex flex-wrap justify-center items-center gap-6 sm:gap-10 text-white/30 text-sm">
            <div className="flex items-center gap-2"><Award className="w-4 h-4 text-indigo-400" /><span>GDPR Compliant</span></div>
            <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-indigo-400" /><span>Bank-level security</span></div>
            <div className="flex items-center gap-2"><Headphones className="w-4 h-4 text-indigo-400" /><span>24/7 Support</span></div>
          </div>
        </section>

        {/* Improved Final CTA */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/5">
          <div className="max-w-4xl mx-auto text-center">
            <div className="rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-14 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.2), rgba(124,58,237,0.2))", border: "1px solid rgba(99,102,241,0.4)" }}>
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10 pointer-events-none" />
              <div className="relative">
                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 gradient-text">
                  Ready to reduce support workload by 80%?
                </h2>
                <p className="text-white/60 mb-8 sm:mb-10 text-base sm:text-lg max-w-xl mx-auto px-2">
                  Join businesses already using SmartSupport AI to deliver faster, smarter customer support.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0">
                  <Link href="/sign-up" className="w-full sm:w-auto">
                    <button className="btn-primary text-base font-semibold px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl text-white flex items-center justify-center gap-2.5 glow w-full sm:w-auto min-h-[48px]">
                      Start Free <ArrowRight className="w-4 h-4 flex-shrink-0" />
                    </button>
                  </Link>
                  <a href="#live-demo" className="w-full sm:w-auto">
                    <button className="card-glass text-base font-medium px-8 py-3.5 rounded-xl text-white/80 hover:text-white w-full sm:w-auto min-h-[48px] transition-all">
                      Book Demo
                    </button>
                  </a>
                </div>
                <p className="text-xs text-white/20 mt-6">No credit card required · Free plan forever</p>
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
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link href="/sign-in" className="hover:text-white transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
