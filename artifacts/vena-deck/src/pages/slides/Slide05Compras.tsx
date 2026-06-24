export default function Slide05Compras() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body">
      <div className="absolute top-0 left-0 right-0 h-[0.8vh] bg-primary" />
      <div className="relative flex flex-col h-full px-[8vw] py-[7vh]">
        <div className="flex items-start gap-[1.5vw] mb-[5vh]">
          <div className="w-[0.5vw] h-[5vh] bg-accent mt-[0.3vh] shrink-0" />
          <div>
            <div className="text-[2.4vw] text-muted font-body uppercase tracking-widest mb-[0.8vh]">Módulo — Compras</div>
            <div className="text-[3.4vw] font-bold text-text leading-snug" style={{ textWrap: "balance" }}>
              O módulo de Compras controla todo o ciclo de aquisição.
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-[6vw] gap-y-[2.5vh]">
          <div className="flex flex-col gap-[2.5vh]">
            <div className="flex items-start gap-[1.5vw]">
              <div className="w-[0.4vw] min-h-[3.5vh] bg-primary shrink-0 mt-[0.5vh]" />
              <div className="text-[2.8vw] text-text leading-snug">Solicitações categorizadas por urgência: Normal, Alta e Urgente.</div>
            </div>
            <div className="flex items-start gap-[1.5vw]">
              <div className="w-[0.4vw] min-h-[3.5vh] bg-primary shrink-0 mt-[0.5vh]" />
              <div className="text-[2.8vw] text-text leading-snug">Cada solicitação vincula itens a uma obra ou ao estoque geral.</div>
            </div>
            <div className="flex items-start gap-[1.5vw]">
              <div className="w-[0.4vw] min-h-[3.5vh] bg-primary shrink-0 mt-[0.5vh]" />
              <div className="text-[2.8vw] text-text leading-snug">Comparação automática de cotações com recomendação gerada por IA.</div>
            </div>
          </div>
          <div className="flex flex-col gap-[2vh]">
            <div className="text-[2.4vw] font-bold text-primary uppercase tracking-wide mb-[1vh]">Fluxo de Status</div>
            <div className="flex items-center gap-[1vw]">
              <div className="bg-surface text-[2.2vw] font-body text-text px-[1.5vw] py-[0.8vh] rounded">Pendente</div>
              <div className="text-[2.2vw] text-muted">→</div>
              <div className="bg-surface text-[2.2vw] font-body text-text px-[1.5vw] py-[0.8vh] rounded">Em Cotação</div>
              <div className="text-[2.2vw] text-muted">→</div>
              <div className="bg-surface text-[2.2vw] font-body text-text px-[1.5vw] py-[0.8vh] rounded">Aprovado</div>
            </div>
            <div className="flex items-center gap-[1vw] pl-[7vw]">
              <div className="text-[2.2vw] text-muted">→</div>
              <div className="bg-surface text-[2.2vw] font-body text-text px-[1.5vw] py-[0.8vh] rounded">Pedido</div>
              <div className="text-[2.2vw] text-muted">→</div>
              <div className="bg-primary text-[2.2vw] font-bold text-white px-[1.5vw] py-[0.8vh] rounded">Entregue</div>
            </div>
            <div className="mt-[2vh] border-t border-text/10 pt-[2vh]">
              <div className="text-[2.6vw] text-text">
                <span className="font-bold text-accent">3</span> solicitações ativas · <span className="font-bold text-accent">2</span> aguardando ação dos responsáveis.
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-[3vh] right-[8vw] text-[2.2vw] text-muted">5 / 15</div>
      </div>
    </div>
  );
}
