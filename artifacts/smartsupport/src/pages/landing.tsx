import { Link } from "wouter";
import { useMemo } from "react";
import {
  Bot, Zap, Shield, BarChart3, Code2, Globe, Check, ArrowRight,
  MessageSquare, Star, Users, TrendingUp, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const getFeatures = () => [
  {
    icon: Bot,
    title: "Custom AI Chatbots",
    description: "Train chatbots exclusively on your documentation, FAQs, and knowledge base. No hallucinations — only answers grounded in your data.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Zap,
    title: "One-Line Embed",
    description: "Paste a single script tag on any website and your chatbot goes live instantly. No complex integrations or developer time required.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: Shield,
    title: "Context-Aware Responses",
    description: "Powered by GPT-4o with RAG retrieval, the AI only responds using your uploaded content, keeping answers accurate and on-brand.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: BarChart3,
    title: "Conversation Analytics",
    description: "Track every conversation, monitor response quality, and understand what your customers are asking about in real-time.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    icon: Code2,
    title: "Developer Friendly",
    description: "Clean REST API, embeddable widget, and full conversation history. Integrate with your existing tools and workflows.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
  {
    icon: Globe,
    title: "Multi-Platform",
    description: "Embed on any website, e-commerce store, SaaS product, or landing page. One chatbot, everywhere your customers are.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
];

const getPlans = () => [
  {
    name: "Basic",
    price: "$29",
    period: "/month",
    description: "Perfect for small businesses getting started with AI support.",
    features: ["2 chatbots", "50 documents", "1,000 conversations/mo", "Email support", "Basic analytics"],
    cta: "Start free trial",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$99",
    period: "/month",
    description: "For growing teams that need more power and customization.",
    features: ["10 chatbots", "500 documents", "10,000 conversations/mo", "Priority support", "Advanced analytics", "Custom branding", "API access"],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "$399",
    period: "/month",
    description: "Full-scale deployment for companies with serious support needs.",
    features: ["Unlimited chatbots", "Unlimited documents", "Unlimited conversations", "Dedicated support", "SSO & SAML", "SLA guarantee", "Custom integrations"],
    cta: "Contact sales",
    highlighted: false,
  },
];

const stats = [
  { value: "10k+", label: "Conversations daily", icon: MessageSquare },
  { value: "98%", label: "Response accuracy", icon: TrendingUp },
  { value: "500+", label: "Businesses using it", icon: Users },
  { value: "4.9★", label: "Average rating", icon: Star },
];

export default function LandingPage() {
  const features = useMemo(() => getFeatures(), []);
  const plans = useMemo(() => getPlans(), []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:px-4 focus:py-2 focus:rounded-md focus:ring focus:ring-primary">
        Skip to main content
      </a>

      {/* Navigation */}
      <nav className="border-b border-border/50 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">SmartSupport</span>
            <Badge variant="secondary" className="text-xs font-medium ml-1">AI</Badge>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#stats" className="hover:text-foreground transition-colors">About</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="gap-1.5">
                Get started <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main id="main-content">

        {/* Hero */}
        <section className="relative pt-24 pb-20 px-6 overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5 pointer-events-none" />
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-medium px-4 py-2 rounded-full mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              Powered by GPT-4o + RAG technology
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              AI support chatbots
              <br />
              <span className="text-primary">built for your business</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Upload your docs, train a custom AI assistant, and embed it anywhere in minutes.
              Context-aware support that knows your product inside out.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Link href="/sign-up">
                <Button size="lg" className="gap-2 px-8 h-12 text-base shadow-lg shadow-primary/20">
                  Start building free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="outline" size="lg" className="px-8 h-12 text-base">
                  Sign in to dashboard
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">No credit card required · 14-day free trial · Cancel anytime</p>
          </div>
        </section>

        {/* Stats */}
        <section id="stats" className="py-16 px-6 border-y border-border/50 bg-card/30">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <stat.icon className="w-5 h-5 text-primary mr-2" />
                  <span className="text-3xl font-bold">{stat.value}</span>
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Chat Preview */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-3">See it in action</h2>
              <p className="text-muted-foreground">Your chatbot answers instantly from your knowledge base</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-8 relative overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-violet-500/5 pointer-events-none" />
              <div className="relative flex items-start gap-8 flex-wrap md:flex-nowrap">
                {/* Chat */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-muted-foreground font-medium">Live preview</span>
                  </div>
                  {[
                    { role: "user", text: "What's your refund policy?" },
                    { role: "bot", text: "We offer a 30-day money-back guarantee on all plans. To request a refund, contact our support team with your order number. Refunds are processed within 5-7 business days." },
                    { role: "user", text: "How do I cancel my subscription?" },
                    { role: "bot", text: "You can cancel anytime from your account settings under Billing. Your access continues until the end of the billing period." },
                  ].map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-secondary text-foreground rounded-bl-sm"
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden md:block w-px h-48 bg-border self-center" />

                {/* Embed code */}
                <div className="hidden md:block w-60 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Embed in seconds</p>
                  <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-slate-300 border border-slate-800 shadow-inner">
                    <span className="text-slate-500">{"<"}</span>
                    <span className="text-blue-400">script</span>
                    <br />
                    <span className="text-violet-400 pl-3">src</span>
                    <span className="text-slate-400">="</span>
                    <span className="text-emerald-400">/widget.js</span>
                    <span className="text-slate-400">"</span>
                    <br />
                    <span className="text-violet-400 pl-3">data-uid</span>
                    <span className="text-slate-400">="</span>
                    <span className="text-amber-400">your-uid</span>
                    <span className="text-slate-400">"</span>
                    <br />
                    <span className="text-slate-500">{">"}</span>
                    <span className="text-slate-500">{"</"}script{">"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">That's it. Your chatbot is live.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 px-6 border-t border-border/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4 text-xs">Features</Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Everything you need</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                From knowledge base management to embeddable widgets, SmartSupport has the full stack covered.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((feature) => (
                <div key={feature.title}
                  className="rounded-2xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-md transition-all group">
                  <div className={`w-11 h-11 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20 px-6 border-t border-border/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4 text-xs">Pricing</Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Simple, transparent pricing</h2>
              <p className="text-muted-foreground">Start free, scale as you grow. No hidden fees.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan) => (
                <div key={plan.name}
                  className={`rounded-2xl border p-7 flex flex-col transition-shadow hover:shadow-lg ${
                    plan.highlighted
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-lg shadow-primary/10"
                      : "border-border bg-card"
                  }`}>
                  {plan.highlighted && (
                    <Badge className="self-start mb-4 text-xs bg-primary">Most popular</Badge>
                  )}
                  <h3 className="font-bold text-xl mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2.5 text-sm">
                        <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Link href="/sign-up">
                    <Button className="w-full" variant={plan.highlighted ? "default" : "outline"} size="lg">
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-20 px-6 border-t border-border/50">
          <div className="max-w-3xl mx-auto text-center">
            <div className="rounded-3xl border border-primary/20 bg-primary/5 p-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-violet-500/10 pointer-events-none" />
              <div className="relative">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to get started?</h2>
                <p className="text-muted-foreground mb-8 text-lg">
                  Join hundreds of businesses using SmartSupport to deliver better customer support.
                </p>
                <Link href="/sign-up">
                  <Button size="lg" className="gap-2 px-10 h-12 text-base shadow-lg shadow-primary/20">
                    Start for free <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground mt-4">No credit card required</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">SmartSupport AI</span>
          </div>
          <p>Built with GPT-4o and pgvector. All conversations are private.</p>
          <div className="flex gap-6 text-xs">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <Link href="/sign-in" className="hover:text-foreground transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
