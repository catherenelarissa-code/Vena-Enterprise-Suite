export default function Slide08Obras() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body">
      <div className="absolute top-0 left-0 right-0 h-[0.8vh] bg-primary" />
      <div className="relative flex flex-col h-full px-[8vw] py-[7vh]">
        <div className="flex items-start gap-[1.5vw] mb-[4vh]">
          <div className="w-[0.5vw] h-[5vh] bg-accent mt-[0.3vh] shrink-0" />
          <div>
            <div className="text-[2.4vw] text-muted font-body uppercase tracking-widest mb-[0.8vh]">Módulo — Obras</div>
            <div className="text-[3.4vw] font-bold text-text leading-snug" style={{ textWrap: "balance" }}>
              Cinco projetos são gerenciados com controle de orçamento em tempo real.
            </div>
          </div>
        </div>
        <div className="w-full">
          <table className="w-full text-[2.4vw]" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr className="bg-primary text-white">
                <th className="text-left font-bold px-[1.5vw] py-[1.2vh]">Projeto</th>
                <th className="text-left font-bold px-[1.5vw] py-[1.2vh]">Local</th>
                <th className="text-right font-bold px-[1.5vw] py-[1.2vh]">Orçamento</th>
                <th className="text-left font-bold px-[1.5vw] py-[1.2vh]">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-text/10 bg-bg">
                <td className="px-[1.5vw] py-[1.2vh] font-bold text-text">Subestação Industrial Norte</td>
                <td className="px-[1.5vw] py-[1.2vh] text-muted">Manaus/AM</td>
                <td className="px-[1.5vw] py-[1.2vh] text-right font-bold">R$ 485.000</td>
                <td className="px-[1.5vw] py-[1.2vh]"><span className="text-primary font-bold">Em execução</span></td>
              </tr>
              <tr className="border-b border-text/10 bg-surface">
                <td className="px-[1.5vw] py-[1.2vh] font-bold text-text">Sistema Solar Fotovoltaico 150kWp</td>
                <td className="px-[1.5vw] py-[1.2vh] text-muted">Ribeirão Preto/SP</td>
                <td className="px-[1.5vw] py-[1.2vh] text-right font-bold">R$ 680.000</td>
                <td className="px-[1.5vw] py-[1.2vh]"><span className="text-primary font-bold">Em execução</span></td>
              </tr>
              <tr className="border-b border-text/10 bg-bg">
                <td className="px-[1.5vw] py-[1.2vh] font-bold text-text">Rede Elétrica Condomínio Parque Real</td>
                <td className="px-[1.5vw] py-[1.2vh] text-muted">São Paulo/SP</td>
                <td className="px-[1.5vw] py-[1.2vh] text-right font-bold">R$ 320.000</td>
                <td className="px-[1.5vw] py-[1.2vh]"><span className="text-primary font-bold">Em execução</span></td>
              </tr>
              <tr className="border-b border-text/10 bg-surface">
                <td className="px-[1.5vw] py-[1.2vh] font-bold text-text">Reforma Galpão Logístico</td>
                <td className="px-[1.5vw] py-[1.2vh] text-muted">Campinas/SP</td>
                <td className="px-[1.5vw] py-[1.2vh] text-right font-bold">R$ 95.000</td>
                <td className="px-[1.5vw] py-[1.2vh]"><span className="text-muted">Concluída</span></td>
              </tr>
              <tr className="bg-bg">
                <td className="px-[1.5vw] py-[1.2vh] font-bold text-text">SPDA Torre Telecomunicações</td>
                <td className="px-[1.5vw] py-[1.2vh] text-muted">Belém/PA</td>
                <td className="px-[1.5vw] py-[1.2vh] text-right font-bold">R$ 48.000</td>
                <td className="px-[1.5vw] py-[1.2vh]"><span className="text-muted">Planejamento</span></td>
              </tr>
            </tbody>
          </table>
          <div className="mt-[2.5vh] flex justify-between items-baseline">
            <div className="text-[2.2vw] text-muted">Fonte: dados operacionais da plataforma, junho 2026</div>
            <div className="text-[2.8vw] font-bold text-primary">Total: R$ 1.628.000</div>
          </div>
        </div>
        <div className="absolute bottom-[3vh] right-[8vw] text-[2.2vw] text-muted">8 / 15</div>
      </div>
    </div>
  );
}
