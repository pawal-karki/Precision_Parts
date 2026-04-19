import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedGear from "@/components/landing/AnimatedGear";
import AnimatedWave from "@/components/landing/AnimatedWave";

/* ────────────────────────── data ────────────────────────── */

const heroWords = ["book", "schedule", "track", "relax"];

const features = [
  {
    number: "01",
    icon: "event_available",
    title: "Instant Service Booking",
    description:
      "Book oil change, brake service, diagnostics, and repair slots in seconds with real-time availability.",
    visual: "inventory",
  },
  {
    number: "02",
    icon: "garage_home",
    title: "Service Center Discovery",
    description:
      "Find nearby trusted service centers, compare ratings, and choose time slots that fit your day.",
    visual: "pos",
  },
  {
    number: "03",
    icon: "smart_toy",
    title: "Smart Maintenance Reminders",
    description:
      "Get reminders based on mileage and service history so you never miss an important maintenance date.",
    visual: "ai",
  },
  {
    number: "04",
    icon: "shield",
    title: "Secure Customer Account",
    description:
      "Your booking history, vehicle details, and payment data stay safe with encrypted and secure access.",
    visual: "security",
  },
];

const steps = [
  {
    number: "I",
    title: "Create your workspace account",
    description:
      "Sign up, configure your inventory, and select your preferred operation mode in under two minutes.",
    code: `PrecisionParts.init({
  user: "admin",
  workspace: ["parts-1"],
  mode: "full-stack"
})`,
  },
  {
    number: "II",
    title: "Choose service and slot",
    description:
      "Pick your required motor service, compare centers, and reserve the best available appointment instantly.",
    code: `booking.select({
  service: "major-service",
  date: "next-available",
  pickup: true
})`,
  },
  {
    number: "III",
    title: "Get updates and complete service",
    description:
      "Track booking status, receive reminders, and access invoices and service records from your account.",
    code: `booking.confirm({
  notifications: true,
  liveTracking: true,
  digitalInvoice: true
})
// Appointment confirmed ✓`,
  },
];

const metrics = [
  { value: 12400, suffix: "+", label: "Appointments completed" },
  { value: 99, suffix: ".9%", label: "System uptime" },
  { value: 340, suffix: "ms", label: "Avg. response time" },
  { value: 850, suffix: "+", label: "Service partners onboarded" },
];

const testimonials = [
  {
    quote:
      "Booking my bike and car service takes less than a minute now. I get reminders and status updates without calling anyone.",
    author: "Rajesh Patel",
    role: "Customer",
    company: "Bengaluru",
    metric: "75% faster booking",
  },
  {
    quote:
      "I can choose pickup, compare timings, and track progress right from my phone. The app is super easy to use.",
    author: "Maria Santos",
    role: "Customer",
    company: "Hyderabad",
    metric: "6x easier scheduling",
  },
  {
    quote:
      "All service history is in one place. Perfect for keeping track of what was done and when the next service is due.",
    author: "David Okoro",
    role: "Customer",
    company: "Pune",
    metric: "100% digital records",
  },
];

const footerLinks = {
  Company: [
    { name: "About", to: "/info/about" },
    { name: "Blog", to: "/info/blog" },
    { name: "Careers", to: "/info/careers", badge: "Hiring" },
    { name: "Contact", to: "/info/contact" },
  ],
  Legal: [
    { name: "Privacy", to: "/info/privacy" },
    { name: "Terms", to: "/info/terms" },
    { name: "Security", to: "/info/security" },
  ],
};

/* ────────────────────────── sub-components ────────────────────────── */

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => e.isIntersecting && setVisible(true),
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function AnimatedCounter({ end, suffix = "", prefix = "" }) {
  const ref = useRef(null);
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started) {
          setStarted(true);
          const dur = 2000;
          const t0 = performance.now();
          const tick = (now) => {
            const p = Math.min((now - t0) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setCount(Math.floor(eased * end));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [end, started]);

  return (
    <div ref={ref} className="text-5xl lg:text-7xl font-headline font-extrabold tracking-tight text-on-surface">
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </div>
  );
}

/* ── SVG visuals for features ── */
function InventoryVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full text-secondary">
      <rect x="30" y="20" width="140" height="120" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x="40" y={35 + i * 18} width="120" height="10" rx="2" fill="currentColor" opacity="0.15">
          <animate attributeName="opacity" values="0.15;0.7;0.15" dur="2s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
          <animate attributeName="width" values="30;120;30" dur="2s" begin={`${i * 0.2}s`} repeatCount="indefinite" />
        </rect>
      ))}
      <circle cx="100" cy="150" r="3" fill="currentColor" opacity="0.3">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function POSVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full text-secondary">
      <rect x="40" y="15" width="120" height="80" rx="6" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="50" y="25" width="40" height="12" rx="2" fill="currentColor" opacity="0.3" />
      <rect x="50" y="43" width="100" height="8" rx="2" fill="currentColor" opacity="0.15" />
      <rect x="50" y="57" width="80" height="8" rx="2" fill="currentColor" opacity="0.15" />
      <rect x="50" y="71" width="60" height="8" rx="2" fill="currentColor" opacity="0.15" />
      <rect x="55" y="105" width="90" height="30" rx="4" fill="currentColor" opacity="0.8">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />
      </rect>
      <text x="100" y="124" textAnchor="middle" fontSize="11" fontFamily="monospace" fill="white">PAY NOW</text>
    </svg>
  );
}

function AIVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full text-secondary">
      <circle cx="100" cy="80" r="12" fill="currentColor">
        <animate attributeName="r" values="12;14;12" dur="2s" repeatCount="indefinite" />
      </circle>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i * 60) * (Math.PI / 180);
        const r = 48;
        return (
          <g key={i}>
            <line x1="100" y1="80" x2={100 + Math.cos(angle) * r} y2={80 + Math.sin(angle) * r} stroke="currentColor" strokeWidth="1" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
            </line>
            <circle cx={100 + Math.cos(angle) * r} cy={80 + Math.sin(angle) * r} r="6" fill="none" stroke="currentColor" strokeWidth="2">
              <animate attributeName="r" values="6;8;6" dur="2s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
            </circle>
          </g>
        );
      })}
      <circle cx="100" cy="80" r="30" fill="none" stroke="currentColor" strokeWidth="1" opacity="0">
        <animate attributeName="r" values="20;55" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function SecurityVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full text-secondary">
      <path d="M 100 20 L 150 40 L 150 90 Q 150 130 100 145 Q 50 130 50 90 L 50 40 Z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M 100 35 L 135 50 L 135 85 Q 135 115 100 128 Q 65 115 65 85 L 65 50 Z" fill="currentColor" opacity="0.1">
        <animate attributeName="opacity" values="0.1;0.2;0.1" dur="2s" repeatCount="indefinite" />
      </path>
      <rect x="85" y="70" width="30" height="25" rx="3" fill="currentColor" />
      <path d="M 90 70 L 90 60 Q 90 50 100 50 Q 110 50 110 60 L 110 70" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="100" cy="80" r="4" fill="white" />
      <rect x="98" y="82" width="4" height="8" fill="white" />
    </svg>
  );
}

const visualMap = { inventory: InventoryVisual, pos: POSVisual, ai: AIVisual, security: SecurityVisual };

/* ────────────────────────── sections ────────────────────────── */

function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How it works", href: "#how-it-works" },
    { name: "Testimonials", href: "#testimonials" },
  ];

  return (
    <header className={`fixed z-50 transition-all duration-500 ${scrolled ? "top-3 left-3 right-3" : "top-0 left-0 right-0"}`}>
      <nav className={`mx-auto transition-all duration-500 ${scrolled || mobileOpen ? "bg-background/85 backdrop-blur-xl border border-outline-variant/30 rounded-2xl shadow-glass max-w-[1200px]" : "bg-transparent max-w-[1400px]"}`}>
        <div className={`flex items-center justify-between transition-all duration-500 px-6 lg:px-8 ${scrolled ? "h-14" : "h-20"}`}>
          <a href="#" className="flex items-center gap-2.5 group">
            <div className={`bg-secondary rounded-lg flex items-center justify-center text-white transition-all duration-500 ${scrolled ? "w-8 h-8" : "w-9 h-9"}`}>
              <Icon name="precision_manufacturing" filled className={`transition-all ${scrolled ? "text-sm" : "text-base"}`} />
            </div>
            <div>
              <span className={`font-headline font-extrabold tracking-tight transition-all duration-500 ${scrolled ? "text-base" : "text-lg"}`}>
                MotorCare
              </span>
              <span className={`text-on-surface-variant font-mono block transition-all duration-500 ${scrolled ? "text-[8px]" : "text-[9px]"} uppercase tracking-widest`}>
                Customer Service Booking
              </span>
            </div>
          </a>

          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((l) => (
              <a key={l.name} href={l.href} className="text-sm text-on-surface-variant hover:text-on-surface transition-colors relative group">
                {l.name}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-secondary transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className={`text-on-surface-variant hover:text-on-surface transition-all ${scrolled ? "text-xs" : "text-sm"}`}>
              Sign in
            </Link>
            <Link to="/signup">
              <Button variant="secondary" size={scrolled ? "sm" : "default"} className="rounded-full px-6">
                Get Started
              </Button>
            </Link>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2" aria-label="Menu">
            <Icon name={mobileOpen ? "close" : "menu"} className="text-2xl" />
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      <div className={`md:hidden fixed inset-0 bg-background z-40 transition-all duration-500 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="flex flex-col h-full px-8 pt-28 pb-8">
          <div className="flex-1 flex flex-col justify-center gap-6">
            {navLinks.map((l, i) => (
              <a
                key={l.name}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className={`text-4xl font-headline font-extrabold transition-all duration-500 ${mobileOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                style={{ transitionDelay: mobileOpen ? `${i * 75}ms` : "0ms" }}
              >
                {l.name}
              </a>
            ))}
          </div>
          <div className="flex gap-4 pt-8 border-t border-outline-variant/30">
            <Link to="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" className="w-full rounded-full h-14 text-base">Sign in</Button>
            </Link>
            <Link to="/signup" className="flex-1" onClick={() => setMobileOpen(false)}>
              <Button variant="secondary" className="w-full rounded-full h-14 text-base">Get Started</Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  const [visible, setVisible] = useState(false);
  const [wordIdx, setWordIdx] = useState(0);

  useEffect(() => { setVisible(true); }, []);
  useEffect(() => {
    const iv = setInterval(() => setWordIdx((p) => (p + 1) % heroWords.length), 2500);
    return () => clearInterval(iv);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] lg:w-[700px] lg:h-[700px] opacity-30 pointer-events-none">
        <AnimatedGear />
      </div>

      {/* grid lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        {[...Array(6)].map((_, i) => (
          <div key={`h${i}`} className="absolute h-px bg-on-surface/10" style={{ top: `${16.6 * (i + 1)}%`, left: 0, right: 0 }} />
        ))}
        {[...Array(10)].map((_, i) => (
          <div key={`v${i}`} className="absolute w-px bg-on-surface/10" style={{ left: `${10 * (i + 1)}%`, top: 0, bottom: 0 }} />
        ))}
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 py-32 lg:py-40">
        <div className={`mb-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <span className="inline-flex items-center gap-3 text-sm font-mono text-on-surface-variant">
            <span className="w-8 h-px bg-on-surface/30" />
            The app for modern vehicle owners
          </span>
        </div>

        <div className="mb-12">
          <h1 className={`text-[clamp(2.5rem,10vw,8rem)] font-headline font-extrabold leading-[0.9] tracking-tight transition-all duration-1000 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <span className="block text-on-surface">The smartest way</span>
            <span className="block text-on-surface">
              to{" "}
              <span className="relative inline-block">
                <span key={wordIdx} className="inline-flex text-secondary">
                  {heroWords[wordIdx].split("").map((c, i) => (
                    <span key={`${wordIdx}-${i}`} className="inline-block animate-char-in" style={{ animationDelay: `${i * 50}ms` }}>
                      {c}
                    </span>
                  ))}
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-2 bg-secondary/15 rounded" />
              </span>
            </span>
          </h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-end">
          <p className={`text-lg lg:text-xl text-on-surface-variant leading-relaxed max-w-xl transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            A customer-focused motor service application for booking appointments, tracking progress,
            and receiving smart maintenance reminders — all in one place.
          </p>

          <div className={`flex flex-col sm:flex-row items-start gap-4 transition-all duration-700 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <Link to="/signup" state={{ intent: "booking" }}>
              <Button variant="secondary" size="lg" className="px-8 h-14 text-base rounded-full group">
                Book an appointment
                <Icon name="arrow_forward" className="text-base ml-1 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="h-14 px-8 text-base rounded-full border-outline-variant hover:bg-surface-container-low">
                See features
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* stats marquee */}
      <div className={`absolute bottom-20 left-0 right-0 transition-all duration-700 delay-500 ${visible ? "opacity-100" : "opacity-0"}`}>
        <div className="flex gap-16 marquee whitespace-nowrap">
          {[...Array(2)].map((_, si) => (
            <div key={si} className="flex gap-16">
              {[
                { value: "12,400+", label: "appointments completed", company: "ACROSS ALL CENTERS" },
                { value: "99.9%", label: "system uptime", company: "LAST 12 MONTHS" },
                { value: "6x", label: "faster scheduling", company: "WITH INSTANT BOOKING" },
                { value: "80%", label: "less phone follow-ups", company: "WITH LIVE STATUS UPDATES" },
              ].map((s) => (
                <div key={`${s.company}-${si}`} className="flex items-baseline gap-4">
                  <span className="text-3xl lg:text-4xl font-headline font-extrabold text-on-surface">{s.value}</span>
                  <span className="text-sm text-on-surface-variant">
                    {s.label}
                    <span className="block font-mono text-[10px] mt-0.5 text-on-surface-variant/60">{s.company}</span>
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const [sRef, sVis] = useInView(0.1);

  return (
    <section id="features" ref={sRef} className="relative py-24 lg:py-32">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-16 lg:mb-24">
          <span className="inline-flex items-center gap-3 text-sm font-mono text-on-surface-variant mb-6">
            <span className="w-8 h-px bg-on-surface/30" />
            Capabilities
          </span>
          <h2 className={`text-4xl lg:text-6xl font-headline font-extrabold tracking-tight transition-all duration-700 ${sVis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            Everything a customer needs.
            <br />
            <span className="text-on-surface-variant">Nothing it doesn't.</span>
          </h2>
        </div>

        <div>
          {features.map((f, i) => (
            <FeatureCard key={f.number} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, index }) {
  const [ref, vis] = useInView(0.2);
  const Visual = visualMap[feature.visual] || InventoryVisual;

  return (
    <div
      ref={ref}
      className={`group transition-all duration-700 ${vis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 py-12 lg:py-20 border-b border-outline-variant/30">
        <div className="shrink-0">
          <span className="font-mono text-sm text-on-surface-variant">{feature.number}</span>
        </div>
        <div className="flex-1 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Icon name={feature.icon} className="text-secondary text-xl" />
              </div>
              <h3 className="text-2xl lg:text-3xl font-headline font-bold group-hover:translate-x-2 transition-transform duration-500">
                {feature.title}
              </h3>
            </div>
            <p className="text-lg text-on-surface-variant leading-relaxed">{feature.description}</p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="w-48 h-40">
              <Visual />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HowItWorksSection() {
  const [active, setActive] = useState(0);
  const [sRef, sVis] = useInView(0.1);

  useEffect(() => {
    const iv = setInterval(() => setActive((p) => (p + 1) % steps.length), 6000);
    return () => clearInterval(iv);
  }, []);

  return (
    <section id="how-it-works" ref={sRef} className="relative py-24 lg:py-32 bg-on-surface text-background overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(-45deg,transparent,transparent 40px,currentColor 40px,currentColor 41px)" }} />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-16 lg:mb-24">
          <span className="inline-flex items-center gap-3 text-sm font-mono text-background/50 mb-6">
            <span className="w-8 h-px bg-background/30" />
            Getting started
          </span>
          <h2 className={`text-4xl lg:text-6xl font-headline font-extrabold tracking-tight transition-all duration-700 ${sVis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            Three steps.
            <br />
            <span className="text-background/50">Up and running.</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          <div className="space-y-0">
            {steps.map((s, i) => (
              <button
                key={s.number}
                type="button"
                onClick={() => setActive(i)}
                className={`w-full text-left py-8 border-b border-background/10 transition-all duration-500 group ${active === i ? "opacity-100" : "opacity-40 hover:opacity-70"}`}
              >
                <div className="flex items-start gap-6">
                  <span className="font-headline text-3xl font-extrabold text-background/30">{s.number}</span>
                  <div className="flex-1">
                    <h3 className="text-2xl lg:text-3xl font-headline font-bold mb-3 group-hover:translate-x-2 transition-transform duration-300">
                      {s.title}
                    </h3>
                    <p className="text-background/60 leading-relaxed">{s.description}</p>
                    {active === i && (
                      <div className="mt-4 h-px bg-background/20 overflow-hidden">
                        <div className="h-full bg-background" style={{ animation: "progress-bar 6s linear forwards" }} />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="lg:sticky lg:top-32 self-start">
            <div className="border border-background/10 overflow-hidden rounded-lg">
              <div className="px-6 py-4 border-b border-background/10 flex items-center justify-between">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-background/20" />
                  <div className="w-3 h-3 rounded-full bg-background/20" />
                  <div className="w-3 h-3 rounded-full bg-background/20" />
                </div>
                <span className="text-xs font-mono text-background/40">setup.js</span>
              </div>
              <div className="p-8 font-mono text-sm min-h-[280px]">
                <pre className="text-background/70">
                  {steps[active].code.split("\n").map((line, li) => (
                    <div key={`${active}-${li}`} className="leading-loose code-line-reveal" style={{ animationDelay: `${li * 80}ms` }}>
                      <span className="text-background/20 select-none w-8 inline-block">{li + 1}</span>
                      <span className="inline-flex">
                        {line.split("").map((ch, ci) => (
                          <span key={`${active}-${li}-${ci}`} className="code-char-reveal" style={{ animationDelay: `${li * 80 + ci * 15}ms` }}>
                            {ch === " " ? "\u00A0" : ch}
                          </span>
                        ))}
                      </span>
                    </div>
                  ))}
                </pre>
              </div>
              <div className="px-6 py-4 border-t border-background/10 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-mono text-background/40">Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricsSection() {
  const [sRef, sVis] = useInView(0.1);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <section ref={sRef} className="relative py-24 lg:py-32 border-y border-outline-variant/30">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16 lg:mb-24">
          <div>
            <span className="inline-flex items-center gap-3 text-sm font-mono text-on-surface-variant mb-6">
              <span className="w-8 h-px bg-on-surface/30" />
              Live metrics
            </span>
            <h2 className={`text-4xl lg:text-6xl font-headline font-extrabold tracking-tight transition-all duration-700 ${sVis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              Performance you
              <br />
              can measure.
            </h2>
          </div>
          <div className="flex items-center gap-4 font-mono text-sm text-on-surface-variant">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
            <span className="text-on-surface/20">|</span>
            <span>{time.toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-outline-variant/30">
          {metrics.map((m, i) => (
            <div
              key={m.label}
              className={`bg-background p-8 lg:p-12 transition-all duration-700 ${sVis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <AnimatedCounter end={m.value} suffix={m.suffix} />
              <div className="mt-4 text-lg text-on-surface-variant">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const [idx, setIdx] = useState(0);
  const [animating, setAnimating] = useState(false);

  const go = useCallback((i) => {
    setAnimating(true);
    setTimeout(() => { setIdx(i); setAnimating(false); }, 300);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => go((idx + 1) % testimonials.length), 6000);
    return () => clearInterval(iv);
  }, [idx, go]);

  const t = testimonials[idx];

  return (
    <section id="testimonials" className="relative py-32 lg:py-40 border-t border-outline-variant/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center gap-4 mb-16">
          <span className="font-mono text-xs tracking-widest text-on-surface-variant uppercase">What customers say</span>
          <div className="flex-1 h-px bg-outline-variant/30" />
          <span className="font-mono text-xs text-on-surface-variant">
            {String(idx + 1).padStart(2, "0")} / {String(testimonials.length).padStart(2, "0")}
          </span>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
          <div className="lg:col-span-8">
            <blockquote className={`transition-all duration-300 ${animating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}>
              <p className="font-headline text-3xl md:text-4xl lg:text-5xl font-extrabold leading-[1.1] tracking-tight">
                &ldquo;{t.quote}&rdquo;
              </p>
            </blockquote>
            <div className={`mt-12 flex items-center gap-6 transition-all duration-300 delay-100 ${animating ? "opacity-0" : "opacity-100"}`}>
              <div className="w-14 h-14 rounded-full bg-secondary/10 border border-outline-variant/30 flex items-center justify-center">
                <span className="font-headline text-xl font-bold text-secondary">{t.author.charAt(0)}</span>
              </div>
              <div>
                <p className="text-lg font-semibold">{t.author}</p>
                <p className="text-on-surface-variant">{t.role}, {t.company}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col justify-center">
            <div className={`p-8 border border-outline-variant/30 rounded-xl transition-all duration-300 ${animating ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}>
              <span className="font-mono text-xs tracking-widest text-on-surface-variant uppercase block mb-4">Key Result</span>
              <p className="font-headline text-3xl md:text-4xl font-extrabold text-secondary">{t.metric}</p>
            </div>
            <div className="flex gap-2 mt-8">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${i === idx ? "w-8 bg-secondary" : "w-2 bg-on-surface/15 hover:bg-on-surface/30"}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-24 pt-12 border-t border-outline-variant/30">
          <p className="font-mono text-xs tracking-widest text-on-surface-variant uppercase mb-8 text-center">
            Trusted by vehicle owners everywhere
          </p>
        </div>
      </div>

      <div className="w-full overflow-hidden">
        <div className="flex gap-16 items-center marquee">
          {[...Array(2)].map((_, si) => (
            <div key={si} className="flex gap-16 items-center shrink-0">
              {["MotoFix Hub", "QuickTune Garage", "Prime Auto Service", "Urban Mechanic Care", "DriveWell Center", "RoadReady Motors", "EngineEase Workshop", "ProService Point"].map(
                (c) => (
                  <span key={`${si}-${c}`} className="font-headline text-xl md:text-2xl text-on-surface/20 whitespace-nowrap hover:text-on-surface/50 transition-colors duration-300">
                    {c}
                  </span>
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const [sRef, sVis] = useInView(0.2);
  const [mouse, setMouse] = useState({ x: 50, y: 50 });

  const handleMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setMouse({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return (
    <section ref={sRef} className="relative py-24 lg:py-32 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div
          className={`relative border-2 border-on-surface rounded-2xl transition-all duration-1000 ${sVis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          onMouseMove={handleMove}
        >
          <div className="absolute inset-0 opacity-10 pointer-events-none rounded-2xl" style={{ background: `radial-gradient(600px circle at ${mouse.x}% ${mouse.y}%, rgba(77,97,114,0.2), transparent 40%)` }} />
          <div className="relative z-10 px-8 lg:px-16 py-16 lg:py-24">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="flex-1">
                <h2 className="text-4xl lg:text-6xl font-headline font-extrabold tracking-tight mb-8 leading-[0.95]">
                  Ready to modernize
                  <br />
                  your next service?
                </h2>
                <p className="text-xl text-on-surface-variant mb-12 leading-relaxed max-w-xl">
                  Join thousands of customers booking motor service appointments in minutes.
                </p>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <Link to="/signup" state={{ intent: "booking" }}>
                    <Button variant="secondary" size="lg" className="px-8 h-14 text-base rounded-full group">
                      Book an appointment
                      <Icon name="arrow_forward" className="text-base ml-1 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <a href="mailto:sales@precisionatelier.com">
                    <Button variant="outline" size="lg" className="h-14 px-8 text-base rounded-full border-outline-variant hover:bg-surface-container-low">
                      Talk to sales
                    </Button>
                  </a>
                </div>
                <p className="text-sm text-on-surface-variant mt-8 font-mono">No credit card required</p>
              </div>
              <div className="hidden lg:flex items-center justify-center w-[400px] h-[400px] -mr-8">
                <AnimatedGear />
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 border-b border-l border-on-surface/10 rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 border-t border-r border-on-surface/10 rounded-bl-2xl" />
        </div>
      </div>
    </section>
  );
}

function FooterSection() {
  return (
    <footer className="relative border-t border-outline-variant/30">
      <div className="absolute inset-0 h-64 opacity-15 pointer-events-none overflow-hidden">
        <AnimatedWave />
      </div>
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="py-16 lg:py-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 lg:gap-8">
            <div className="col-span-2">
              <a href="#" className="inline-flex items-center gap-2.5 mb-6">
                <div className="w-9 h-9 bg-secondary rounded-lg flex items-center justify-center text-white">
                  <Icon name="precision_manufacturing" filled className="text-base" />
                </div>
                <div>
                  <span className="text-lg font-headline font-extrabold">Precision Parts</span>
                  <span className="text-[9px] text-on-surface-variant font-mono block uppercase tracking-widest">Inventory & Service Hub</span>
                </div>
              </a>
              <p className="text-on-surface-variant leading-relaxed mb-8 max-w-xs">
                Book, track, and manage your motor service appointments from one simple customer app.
              </p>
            </div>

            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h3 className="text-sm font-semibold mb-6">{title}</h3>
                <ul className="space-y-4">
                  {links.map((l) => (
                    <li key={l.name}>
                      <Link to={l.to} className="text-sm text-on-surface-variant hover:text-on-surface transition-colors inline-flex items-center gap-2">
                        {l.name}
                        {l.badge && <span className="text-xs px-2 py-0.5 bg-secondary text-on-secondary rounded-full">{l.badge}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="py-8 border-t border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-on-surface-variant">&copy; {new Date().getFullYear()} Precision Parts. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm text-on-surface-variant">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ────────────────────────── main page ────────────────────────── */

export default function Landing() {
  return (
    <main className="relative min-h-screen overflow-x-hidden noise-overlay bg-background">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <MetricsSection />
      <TestimonialsSection />
      <CTASection />
      <FooterSection />
    </main>
  );
}
