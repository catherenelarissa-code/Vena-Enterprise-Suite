export default function Slide11Dashboard() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body">
      <div className="absolute top-0 left-0 right-0 h-[0.8vh] bg-primary" />
      <div className="relative flex flex-col h-full px-[8vw] py-[7vh]">
        <div className="flex items-start gap-[1.5vw] mb-[4.5vh]">
          <div className="w-[0.5vw] h-[5vh] bg-accent mt-[0.3vh] shrink-0" />
          <div>
            <div className="text-[2.4vw] text-muted font-body uppercase tracking-widest mb-[0.8vh]">Módulo — Dashboard</div>
            <div className="text-[3.4vw] font-bold text-text leading-snug" style={{ textWrap: "balance" }}>
              O dashboard consolida os principais indicadores operacionais em tempo real.
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-[2vw] mb-[3vh]">
          <div className="bg-primary text-white rounded-[0.5vw] px-[2vw] py-[2vh] flex flex-col gap-[1vh]">
            <div className="text-[2.2vw] text-white/70 uppercase tracking-wide">Saldo em Caixa</div>
            <div className="text-[4vw] font-bold leading-none">R$ 7.750</div>
            <div className="text-[2.2vw] text-white/70">Projeção semanal disponível</div>
          </div>
          <div className="bg-surface rounded-[0.5vw] px-[2vw] py-[2vh] flex flex-col gap-[1vh] border border-text/10">
            <div className="text-[2.2vw] text-muted uppercase tracking-wide">Compras Pendentes</div>
            <div className="text-[4vw] font-bold text-text leading-none">2</div>
            <div className="text-[2.2vw] text-muted">Aguardando ação dos responsáveis</div>
          </div>
          <div className="bg-surface rounded-[0.5vw] px-[2vw] py-[2vh] flex flex-col gap-[1vh] border border-text/10">
            <div className="text-[2.2vw] text-muted uppercase tracking-wide">Obras Ativas</div>
            <div className="text-[4vw] font-bold text-text leading-none">3</div>
            <div className="text-[2.2vw] text-muted">Em execução no momento</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-[4vw]">
          <div className="flex items-start gap-[1.2vw]">
            <div className="w-[0.4vw] min-h-[3.5vh] bg-primary shrink-0 mt-[0.5vh]" />
            <div className="text-[2.8vw] text-text leading-snug">
              Economia mensal estimada por cotações comparativas: <span className="font-bold text-primary">R$ 15.420</span>
            </div>
          </div>
          <div className="flex items-start gap-[1.2vw]">
            <div className="w-[0.4vw] min-h-[3.5vh] bg-primary shrink-0 mt-[0.5vh]" />
            <div className="text-[2.8vw] text-text leading-snug">
              Alertas classificados por severidade: Urgente, Atenção e Informativo.
            </div>
          </div>
        </div>
        <div className="absolute bottom-[3vh] right-[8vw] text-[2.2vw] text-muted">11 / 15</div>
      </div>
    </div>
  );
}
