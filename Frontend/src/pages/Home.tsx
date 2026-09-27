import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ArrowRight,
  Crosshair,
  Lock,
  Layers,
  Terminal,
  Activity,
  FileText,
  AlertTriangle,
  Server,
  Zap,
  Globe,
  Database,
  LayoutDashboard,
  CheckCircle2,
  Code2,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from '../components/ui/Button';
import { EarthGlobe } from '../components/homepage/EarthGlobe';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

export const Home: React.FC = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const heroRef = React.useRef<HTMLElement>(null);
  const globeRef = React.useRef<HTMLDivElement>(null);
  const featuresRef = React.useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const postureData = [
    { name: 'Passed', value: 35, color: '#10b981' },
    { name: 'Low', value: 1, color: '#3b82f6' },
    { name: 'Medium', value: 2, color: '#f59e0b' },
    { name: 'High', value: 2, color: '#f97316' },
    { name: 'Critical', value: 1, color: '#ef4444' },
  ];

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: heroRef.current,
        start: 'top top',
        end: 'bottom top', // Use natural height instead of artificial +=1500 to fix extra space at bottom
        scrub: 1,
        pin: true,
        pinSpacing: false,
      },
    });

    // Fade out text/UI, scale only the globe to prevent WebGL/layout lag
    tl.to(".hero-text-content", {
      opacity: 0,
      y: -50,
      duration: 0.3,
      ease: 'power1.out',
    }, 0);

    tl.to(globeRef.current, {
      scale: 6, // Reduced scale to prevent texture explosion and lag
      opacity: 0,
      ease: 'power2.in',
      duration: 1,
    }, 0);

    // Feature cards staggered reveal
    gsap.from(".feature-card", {
      scrollTrigger: {
        trigger: featuresRef.current,
        start: "top 75%",
      },
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: "power2.out"
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white">
      {/* 1. TOP NAVBAR (Sticky, 3-zone contract, no pills) */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 h-16 px-4 sm:px-8 border-b ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md border-slate-200 shadow-lg'
            : 'bg-transparent border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          {/* Zone 1: Brand Wordmark */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-indigo-600/20 border border-indigo-500/50 rounded flex items-center justify-center text-indigo-600 group-hover:border-indigo-400 transition-colors">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-slate-900">Sentinel</span>
              <span className="text-[10px] uppercase font-mono px-1 py-0.2 bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xs">
                AppSec
              </span>
            </div>
          </Link>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">
              Features
            </a>
            <a href="#modules" className="hover:text-indigo-600 transition-colors">
              Security Modules
            </a>
            <a href="#workflow" className="hover:text-indigo-600 transition-colors">
              Workflow
            </a>
            <a href="#dashboard-access" className="hover:text-indigo-600 transition-colors">
              Dashboard
            </a>
            <Link to="/target" className="hover:text-indigo-600 transition-colors">
              Target Scope
            </Link>
          </nav>

          {/* Zone 3: Direct Dashboard Action */}
          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="primary" size="md" className="font-semibold tracking-wide shadow-indigo-900/30">
                <LayoutDashboard className="w-4 h-4 mr-1.5" />
                <span>Open Dashboard</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION WITH MOVING REAL EARTH GLOBE */}
      <section ref={heroRef} className="relative min-h-[92vh] flex items-center pt-24 pb-16 sm:pt-28 sm:pb-20 overflow-hidden border-b border-slate-800 bg-[#060913] will-change-transform">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#312e81_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute top-1/4 left-1/3 w-[650px] h-[350px] bg-indigo-950/25 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-6 space-y-6 hero-text-content">
              <div className="inline-flex items-center gap-2 text-xs font-mono tracking-wider text-indigo-400 bg-indigo-950/60 border border-indigo-800/50 px-2.5 py-1 rounded-sm">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-none animate-pulse" />
                <span>AUTHORIZED APPLICATION SECURITY ASSESSMENT</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.14]">
                Security assessment, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-indigo-100 to-slate-200">
                  built for real applications.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
                Assess authorized web applications, analyze API security controls, inspect redacted technical
                evidence, and generate actionable engineering remediation reports from one unified workspace.
              </p>

              {/* Direct Dashboard & Platform CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link to="/dashboard">
                  <Button variant="primary" size="lg" className="h-11 px-6 text-sm">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    <span>Enter Security Dashboard</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button variant="secondary" size="lg" className="h-11 px-6 text-sm">
                    <span>Explore All Features</span>
                    <ChevronDown className="w-4 h-4 ml-1.5" />
                  </Button>
                </a>
              </div>

              {/* Verified Metrics Counter */}
              <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-6 max-w-md">
                <div>
                  <div className="text-xl font-bold font-mono text-white tabular-nums">42</div>
                  <div className="text-xs text-slate-400 mt-0.5">Automated Checks</div>
                </div>
                <div>
                  <div className="text-xl font-bold font-mono text-indigo-400 tabular-nums">7</div>
                  <div className="text-xs text-slate-400 mt-0.5">Security Domains</div>
                </div>
                <div>
                  <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">100%</div>
                  <div className="text-xs text-slate-400 mt-0.5">Redacted Evidence</div>
                </div>
              </div>
            </div>

            {/* Hero Right: Moving Real 3D Earth Globe with Orbital Telemetry */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center relative">
              <div ref={globeRef} className="relative w-full aspect-square max-w-[540px] max-h-[540px] flex items-center justify-center">
                {/* 3D WebGL Earth Globe Canvas */}
                <EarthGlobe className="w-full h-full" />

                {/* Overlaid Live Telemetry Status Pill */}
                <div className="absolute top-4 right-4 bg-[#0a0f1d]/90 backdrop-blur-md border border-slate-800 rounded p-2.5 font-mono text-[11px] text-slate-300 space-y-1 shadow-xl">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-none animate-ping" />
                    <span className="font-semibold">GLOBAL MONITORING ACTIVE</span>
                  </div>
                  <div className="text-slate-400">Target: Staging Cluster (Alpha)</div>
                  <div className="text-indigo-400">Endpoints Scoped: 28</div>
                </div>

                {/* Overlaid Bottom Telemetry Status */}
                <div className="absolute bottom-4 left-4 bg-[#0a0f1d]/90 backdrop-blur-md border border-slate-800 rounded p-2.5 font-mono text-[11px] text-slate-300 space-y-0.5 shadow-xl">
                  <div className="text-slate-400">Telemetry Engine: Sentinel v1.0</div>
                  <div className="text-emerald-400">TLS 1.3 · OWASP Top 10 Compliant</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. COMPREHENSIVE DESCRIPTION OF ALL FEATURES */}
      <section id="features" ref={featuresRef} className="py-20 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="max-w-3xl mb-14">
            <div className="text-xs font-mono text-indigo-400 tracking-wider uppercase mb-2">
              PLATFORM CAPABILITIES
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              One unified workspace for authorized application security.
            </h2>
            <p className="text-slate-600 mt-3 text-sm sm:text-base leading-relaxed">
              Every feature is structured around the real workflow of application security engineers, QA teams,
              and infrastructure architects assessing modern distributed applications.
            </p>
          </div>

          {/* 6 Feature Blocks with Detailed Descriptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 01 */}
            <div className="feature-card p-6 bg-slate-50 border border-slate-200 rounded-md flex flex-col justify-between hover:border-slate-300 transition-colors shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-indigo-400">01</span>
                  <Crosshair className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Target Configuration</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">
                  Define the authorized application base URL, execution environment tier (Staging, Local Sandbox, Authorized Test),
                  and strict URL path inclusion rules. Sentinel enforces rate limits and request timeouts to ensure target stability.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200 font-mono text-[11px] text-slate-500">
                Non-destructive boundaries · Rate limiting ceiling
              </div>
            </div>

            {/* Feature 02 */}
            <div className="feature-card p-6 bg-slate-50 border border-slate-200 rounded-md flex flex-col justify-between hover:border-slate-300 transition-colors shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-indigo-400">02</span>
                  <Zap className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Security Testing</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">
                  Run structured automated checks across 7 security domains: Authentication, Authorization, API Security,
                  Input Validation, Client-Side Defenses, Transport Security, and Data Privacy.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200 font-mono text-[11px] text-slate-500">
                42 Standardized checks · OWASP & CWE aligned
              </div>
            </div>

            {/* Feature 03 */}
            <div className="feature-card p-6 bg-slate-50 border border-slate-200 rounded-md flex flex-col justify-between hover:border-slate-300 transition-colors shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-indigo-400">03</span>
                  <Terminal className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Evidence Analysis</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">
                  Inspect raw technical evidence for every finding: HTTP request method, full URL, headers, injected payload,
                  response status code, and sanitized response body. Sensitive authorization tokens and cookies are permanently redacted.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200 font-mono text-[11px] text-slate-500">
                Bearer token redaction · Zero secret leakage
              </div>
            </div>

            {/* Feature 04 */}
            <div className="feature-card p-6 bg-slate-50 border border-slate-200 rounded-md flex flex-col justify-between hover:border-slate-300 transition-colors shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-indigo-400">04</span>
                  <AlertTriangle className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Risk Assessment</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">
                  Evaluate real-world blast radius with CVSS v3.1 base scoring, CWE classification, and affected component mapping.
                  Prioritize critical and high issues before production deployments.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200 font-mono text-[11px] text-slate-500">
                CVSS v3.1 calculations · Common Weakness Taxonomy
              </div>
            </div>

            {/* Feature 05 */}
            <div className="feature-card p-6 bg-slate-50 border border-slate-200 rounded-md flex flex-col justify-between hover:border-slate-300 transition-colors shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-indigo-400">05</span>
                  <Code2 className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Developer Remediation</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">
                  Provide developers with copy-paste code patches, middleware examples, and step-by-step guidance to patch
                  BOLA/IDOR, CORS misconfigurations, and missing rate limits in minutes.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200 font-mono text-[11px] text-slate-500">
                TypeScript & Python samples · Actionable checklists
              </div>
            </div>

            {/* Feature 06 */}
            <div className="feature-card p-6 bg-slate-50 border border-slate-200 rounded-md flex flex-col justify-between hover:border-slate-300 transition-colors shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-indigo-400">06</span>
                  <FileText className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Executive Reporting</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">
                  Generate professional, client-deliverable security assessment reports including executive summaries,
                  methodology statements, findings distribution charts, and JSON/PDF exports.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200 font-mono text-[11px] text-slate-500">
                Client deliverables · JSON & PDF export ready
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECURITY MODULES SECTION */}
      <section id="modules" className="py-20 border-b border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="text-xs font-mono text-indigo-400 tracking-wider uppercase mb-2">
                ASSESSMENT SPECTRUM
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Assess the controls that matter.
              </h2>
            </div>
            <Link to="/modules">
              <Button variant="outline" size="sm" className="font-mono text-xs">
                <span>View All 7 Modules</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Authentication',
                slug: 'authentication',
                icon: Lock,
                checks: 8,
                ref: 'OWASP ASVS 2.0',
                desc: 'Brute-force resistance, session rotation on login, token revocation on logout, and password recovery entropy.'
              },
              {
                title: 'Authorization (BOLA & IDOR)',
                slug: 'authorization',
                icon: Shield,
                checks: 10,
                ref: 'OWASP API1:2023',
                desc: 'Multi-tenant isolation, cross-account object mutation, vertical privilege escalation, and role assignment integrity.'
              },
              {
                title: 'API Security',
                slug: 'api-security',
                icon: Server,
                checks: 9,
                ref: 'OWASP API Top 10',
                desc: 'CORS origins with credentials, rate limiting on critical endpoints, HTTP method override, and schema conformance.'
              },
              {
                title: 'Input Validation',
                slug: 'input-validation',
                icon: Zap,
                checks: 7,
                ref: 'CWE-89 / CWE-22',
                desc: 'Parameterized SQL audits, directory traversal sequences, JSON schema boundary fuzzing, and command injection resilience.'
              },
              {
                title: 'Client-Side Security',
                slug: 'client-security',
                icon: Globe,
                checks: 6,
                ref: 'OWASP ASVS 14.4',
                desc: 'Content-Security-Policy (CSP) script-src analysis, X-Frame-Options clickjacking barriers, and MIME sniffing protection.'
              },
              {
                title: 'Communication Security',
                slug: 'communication',
                icon: Activity,
                checks: 5,
                ref: 'NIST SP 800-52',
                desc: 'TLS 1.2/1.3 cipher suite negotiation, HSTS preload parameters, and Secure/SameSite cookie transport attributes.'
              },
              {
                title: 'Data & Privacy',
                slug: 'data-privacy',
                icon: Database,
                checks: 5,
                ref: 'CWE-209',
                desc: 'Stacktrace suppression in 5xx error states, PII leakage in query parameters, and sensitive payload caching rules.'
              },
            ].map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.slug}
                  className="p-5 bg-white border border-slate-200 rounded-md hover:border-slate-300 transition-colors flex flex-col justify-between shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 rounded bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-[11px] text-slate-500">
                        {mod.ref}
                      </span>
                    </div>
                    <h3 className="font-semibold text-base text-slate-900 mb-1.5">{mod.title}</h3>
                    <p className="text-slate-600 text-xs leading-relaxed">{mod.desc}</p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-400">{mod.checks} checks</span>
                    <Link
                      to={`/modules/${mod.slug}`}
                      className="text-indigo-400 hover:text-indigo-300 font-mono text-[11px] flex items-center gap-1"
                    >
                      <span>Explore</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. ASSESSMENT WORKFLOW SECTION */}
      <section id="workflow" className="py-20 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="max-w-2xl mb-12">
            <div className="text-xs font-mono text-indigo-400 tracking-wider uppercase mb-2">
              OPERATIONAL LIFECYCLE
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              A disciplined assessment workflow.
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              From authorization verification to executive delivery in four structured phases.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Scope & Authorization',
                desc: 'Configure authorized target URLs, verify environment certificates, and establish rate limits to prevent target degradation.',
              },
              {
                step: '02',
                title: 'Modular Probe Execution',
                desc: 'Select customized security modules. Sentinel dispatches non-destructive API fuzzers and inspects security headers.',
              },
              {
                step: '03',
                title: 'Evidence & Impact Analysis',
                desc: 'Review reproducible HTTP traces with automatically redacted credentials, CVSS scoring, and root-cause breakdowns.',
              },
              {
                step: '04',
                title: 'Reporting & Remediation',
                desc: 'Generate executive security reports and export developer code patches to close vulnerabilities before release.',
              },
            ].map((wf) => (
              <div key={wf.step} className="p-6 bg-slate-50 border border-slate-200 rounded-md relative shadow-sm">
                <span className="text-3xl font-mono font-bold text-indigo-500/30 mb-4 block">
                  {wf.step}
                </span>
                <h3 className="text-base font-semibold text-slate-900 mb-2">{wf.title}</h3>
                <p className="text-slate-600 text-xs leading-relaxed">{wf.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. DEDICATED DASHBOARD OPTION SECTION */}
      <section id="dashboard-access" className="py-20 border-b border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="bg-white border border-slate-200 rounded-md p-8 sm:p-12 shadow-lg">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-mono text-indigo-400 bg-indigo-950/70 border border-indigo-800/60 px-3 py-1 rounded-sm">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>DIRECT WORKSPACE ACCESS · NO AUTH WALL</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Enter the Security Assessment Workspace
                </h2>

                <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl">
                  Access the live dashboard to configure target endpoints, initiate automated assessment runs,
                  inspect detailed technical evidence, and manage vulnerability reports.
                </p>

                <div className="pt-2 flex flex-wrap gap-4">
                  <Link to="/dashboard">
                    <Button variant="primary" size="lg" className="h-11 px-8 text-sm font-semibold shadow-lg shadow-indigo-950/50">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      <span>Open Security Dashboard</span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Quick Metrics Glance Box */}
              <div className="lg:col-span-4 p-5 bg-slate-50 border border-slate-200 rounded-md font-mono text-xs space-y-3">
                <div className="text-slate-400 text-[11px] pb-2 border-b border-slate-800 flex justify-between">
                  <span>TARGET ENVIRONMENT</span>
                  <span className="text-emerald-400">READY</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Application:</span>
                  <span className="text-slate-900">World Monitor</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Evaluation Scope:</span>
                  <span className="text-slate-900">28 Endpoints</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Checks Catalog:</span>
                  <span className="text-indigo-400 font-bold">42 Rules</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Backend API:</span>
                  <span className="text-emerald-400">Mock / FastAPI Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="py-12 bg-white text-slate-500 text-xs border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-10 border-b border-slate-200">
            <div>
              <div className="font-semibold text-slate-900 font-mono text-xs mb-3">PLATFORM</div>
              <ul className="space-y-2">
                <li><Link to="/dashboard" className="hover:text-slate-900">Security Dashboard</Link></li>
                <li><Link to="/target" className="hover:text-slate-900">Target Scope</Link></li>
                <li><Link to="/assessment" className="hover:text-slate-900">Assessment Engine</Link></li>
                <li><Link to="/findings" className="hover:text-slate-900">Findings Registry</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-slate-900 font-mono text-xs mb-3">MODULES</div>
              <ul className="space-y-2">
                <li><Link to="/modules/authentication" className="hover:text-slate-900">Authentication</Link></li>
                <li><Link to="/modules/authorization" className="hover:text-slate-900">Authorization & BOLA</Link></li>
                <li><Link to="/modules/api-security" className="hover:text-slate-900">API Security</Link></li>
                <li><Link to="/modules/client-security" className="hover:text-slate-900">Client-Side CSP</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-slate-900 font-mono text-xs mb-3">BACKEND API</div>
              <ul className="space-y-2">
                <li><Link to="/settings" className="hover:text-slate-900">API Settings & Health</Link></li>
                <li><span className="text-slate-400 font-mono">FastAPI / Flask Specs</span></li>
                <li><a href="https://owasp.org" target="_blank" rel="noreferrer" className="hover:text-slate-900">OWASP Top 10 Standards</a></li>
                <li><a href="https://cwe.mitre.org" target="_blank" rel="noreferrer" className="hover:text-slate-900">CWE Dictionary</a></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-slate-900 font-mono text-xs mb-3">RESPONSIBLE TESTING</div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Sentinel is designed solely for authorized vulnerability assessments on systems where explicit testing permission has been granted.
              </p>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-400">Sentinel Security Platform</span>
              <span>·</span>
              <span>Version 1.0.0</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-indigo-400 hover:text-indigo-300 font-mono">
                Open Workspace Dashboard →
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
