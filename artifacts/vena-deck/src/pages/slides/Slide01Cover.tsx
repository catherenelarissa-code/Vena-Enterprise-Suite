export default function Slide01Cover() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-primary font-body">
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0B7A57 0%, #085c42 100%)" }} />
      <div className="absolute top-0 left-0 right-0 h-[0.5vh] bg-accent" />
      <div className="relative flex flex-col justify-between h-full px-[8vw] py-[8vh]">
        <div className="flex items-center gap-[1.5vw]">
          <div className="text-[3.5vw] font-bold text-white tracking-tight">VENA</div>
          <div className="w-[0.4vw] h-[3.5vw] bg-accent" />
          <div className="text-[1.8vw] text-white/70 font-body">Gestão Inteligente de Compras e Obras</div>
        </div>
        <div>
          <div className="text-[5.5vw] font-bold text-white leading-tight tracking-tight" style={{ textWrap: "balance" }}>
            Plataforma de Gestão de
          </div>
          <div className="text-[5.5vw] font-bold leading-tight tracking-tight" style={{ color: "#FF8A00", textWrap: "balance" }}>
            Compras e Obras
          </div>
          <div className="mt-[3vh] text-[2.2vw] text-white/80 font-body">
            Engenharia Elétrica
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div className="text-[1.9vw] text-white/60 font-body">
            Uso Interno Confidencial · Junho 2026
          </div>
          <div className="text-[1.9vw] text-white/40 font-body">
            1 / 15
          </div>
        </div>
      </div>
    </div>
  );
}
