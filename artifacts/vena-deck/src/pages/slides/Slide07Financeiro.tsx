export default function Slide07Financeiro() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body">
      <div className="absolute top-0 left-0 right-0 h-[0.8vh] bg-primary" />
      <div className="relative flex flex-col h-full px-[8vw] py-[7vh]">
        <div className="flex items-start gap-[1.5vw] mb-[4vh]">
          <div className="w-[0.5vw] h-[5vh] bg-accent mt-[0.3vh] shrink-0" />
          <div>
            <div className="text-[2.4vw] text-muted font-body uppercase tracking-widest mb-[0.8vh]">Módulo — Financeiro</div>
            <div className="text-[3.4vw] font-bold text-text leading-snug" style={{ textWrap: "balance" }}>
              O módulo Financeiro consolida R$ 276.900 em contas a pagar e R$ 299.000 a receber.
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-[4vw]">
          <div className="flex flex-col gap-[2vh]">
            <div className="text-[2.4vw] font-bold text-primary uppercase tracking-wide">A Pagar</div>
            <div className="flex justify-between items-baseline border-b border-text/10 pb-[1.5vh]">
              <div className="text-[2.4vw] text-text">Transformadores WEG 500kVA</div>
              <div className="text-[2.4vw] font-bold text-text">R$ 57.000</div>
            </div>
            <div className="flex justify-between items-baseline border-b border-text/10 pb-[1.5vh]">
              <div className="text-[2.4vw] text-text">Mão de obra — Junho/2025</div>
              <div className="text-[2.4vw] font-bold text-text">R$ 42.000</div>
            </div>
            <div className="flex justify-between items-baseline border-b border-text/10 pb-[1.5vh]">
              <div className="text-[2.4vw] text-text">Inversores Fronius</div>
              <div className="text-[2.4vw] font-bold text-text">R$ 29.100</div>
            </div>
            <div className="flex justify-between items-baseline bg-accent/10 px-[1vw] py-[0.8vh] rounded border border-accent/30">
              <div className="text-[2.4vw] font-bold text-accent">Vencida: Disjuntores Schneider</div>
              <div className="text-[2.4vw] font-bold text-accent">R$ 12.450</div>
            </div>
          </div>
          <div className="flex flex-col gap-[2vh]">
            <div className="text-[2.4vw] font-bold text-primary uppercase tracking-wide">A Receber</div>
            <div className="flex justify-between items-baseline border-b border-text/10 pb-[1.5vh]">
              <div className="text-[2.4vw] text-text">Medição 03/2025 — Metalúrgica</div>
              <div className="text-[2.4vw] font-bold text-text">R$ 95.000</div>
            </div>
            <div className="flex justify-between items-baseline border-b border-text/10 pb-[1.5vh]">
              <div className="text-[2.4vw] text-text">Medição 02/2025 — Condomínio</div>
              <div className="text-[2.4vw] font-bold text-text">R$ 68.000</div>
            </div>
            <div className="flex justify-between items-baseline">
              <div className="text-[2.4vw] text-muted">Adiantamento Fazenda Horizonte</div>
              <div className="text-[2.4vw] text-muted">R$ 136.000 (quitado)</div>
            </div>
          </div>
        </div>
        <div className="mt-[2.5vh] text-[2.2vw] text-muted">10 lançamentos registrados · Fonte: dados operacionais da plataforma, junho 2026</div>
        <div className="absolute bottom-[3vh] right-[8vw] text-[2.2vw] text-muted">7 / 15</div>
      </div>
    </div>
  );
}
