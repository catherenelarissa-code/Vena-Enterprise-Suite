export default function Slide14Roadmap() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body">
      <div className="absolute top-0 left-0 right-0 h-[0.8vh] bg-primary" />
      <div className="relative flex flex-col h-full px-[8vw] py-[7vh]">
        <div className="flex items-start gap-[1.5vw] mb-[5vh]">
          <div className="w-[0.5vw] h-[5vh] bg-accent mt-[0.3vh] shrink-0" />
          <div>
            <div className="text-[2.4vw] text-muted font-body uppercase tracking-widest mb-[0.8vh]">Próximos Passos</div>
            <div className="text-[3.4vw] font-bold text-text leading-snug" style={{ textWrap: "balance" }}>
              Três iniciativas estão priorizadas para o próximo ciclo de desenvolvimento.
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-[3vh]">
          <div className="flex items-start gap-[3vw] border-b border-text/10 pb-[3vh]">
            <div className="text-[4vw] font-bold text-primary/30 leading-none shrink-0 mt-[0.5vh]">1</div>
            <div className="flex flex-col gap-[0.8vh]">
              <div className="text-[3vw] font-bold text-text">Relatórios exportáveis em PDF</div>
              <div className="text-[2.6vw] text-muted">Por obra, fornecedor e período financeiro — eliminando exportação manual para planilhas.</div>
            </div>
          </div>
          <div className="flex items-start gap-[3vw] border-b border-text/10 pb-[3vh]">
            <div className="text-[4vw] font-bold text-primary/30 leading-none shrink-0 mt-[0.5vh]">2</div>
            <div className="flex flex-col gap-[0.8vh]">
              <div className="text-[3vw] font-bold text-text">Integração com NF-e</div>
              <div className="text-[2.6vw] text-muted">Leitura automática de nota fiscal para baixa de estoque e lançamento financeiro direto.</div>
            </div>
          </div>
          <div className="flex items-start gap-[3vw]">
            <div className="text-[4vw] font-bold text-primary/30 leading-none shrink-0 mt-[0.5vh]">3</div>
            <div className="flex flex-col gap-[0.8vh]">
              <div className="text-[3vw] font-bold text-text">Histórico de cotações e saving acumulado</div>
              <div className="text-[2.6vw] text-muted">Registro de cotações aprovadas com cálculo de economia acumulada por obra e por fornecedor.</div>
            </div>
          </div>
        </div>
        <div className="mt-[3vh] border-t border-text/10 pt-[2.5vh] flex justify-between items-baseline">
          <div className="text-[2.4vw] text-muted">Critério: impacto direto na redução de retrabalho operacional.</div>
          <div className="text-[2.6vw] font-bold text-text">Estimativa: 6 a 10 semanas</div>
        </div>
        <div className="absolute bottom-[3vh] right-[8vw] text-[2.2vw] text-muted">14 / 15</div>
      </div>
    </div>
  );
}
