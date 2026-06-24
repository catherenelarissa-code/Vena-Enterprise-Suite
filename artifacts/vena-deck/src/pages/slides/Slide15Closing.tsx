export default function Slide15Closing() {
  return (
    <div className="relative w-screen h-screen overflow-hidden font-body">
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0B7A57 0%, #085c42 100%)" }} />
      <div className="absolute top-0 left-0 right-0 h-[0.5vh] bg-accent" />
      <div className="relative flex flex-col justify-between h-full px-[8vw] py-[8vh]">
        <div className="flex items-center gap-[1.5vw]">
          <div className="text-[3.5vw] font-bold text-white tracking-tight">VENA</div>
          <div className="w-[0.4vw] h-[3.5vw] bg-accent" />
          <div className="text-[1.8vw] text-white/70 font-body">Gestão Inteligente de Compras e Obras</div>
        </div>
        <div className="flex flex-col gap-[3vh]">
          <div className="text-[4.5vw] font-bold text-white leading-tight tracking-tight" style={{ textWrap: "balance" }}>
            A Vena é o sistema de registro para compras e obras da empresa.
          </div>
          <div className="flex flex-col gap-[1.8vh]">
            <div className="flex items-start gap-[1.5vw]">
              <div className="w-[0.4vw] min-h-[2.5vh] bg-accent/70 shrink-0 mt-[0.5vh]" />
              <div className="text-[2.8vw] text-white/90 leading-snug">Todos os módulos operacionais estão ativos e com dados reais.</div>
            </div>
            <div className="flex items-start gap-[1.5vw]">
              <div className="w-[0.4vw] min-h-[2.5vh] bg-accent/70 shrink-0 mt-[0.5vh]" />
              <div className="text-[2.8vw] text-white/90 leading-snug">O ciclo completo — solicitação, cotação, aprovação, entrega e financeiro — está mapeado.</div>
            </div>
            <div className="flex items-start gap-[1.5vw]">
              <div className="w-[0.4vw] min-h-[2.5vh] bg-accent/70 shrink-0 mt-[0.5vh]" />
              <div className="text-[2.8vw] text-white/90 leading-snug">A plataforma está pronta para uso em produção.</div>
            </div>
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div className="text-[2.2vw] text-white/70 font-body">
            admin@vena.com.br
          </div>
          <div className="text-[1.9vw] text-white/40 font-body">
            15 / 15
          </div>
        </div>
      </div>
    </div>
  );
}
