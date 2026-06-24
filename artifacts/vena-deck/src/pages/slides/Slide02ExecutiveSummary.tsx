export default function Slide02ExecutiveSummary() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body">
      <div className="absolute top-0 left-0 right-0 h-[0.8vh] bg-primary" />
      <div className="relative flex flex-col h-full px-[8vw] py-[7vh]">
        <div className="flex items-start gap-[1.5vw] mb-[5vh]">
          <div className="w-[0.5vw] h-[5vh] bg-accent mt-[0.3vh] shrink-0" />
          <div>
            <div className="text-[2.4vw] text-muted font-body uppercase tracking-widest mb-[0.8vh]">Sumário Executivo</div>
            <div className="text-[3.4vw] font-bold text-text leading-snug" style={{ textWrap: "balance" }}>
              A Vena centraliza compras, obras e financeiro em um único sistema.
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-[2.8vh] pl-[2vw]">
          <div className="flex items-start gap-[2vw] border-b border-text/10 pb-[2.8vh]">
            <div className="text-[2.8vw] font-bold text-primary leading-none mt-[0.3vh] shrink-0">01</div>
            <div className="text-[2.8vw] text-text leading-snug">
              O Monitor de Preços com IA reduz o custo médio de aquisição de materiais elétricos.
            </div>
          </div>
          <div className="flex items-start gap-[2vw] border-b border-text/10 pb-[2.8vh]">
            <div className="text-[2.8vw] font-bold text-primary leading-none mt-[0.3vh] shrink-0">02</div>
            <div className="text-[2.8vw] text-text leading-snug">
              O sistema é fechado por design: acesso apenas por aprovação administrativa.
            </div>
          </div>
          <div className="flex items-start gap-[2vw] border-b border-text/10 pb-[2.8vh]">
            <div className="text-[2.8vw] font-bold text-primary leading-none mt-[0.3vh] shrink-0">03</div>
            <div className="text-[2.8vw] text-text leading-snug">
              As cinco obras ativas totalizam R$ 1.633.000 em orçamento gerenciado.
            </div>
          </div>
          <div className="flex items-start gap-[2vw]">
            <div className="text-[2.8vw] font-bold text-primary leading-none mt-[0.3vh] shrink-0">04</div>
            <div className="text-[2.8vw] text-text leading-snug">
              Esta apresentação cobre arquitetura, módulos, dados operacionais e próximos passos.
            </div>
          </div>
        </div>
        <div className="absolute bottom-[3vh] right-[8vw] text-[2.2vw] text-muted">2 / 15</div>
      </div>
    </div>
  );
}
