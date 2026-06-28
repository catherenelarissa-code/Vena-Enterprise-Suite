export function AuthBackdrop() {
  return (
    <>
      {/* Grid de fundo animado */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" />

      {/* Orbs flutuantes */}
      <div
        className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full blur-3xl glow-orb"
        style={{ background: "radial-gradient(circle, rgba(31,122,87,0.55), transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-20 h-80 w-80 rounded-full blur-3xl glow-orb"
        style={{ background: "radial-gradient(circle, rgba(245,138,31,0.35), transparent 70%)", animationDelay: "2s" }}
      />

      <SchematicBackdrop />
    </>
  );
}

function SchematicBackdrop() {
  const traces = [
    { d: "M 0 120 L 220 120 L 260 160 L 520 160", delay: 0 },
    { d: "M 520 160 L 560 120 L 820 120 L 860 160 L 1040 160", delay: 0.3 },
    { d: "M 260 160 L 260 320 L 420 320", delay: 0.6 },
    { d: "M 420 320 L 460 360 L 460 520 L 640 520", delay: 0.9 },
    { d: "M 640 520 L 680 480 L 880 480 L 880 360 L 1040 360", delay: 1.2 },
    { d: "M 0 600 L 200 600 L 240 560 L 420 560", delay: 1.5 },
    { d: "M 560 120 L 560 40", delay: 1.8 },
    { d: "M 820 120 L 820 40", delay: 2.0 },
  ];

  const nodes = [
    { cx: 260, cy: 160, delay: 1.4 },
    { cx: 520, cy: 160, delay: 1.6 },
    { cx: 560, cy: 120, delay: 1.8 },
    { cx: 820, cy: 120, delay: 2.0 },
    { cx: 460, cy: 360, delay: 2.2 },
    { cx: 640, cy: 520, delay: 2.4 },
    { cx: 880, cy: 360, delay: 2.6 },
    { cx: 420, cy: 320, delay: 2.0 },
  ];

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1040 720"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="traceGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1F7A57" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#8FD94B" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#43B97A" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#F58A1F" stopOpacity="0" />
          <stop offset="50%" stopColor="#FFB74D" stopOpacity="1" />
          <stop offset="100%" stopColor="#F58A1F" stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {traces.map((t, i) => (
        <path key={`g${i}`} d={t.d} stroke="rgba(143,217,75,0.05)" strokeWidth="1" fill="none" />
      ))}

      {traces.map((t, i) => (
        <path
          key={`t${i}`}
          d={t.d}
          stroke="url(#traceGrad)"
          strokeWidth="1.5"
          fill="none"
          filter="url(#glow)"
          className="schematic-trace"
          style={{ animationDelay: `${t.delay}s` }}
        />
      ))}

      {nodes.map((n, i) => (
        <circle
          key={`n${i}`}
          cx={n.cx}
          cy={n.cy}
          r="4"
          fill="var(--brand-neon)"
          className="schematic-node"
          style={{ animationDelay: `${n.delay}s` }}
        />
      ))}

      <g style={{ animationDelay: "2.4s" }} className="schematic-trace" strokeDasharray="80" stroke="var(--brand-neon)" strokeWidth="1.5" fill="none" filter="url(#glow)">
        <path d="M 340 160 L 348 150 L 360 170 L 372 150 L 384 170 L 396 150 L 408 170 L 420 160" />
      </g>

      <g style={{ animationDelay: "2.6s" }} className="schematic-trace" strokeDasharray="60" stroke="var(--brand-orange)" strokeWidth="1.8" fill="none" filter="url(#glow)">
        <path d="M 700 480 L 700 460 M 700 500 L 700 520 M 690 460 L 710 460 M 690 480 L 710 480" />
      </g>

      <g style={{ animationDelay: "2.8s" }} className="schematic-trace" strokeDasharray="50" stroke="var(--brand-neon)" strokeWidth="1.5" fill="none">
        <path d="M 600 120 L 615 110 M 595 120 L 625 120" />
        <circle cx="595" cy="120" r="2.5" fill="var(--brand-neon)" />
        <circle cx="625" cy="120" r="2.5" fill="var(--brand-neon)" />
      </g>

      <path
        d="M 0 120 L 220 120 L 260 160 L 520 160 L 560 120 L 820 120 L 860 160 L 1040 160"
        stroke="url(#sparkGrad)"
        strokeWidth="2.5"
        fill="none"
        className="schematic-spark"
        style={{ animationDelay: "3.4s" }}
      />
      <path
        d="M 0 600 L 200 600 L 240 560 L 420 560 L 460 520 L 640 520 L 680 480 L 880 480"
        stroke="url(#sparkGrad)"
        strokeWidth="2"
        fill="none"
        className="schematic-spark"
        style={{ animationDelay: "4.2s", animationDuration: "4s" }}
      />

      <g fill="rgba(143,217,75,0.55)" fontFamily="ui-monospace, monospace" fontSize="10" className="schematic-node" style={{ animationDelay: "3s" }}>
        <text x="270" y="148">220V</text>
        <text x="828" y="108">3∅ · 60Hz</text>
        <text x="468" y="350">R₁ 4.7kΩ</text>
        <text x="716" y="500">C₁ 470µF</text>
      </g>
    </svg>
  );
}

export function AuthShell({ children, maxWidth = "max-w-md" }: { children: React.ReactNode; maxWidth?: string }) {
  return (
    <main
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-10"
      style={{ background: "var(--gradient-hero)" }}
    >
      <AuthBackdrop />
      <section className={`relative z-10 w-full ${maxWidth} fade-up`}>
        <div
          className="rounded-2xl px-7 py-8 backdrop-blur-xl"
          style={{
            background: "linear-gradient(180deg, rgba(16,33,26,0.92), rgba(7,17,13,0.92))",
            border: "1px solid var(--auth-bg-border)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {children}
        </div>
      </section>
    </main>
  );
}

export function AuthLogo({ size = "lg" }: { size?: "lg" | "sm" }) {
  return (
    <div
      className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl"
      style={{
        background: "linear-gradient(135deg, rgba(245,138,31,0.18), rgba(143,217,75,0.12))",
        border: "1px solid rgba(143,217,75,0.25)",
        boxShadow: "var(--shadow-glow-orange)",
        width: size === "lg" ? "3.5rem" : "2.5rem",
        height: size === "lg" ? "3.5rem" : "2.5rem",
      }}
    >
      <svg viewBox="0 0 40 40" className="h-8 w-8" aria-hidden>
        <path d="M8 6 L22 6 L18 20 L4 20 Z" fill="var(--brand-orange)" />
        <path d="M18 20 L32 20 L28 34 L14 34 Z" fill="var(--brand-orange-strong)" />
      </svg>
    </div>
  );
}
