export default function Slide09Materiais() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body">
      <div className="absolute top-0 left-0 right-0 h-[0.8vh] bg-primary" />
      <div className="relative flex flex-col h-full px-[8vw] py-[7vh]">
        <div className="flex items-start gap-[1.5vw] mb-[4vh]">
          <div className="w-[0.5vw] h-[5vh] bg-accent mt-[0.3vh] shrink-0" />
          <div>
            <div className="text-[2.4vw] text-muted font-body uppercase tracking-widest mb-[0.8vh]">Módulo — Materiais</div>
            <div className="text-[3.4vw] font-bold text-text leading-snug" style={{ textWrap: "balance" }}>
              O estoque apresenta quatro itens abaixo do mínimo operacional.
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-[4vw]">
          <div className="flex flex-col gap-[2vh]">
            <div className="text-[2.4vw] font-bold text-accent uppercase tracking-wide">Itens Críticos</div>
            <div className="flex flex-col gap-[1.8vh]">
              <div className="bg-accent/10 border border-accent/30 rounded px-[1.5vw] py-[1.2vh]">
                <div className="text-[2.4vw] font-bold text-text">Eletroduto 3/4"</div>
                <div className="text-[2.2vw] text-accent">5m em estoque · mínimo 50m</div>
              </div>
              <div className="bg-accent/10 border border-accent/30 rounded px-[1.5vw] py-[1.2vh]">
                <div className="text-[2.4vw] font-bold text-text">EPI Luva Isolante Classe 2</div>
                <div className="text-[2.2vw] text-accent">3 pares em estoque · mínimo 5 pares</div>
              </div>
              <div className="bg-accent/10 border border-accent/30 rounded px-[1.5vw] py-[1.2vh]">
                <div className="text-[2.4vw] font-bold text-text">Disjuntor Tripolar 63A</div>
                <div className="text-[2.2vw] text-accent">8 unidades em estoque · mínimo 10</div>
              </div>
              <div className="bg-accent/10 border border-accent/30 rounded px-[1.5vw] py-[1.2vh]">
                <div className="text-[2.4vw] font-bold text-text">Cabo Flexível 10mm²</div>
                <div className="text-[2.2vw] text-accent">120m em estoque · mínimo 200m</div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-[2vh]">
            <div className="text-[2.4vw] font-bold text-primary uppercase tracking-wide">Situação Geral</div>
            <div className="flex flex-col gap-[1.8vh]">
              <div className="flex items-start gap-[1.2vw]">
                <div className="w-[0.4vw] min-h-[3.5vh] bg-primary shrink-0 mt-[0.5vh]" />
                <div className="text-[2.6vw] text-text leading-snug">12 itens cadastrados em três almoxarifados e pátio.</div>
              </div>
              <div className="flex items-start gap-[1.2vw]">
                <div className="w-[0.4vw] min-h-[3.5vh] bg-primary shrink-0 mt-[0.5vh]" />
                <div className="text-[2.6vw] text-text leading-snug">Alertas automáticos gerados para os responsáveis de compra.</div>
              </div>
              <div className="flex items-start gap-[1.2vw]">
                <div className="w-[0.4vw] min-h-[3.5vh] bg-primary shrink-0 mt-[0.5vh]" />
                <div className="text-[2.6vw] text-text leading-snug">Último preço e localização física registrados por item.</div>
              </div>
              <div className="flex items-start gap-[1.2vw]">
                <div className="w-[0.4vw] min-h-[3.5vh] bg-primary/30 shrink-0 mt-[0.5vh]" />
                <div className="text-[2.6vw] text-muted leading-snug">Cabo Flexível 16mm² e Eletrocalha dentro dos limites — sem ação necessária.</div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-[3vh] right-[8vw] text-[2.2vw] text-muted">9 / 15</div>
      </div>
    </div>
  );
}
