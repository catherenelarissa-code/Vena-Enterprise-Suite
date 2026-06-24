export default function Slide04Solution() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body">
      <div className="absolute top-0 left-0 right-0 h-[0.8vh] bg-primary" />
      <div className="relative flex flex-col h-full px-[8vw] py-[7vh]">
        <div className="flex items-start gap-[1.5vw] mb-[5vh]">
          <div className="w-[0.5vw] h-[5vh] bg-accent mt-[0.3vh] shrink-0" />
          <div>
            <div className="text-[2.4vw] text-muted font-body uppercase tracking-widest mb-[0.8vh]">A Solução</div>
            <div className="text-[3.4vw] font-bold text-text leading-snug" style={{ textWrap: "balance" }}>
              A Vena resolve os cinco pontos de falha com módulos integrados.
            </div>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-[1.5vw]">
          <div className="flex flex-col gap-[1.5vh] bg-surface rounded-[0.5vw] p-[2vw]">
            <div className="text-[2.2vw] font-bold text-primary">Compras</div>
            <div className="text-[2.4vw] text-text leading-snug">Fluxo completo de solicitação → cotação → aprovação → pedido.</div>
          </div>
          <div className="flex flex-col gap-[1.5vh] bg-surface rounded-[0.5vw] p-[2vw]">
            <div className="text-[2.2vw] font-bold text-primary">Fornecedores</div>
            <div className="text-[2.4vw] text-text leading-snug">Cadastro, avaliação por critério e histórico de preços.</div>
          </div>
          <div className="flex flex-col gap-[1.5vh] bg-surface rounded-[0.5vw] p-[2vw]">
            <div className="text-[2.2vw] font-bold text-primary">Financeiro</div>
            <div className="text-[2.4vw] text-text leading-snug">Contas a pagar e a receber com status e vencimentos.</div>
          </div>
          <div className="flex flex-col gap-[1.5vh] bg-surface rounded-[0.5vw] p-[2vw]">
            <div className="text-[2.2vw] font-bold text-primary">Obras</div>
            <div className="text-[2.4vw] text-text leading-snug">Orçamento por projeto com acompanhamento de gasto em tempo real.</div>
          </div>
          <div className="flex flex-col gap-[1.5vh] bg-primary/10 rounded-[0.5vw] p-[2vw] border border-primary/30">
            <div className="text-[2.2vw] font-bold text-primary">Materiais + IA</div>
            <div className="text-[2.4vw] text-text leading-snug">Alertas automáticos e insights de IA para compra no momento certo.</div>
          </div>
        </div>
        <div className="absolute bottom-[3vh] right-[8vw] text-[2.2vw] text-muted">4 / 15</div>
      </div>
    </div>
  );
}
