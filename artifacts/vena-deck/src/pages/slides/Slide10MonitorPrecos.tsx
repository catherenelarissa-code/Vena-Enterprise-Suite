export default function Slide10MonitorPrecos() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body">
      <div className="absolute top-0 left-0 right-0 h-[0.8vh] bg-primary" />
      <div className="relative flex flex-col h-full px-[8vw] py-[7vh]">
        <div className="flex items-start gap-[1.5vw] mb-[4vh]">
          <div className="w-[0.5vw] h-[5vh] bg-accent mt-[0.3vh] shrink-0" />
          <div>
            <div className="text-[2.4vw] text-muted font-body uppercase tracking-widest mb-[0.8vh]">Módulo — Monitor de Preços</div>
            <div className="text-[3.4vw] font-bold text-text leading-snug" style={{ textWrap: "balance" }}>
              O Monitor com IA recomenda o melhor momento de compra para 4 produtos rastreados.
            </div>
          </div>
        </div>
        <div className="w-full">
          <table className="w-full text-[2.4vw]" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr className="bg-primary text-white">
                <th className="text-left font-bold px-[1.5vw] py-[1.2vh]">Produto</th>
                <th className="text-right font-bold px-[1.5vw] py-[1.2vh]">Preço Atual</th>
                <th className="text-left font-bold px-[1.5vw] py-[1.2vh]">Recomendação IA</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-text/10 bg-bg">
                <td className="px-[1.5vw] py-[1.4vh] font-bold text-text">Cabo Flexível 16mm² (rolo 100m)</td>
                <td className="px-[1.5vw] py-[1.4vh] text-right">R$ 1.280</td>
                <td className="px-[1.5vw] py-[1.4vh] text-muted">Aguardar: queda na 1ª quinzena — economia potencial de até 8%</td>
              </tr>
              <tr className="border-b border-text/10 bg-surface">
                <td className="px-[1.5vw] py-[1.4vh] font-bold text-text">Disjuntor Schneider 32A</td>
                <td className="px-[1.5vw] py-[1.4vh] text-right">R$ 82,00</td>
                <td className="px-[1.5vw] py-[1.4vh] font-bold text-primary">Comprar agora: queda de 7,9% em 60 dias; fornecedor B 8% mais barato</td>
              </tr>
              <tr className="border-b border-text/10 bg-bg">
                <td className="px-[1.5vw] py-[1.4vh] font-bold text-text">Inversor Fronius 10kW</td>
                <td className="px-[1.5vw] py-[1.4vh] text-right">R$ 4.720</td>
                <td className="px-[1.5vw] py-[1.4vh] font-bold text-primary">Comprar agora: menor preço em 6 meses; alta prevista no Q3</td>
              </tr>
              <tr className="bg-surface">
                <td className="px-[1.5vw] py-[1.4vh] font-bold text-text">Eletrocalha 100x50mm</td>
                <td className="px-[1.5vw] py-[1.4vh] text-right">R$ 41,50</td>
                <td className="px-[1.5vw] py-[1.4vh] text-muted">Estável há 45 dias: avaliar prazo de entrega entre fornecedores (dif. 3,5%)</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-[2.5vh] text-[2.2vw] text-muted">
            Histórico de preços registrado por fornecedor com data · Fonte: dados operacionais da plataforma, junho 2026
          </div>
        </div>
        <div className="absolute bottom-[3vh] right-[8vw] text-[2.2vw] text-muted">10 / 15</div>
      </div>
    </div>
  );
}
