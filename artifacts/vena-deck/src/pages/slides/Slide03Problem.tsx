export default function Slide03Problem() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body">
      <div className="absolute top-0 left-0 right-0 h-[0.8vh] bg-primary" />
      <div className="relative flex flex-col h-full px-[8vw] py-[7vh]">
        <div className="flex items-start gap-[1.5vw] mb-[5vh]">
          <div className="w-[0.5vw] h-[5vh] bg-accent mt-[0.3vh] shrink-0" />
          <div>
            <div className="text-[2.4vw] text-muted font-body uppercase tracking-widest mb-[0.8vh]">O Problema</div>
            <div className="text-[3.4vw] font-bold text-text leading-snug" style={{ textWrap: "balance" }}>
              A gestão fragmentada de compras gera retrabalho e perda de controle orçamentário.
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-[4vw] gap-y-[2.5vh]">
          <div className="flex items-start gap-[1.2vw]">
            <div className="w-[0.4vw] h-full min-h-[4vh] bg-accent/40 shrink-0 mt-[0.5vh]" />
            <div className="text-[2.8vw] text-text leading-snug">
              Solicitações de compra em planilhas e e-mails dificultam rastreabilidade.
            </div>
          </div>
          <div className="flex items-start gap-[1.2vw]">
            <div className="w-[0.4vw] h-full min-h-[4vh] bg-accent/40 shrink-0 mt-[0.5vh]" />
            <div className="text-[2.8vw] text-text leading-snug">
              Cotações de fornecedores não são comparadas sistematicamente.
            </div>
          </div>
          <div className="flex items-start gap-[1.2vw]">
            <div className="w-[0.4vw] h-full min-h-[4vh] bg-accent/40 shrink-0 mt-[0.5vh]" />
            <div className="text-[2.8vw] text-text leading-snug">
              Estoque baixo só é descoberto quando a obra já está parada.
            </div>
          </div>
          <div className="flex items-start gap-[1.2vw]">
            <div className="w-[0.4vw] h-full min-h-[4vh] bg-accent/40 shrink-0 mt-[0.5vh]" />
            <div className="text-[2.8vw] text-text leading-snug">
              Contas a pagar vencidas elevam o custo financeiro e prejudicam fornecedores.
            </div>
          </div>
          <div className="flex items-start gap-[1.2vw] col-span-2">
            <div className="w-[0.4vw] h-full min-h-[4vh] bg-accent/40 shrink-0 mt-[0.5vh]" />
            <div className="text-[2.8vw] text-text leading-snug">
              A ausência de histórico de preços impede negociações bem fundamentadas.
            </div>
          </div>
        </div>
        <div className="absolute bottom-[3vh] right-[8vw] text-[2.2vw] text-muted">3 / 15</div>
      </div>
    </div>
  );
}
