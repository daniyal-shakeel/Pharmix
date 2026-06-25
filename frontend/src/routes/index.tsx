import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Pill,
  Truck,
  ShieldCheck,
  Zap,
  Boxes,
  CircleCheck,
  Github,
  Sun,
  Moon,
  BarChart3,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pharmix — Pharmaceutical Supply Chain, reimagined" },
      {
        name: "description",
        content:
          "The operating system for pharmaceutical supply chains. Inventory, orders, shipments, payments and live tracking — built for manufacturers, pharmacies and customers.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-canvas text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-canvas/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto h-14 px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary/15 border border-primary/30 grid place-items-center">
              <Pill className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="font-semibold tracking-tight">Pharmix</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-xs text-muted-foreground">
            <a href="#product" className="hover:text-foreground transition-colors">
              Product
            </a>
            <a href="#modules" className="hover:text-foreground transition-colors">
              Modules
            </a>
            <a href="#analytics" className="hover:text-foreground transition-colors">
              Analytics
            </a>
            <a href="#pricing" className="hover:text-foreground transition-colors">
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login">
              <Button variant="ghost" size="sm" className="h-8 text-xs hidden sm:inline-flex">
                Sign in
              </Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90">
                Open app <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 grid-bg radial-fade opacity-60" />
        <div className="absolute left-1/2 -translate-x-1/2 top-40 h-[400px] w-[800px] rounded-full bg-primary/10 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-4 pt-24 pb-20 text-center">
          <Badge variant="outline" className="mb-6 bg-surface border-border text-[11px] gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-dot" />
            New · Real-time GPS shipment tracking
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-semibold tracking-tightest text-balance leading-[0.95] max-w-4xl mx-auto">
            Pharmaceutical supply chain,
            <br />
            <span className="text-muted-foreground">built for speed.</span>
          </h1>
          <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-xl mx-auto text-balance">
            From manufacturer to patient. Pharmix unifies inventory, orders, shipments and payments
            in a single dense, fast, beautiful workspace.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link to="/login">
              <Button size="lg" className="h-10 px-5 text-sm bg-primary hover:bg-primary/90">
                Launch demo <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="h-10 px-5 text-sm border-border bg-surface hover:bg-surface-2"
            >
              <Github className="mr-1.5 h-3.5 w-3.5" /> Documentation
            </Button>
          </div>

          {/* Hero product mock */}
          <div className="mt-16 relative mx-auto max-w-5xl">
            <div className="absolute inset-x-0 -bottom-10 h-40 bg-primary/10 blur-3xl" />
            <div className="relative rounded-2xl border border-border bg-surface overflow-hidden shadow-2xl">
              <div className="h-9 border-b border-border bg-surface-2 flex items-center px-3 gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-surface-3" />
                <span className="h-2.5 w-2.5 rounded-full bg-surface-3" />
                <span className="h-2.5 w-2.5 rounded-full bg-surface-3" />
                <span className="ml-3 text-[11px] text-muted-foreground">
                  app.pharmix.io / dashboard
                </span>
              </div>
              <div className="grid grid-cols-12 min-h-[420px]">
                <aside className="hidden sm:block col-span-2 border-r border-border bg-sidebar p-3 space-y-1">
                  {["Dashboard", "Catalog", "Orders", "Shipments", "Payments", "Analytics"].map(
                    (l, i) => (
                      <div
                        key={l}
                        className={`text-[11px] px-2 py-1.5 rounded-md ${i === 0 ? "bg-accent text-foreground" : "text-muted-foreground"}`}
                      >
                        {l}
                      </div>
                    ),
                  )}
                </aside>
                <div className="col-span-12 sm:col-span-10 p-5 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { l: "Revenue", v: "Rs 79.2M", d: "+12.4%" },
                      { l: "Orders", v: "1,284", d: "+5.1%" },
                      { l: "Shipments", v: "318", d: "+2.8%" },
                      { l: "On-time", v: "97.2%", d: "+0.6%" },
                    ].map((s) => (
                      <div
                        key={s.l}
                        className="rounded-lg border border-border bg-surface-2 p-3 text-left"
                      >
                        <div className="text-[10px] text-muted-foreground">{s.l}</div>
                        <div className="text-sm font-semibold mt-1 tabular-nums">{s.v}</div>
                        <div className="text-[10px] text-success mt-0.5">{s.d}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="col-span-1 sm:col-span-2 rounded-lg border border-border bg-surface-2 p-4 h-48">
                      <div className="text-[11px] text-muted-foreground mb-3">
                        Revenue · 12 months
                      </div>
                      <svg viewBox="0 0 400 130" className="w-full h-32">
                        <defs>
                          <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="oklch(0.58 0.16 277)" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="oklch(0.58 0.16 277)" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0,90 C40,80 60,60 100,55 C140,50 160,80 200,70 C240,60 260,30 300,25 C340,20 360,40 400,30 L400,130 L0,130 Z"
                          fill="url(#g)"
                        />
                        <path
                          d="M0,90 C40,80 60,60 100,55 C140,50 160,80 200,70 C240,60 260,30 300,25 C340,20 360,40 400,30"
                          stroke="oklch(0.58 0.16 277)"
                          strokeWidth="1.5"
                          fill="none"
                        />
                      </svg>
                    </div>
                    <div className="rounded-lg border border-border bg-surface-2 p-4 h-48">
                      <div className="text-[11px] text-muted-foreground mb-3">Live shipments</div>
                      {["Warehouse 1 → City 1", "Warehouse 2 → City 2", "Warehouse 3 → City 3"].map(
                        (r, i) => (
                          <div
                            key={r}
                            className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                          >
                            <div className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-success pulse-dot" />
                              <span className="text-[11px]">{r}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {[12, 28, 41][i]}m
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logos / trust */}
      <section className="border-b border-border py-10">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground text-center mb-6">
            Trusted by leading pharmaceutical networks
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 opacity-60">
            {[
              "Manufacturer 1",
              "Manufacturer 2",
              "Manufacturer 3",
              "Manufacturer 4",
              "Manufacturer 5",
              "Pharmacy 1",
            ].map((n) => (
              <span key={n} className="text-sm font-medium tracking-tight text-muted-foreground">
                {n}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="border-b border-border py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-2xl">
            <Badge variant="outline" className="bg-surface border-border text-[11px] mb-4">
              Modules
            </Badge>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tightest text-balance">
              One platform. Five roles. Zero friction.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Purpose-built workflows for every actor in the pharmaceutical chain.
            </p>
          </div>
          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                i: ShieldCheck,
                t: "Admin",
                d: "Full network oversight, compliance, user & partner management.",
              },
              {
                i: Boxes,
                t: "Manufacturer",
                d: "Batch tracking, expiry control, dispatch and warehouse insights.",
              },
              {
                i: Pill,
                t: "Pharmacy",
                d: "Catalog, ordering, inventory, supplier management & reorders.",
              },
              {
                i: BarChart3,
                t: "Customer",
                d: "Search, prescriptions, secure checkout, live order tracking.",
              },
              {
                i: Truck,
                t: "Delivery",
                d: "Assigned routes, GPS navigation, ETAs, earnings dashboard.",
              },
              {
                i: Zap,
                t: "AI Insights",
                d: "Demand forecasting, stockout prediction, anomaly detection.",
              },
            ].map((m) => (
              <div
                key={m.t}
                className="surface rounded-xl p-5 hover:border-border-strong transition-colors group"
              >
                <div className="h-8 w-8 rounded-md bg-primary/10 border border-primary/20 grid place-items-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <m.i className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-medium">{m.t}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{m.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature split */}
      <section id="analytics" className="border-b border-border py-24">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <Badge variant="outline" className="bg-surface border-border text-[11px] mb-4">
              Analytics
            </Badge>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tightest text-balance">
              Decisions backed by data.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-md">
              Demand forecasts, expiry windows, warehouse utilization and revenue trends — all
              rendered in real-time, all in one place.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {[
                "Real-time demand & inventory dashboards",
                "Predictive stockout & expiry alerts",
                "Multi-warehouse utilization heatmaps",
                "Revenue, margin & SKU profitability",
              ].map((l) => (
                <li key={l} className="flex items-center gap-2 text-muted-foreground">
                  <CircleCheck className="h-4 w-4 text-primary" /> {l}
                </li>
              ))}
            </ul>
          </div>
          <div className="surface rounded-xl p-5">
            <div className="text-[11px] text-muted-foreground mb-3">Demand · last 30 days</div>
            <svg viewBox="0 0 400 180" className="w-full h-44">
              {[40, 90, 60, 120, 80, 150, 110, 170, 130, 100, 160, 140].map((h, i) => (
                <rect
                  key={i}
                  x={i * 32 + 6}
                  y={180 - h}
                  width="20"
                  height={h}
                  rx="3"
                  fill={i % 3 === 0 ? "oklch(0.58 0.16 277)" : "oklch(0.58 0.16 277 / 0.4)"}
                />
              ))}
            </svg>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tightest text-balance">
            Ready when you are.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Open the demo workspace. No backend, no signup friction.
          </p>
          <div className="mt-8">
            <Link to="/login">
              <Button size="lg" className="h-11 px-6 bg-primary hover:bg-primary/90">
                Open Pharmix <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Pill className="h-3.5 w-3.5 text-primary" />
            <span>© 2026 Pharmix. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <a className="hover:text-foreground" href="#">
              Privacy
            </a>
            <a className="hover:text-foreground" href="#">
              Terms
            </a>
            <a className="hover:text-foreground" href="#">
              Status
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
