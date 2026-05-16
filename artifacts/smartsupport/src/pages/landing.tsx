import { Link } from "wouter";
import { useMemo } from "react";
import { Bot, Zap, Shield, BarChart3, Code2, Globe, Check, ArrowRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Feature data – static, but if it ever becomes dynamic, memoization helps
const getFeatures = () => [
  {
    icon: Bot,
    title: "Custom AI Chatbots",
    description:
      "Train chatbots exclusively on your documentation, FAQs, and knowledge base. No hallucinations — only answers grounded in your data.",
  },
  {
    icon: Zap,
    title: "One-Line Embed",
    description:
      "Paste a single script tag on any website and your chatbot goes live instantly. No complex integrations or developer time required.",
  },
  {
    icon: Shield,
    title: "Context-Aware Responses",
    description:
      "Powered by GPT-4o with RAG retrieval, the AI only responds using your uploaded content, keeping answers accurate and on-brand.",
  },
  {
    icon: BarChart3,
    title: "Conversation Analytics",
    description:
      "Track every conversation, monitor response quality, and understand what your customers are asking about in real-time.",
  },
  {
    icon: Code2,
    title: "Developer Friendly",
    description:
      "Clean REST API, embeddable widget, and full conversation history. Integrate with your existing tools and workflows.",
  },
  {
    icon: Globe,
    title: "Multi-Platform",
    description:
      "Embed on any website, e-commerce store, SaaS product, or landing page. One chatbot, everywhere your customers are.",
  },
];

// Pricing plans – static data
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
    features: [
      "10 chatbots",
      "500 documents",
      "10,000 conversations/mo",
      "Priority support",
      "Advanced analytics",
      "Custom branding",
      "API access",
    ],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "$399",
    period: "/month",
    description: "Full-scale deployment for companies with serious support needs.",
    features: [
      "Unlimited chatbots",
      "Unlimited documents",
      "Unlimited conversations",
      "Dedicated support",
      "SSO & SAML",
      "SLA guarantee",
      "Custom integrations",
    ],
    cta: "Contact sales",
    highlighted: false,
  },
];

export default function LandingPage() {
  // Memoize static data to avoid recomputation on re-renders (good practice)
  const features = useMemo(() => getFeatures(), []);
  const plans = useMemo(() => getPlans(), []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Skip to main content – accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:px-4 focus:py-2 focus:rounded-md focus:ring focus:ring-primary"
      >
        Skip to main content
      </a>

      {/* Navigation */}
      <nav
        className="border-b border-border/50 sticky top-0 z-50 bg-background/80 backdrop-blur-md"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center" aria-hidden="true">
              <MessageSquare className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight">SmartSupport AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-foreground transition-colors">
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" aria-label="Sign in to your account">
                Sign in
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" aria-label="Create a new account">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main id="main-content">
        {/* Hero section */}
        <section className="pt-24 pb-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 text-xs font-medium px-3 py-1">
              Powered by GPT-4o + RAG
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
              AI chatbots trained on <span className="text-primary">your business</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Upload your documentation, train a custom AI assistant, and embed it on any website in minutes.
              Context-aware support that knows your product inside out.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/sign-up">
                <Button size="lg" className="gap-2 px-8" aria-label="Start free trial">
                  Start building free
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="outline" size="lg" className="px-8" aria-label="Sign in">
                  Sign in
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground mt-4">No credit card required. 14-day free trial.</p>
          </div>
        </section>

        {/* Widget preview */}
        <section className="pb-20 px-6" aria-labelledby="preview-heading">
          <h2 id="preview-heading" className="sr-only">
            Live widget preview and embed code
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="rounded-2xl border border-border bg-card p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" aria-hidden="true" />
              <div className="relative flex items-start gap-6 flex-wrap md:flex-nowrap">
                {/* Chat preview */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-green-500" aria-hidden="true" />
                    <span className="text-xs text-muted-foreground font-mono">Live preview</span>
                  </div>
                  {[
                    { role: "user", text: "What's your refund policy?" },
                    {
                      role: "bot",
                      text: "We offer a 30-day money-back guarantee on all plans. To request a refund, simply contact our support team with your order number and reason for the request. Refunds are processed within 5-7 business days.",
                    },
                    { role: "user", text: "How do I cancel my subscription?" },
                  ].map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-secondary text-foreground rounded-bl-sm"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div className="hidden md:block">
                  <div className="w-px h-40 bg-border mx-6" aria-hidden="true" />
                </div>

                {/* Embed code snippet */}
                <div className="hidden md:block w-64 space-y-3 text-sm">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Embed in seconds
                  </p>
                  <div className="bg-slate-950 rounded-lg p-3 font-mono text-xs text-slate-300 border border-slate-800">
                    <span className="text-slate-500">{'<'}</span>script
                    <br />
                    <span className="text-blue-400 pl-2">src</span>
                    <span className="text-slate-400">="</span>
                    <span className="text-green-400">/widget.js</span>
                    <span className="text-slate-400">"</span>
                    <br />
                    <span className="text-blue-400 pl-2">data-chatbot-uid</span>
                    <span className="text-slate-400">="</span>
                    <span className="text-yellow-400">your-uid</span>
                    <span className="text-slate-400">"</span>
                    <br />
                    <span className="text-slate-500">{'>'}</span>
                    <span className="text-slate-500">{'</'}script</span>
                    <span className="text-slate-500">{'>'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features section */}
        <section id="features" className="py-20 px-6 border-t border-border/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Everything you need</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                From knowledge base management to embeddable widgets, SmartSupport has the full stack covered.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-border bg-card p-6 hover:border-primary/40 transition-colors group"
                >
                  <div
                    className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors"
                    aria-hidden="true"
                  >
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing section */}
        <section id="pricing" className="py-20 px-6 border-t border-border/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Simple, transparent pricing</h2>
              <p className="text-muted-foreground">Start free, scale as you grow.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-xl border p-6 flex flex-col ${
                    plan.highlighted
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border bg-card"
                  }`}
                >
                  {plan.highlighted && (
                    <Badge className="self-start mb-4 text-xs" aria-label="Most popular plan">
                      Most popular
                    </Badge>
                  )}
                  <h3 className="font-bold text-xl mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                  <ul className="space-y-2.5 mb-8 flex-1" aria-label={`${plan.name} features`}>
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2.5 text-sm">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/sign-up">
                    <Button className="w-full" variant={plan.highlighted ? "default" : "outline"}>
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10 px-6" role="contentinfo">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center" aria-hidden="true">
              <MessageSquare className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-medium text-foreground">SmartSupport AI</span>
          </div>
          <p>Built with GPT-4o and pgvector. All conversations are private.</p>
        </div>
      </footer>
    </div>
  );
}
