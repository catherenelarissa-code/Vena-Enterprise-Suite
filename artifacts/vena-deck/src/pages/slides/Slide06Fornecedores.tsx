export default function Slide06Fornecedores() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body">
      <div className="absolute top-0 left-0 right-0 h-[0.8vh] bg-primary" />
      <div className="relative flex flex-col h-full px-[8vw] py-[7vh]">
        <div className="flex items-start gap-[1.5vw] mb-[4vh]">
          <div className="w-[0.5vw] h-[5vh] bg-accent mt-[0.3vh] shrink-0" />
          <div>
            <div className="text-[2.4vw] text-muted font-body uppercase tracking-widest mb-[0.8vh]">Módulo — Fornecedores</div>
            <div className="text-[3.4vw] font-bold text-text leading-snug" style={{ textWrap: "balance" }}>
              O cadastro de fornecedores inclui avaliação multicritério e histórico de preços.
            </div>
          </div>
        </div>
        <div className="w-full">
          <table className="w-full text-[2.4vw]" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr className="bg-primary text-white">
                <th className="text-left font-bold px-[1.5vw] py-[1.2vh]">Fornecedor</th>
                <th className="text-left font-bold px-[1.5vw] py-[1.2vh]">Categoria</th>
                <th className="text-right font-bold px-[1.5vw] py-[1.2vh]">Preço</th>
                <th className="text-right font-bold px-[1.5vw] py-[1.2vh]">Prazo</th>
                <th className="text-right font-bold px-[1.5vw] py-[1.2vh]">Qualidade</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-text/10 bg-bg">
                <td className="px-[1.5vw] py-[1.2vh] font-bold text-text">Distribuidora Elétrica SP</td>
                <td className="px-[1.5vw] py-[1.2vh] text-muted">Material Elétrico</td>
                <td className="px-[1.5vw] py-[1.2vh] text-right">4,3</td>
                <td className="px-[1.5vw] py-[1.2vh] text-right">3,8</td>
                <td className="px-[1.5vw] py-[1.2vh] text-right">4,3</td>
              </tr>
              <tr className="border-b border-text/10 bg-surface">
                <td className="px-[1.5vw] py-[1.2vh] font-bold text-text">Schneider Electric Brasil</td>
                <td className="px-[1.5vw] py-[1.2vh] text-muted">Equipamentos</td>
                <td className="px-[1.5vw] py-[1.2vh] text-right">3,5</td>
                <td className="px-[1.5vw] py-[1.2vh] text-right">4,5</td>
                <td className="px-[1.5vw] py-[1.2vh] text-right font-bold text-primary">5,0</td>
              </tr>
              <tr className="border-b border-text/10 bg-bg">
                <td className="px-[1.5vw] py-[1.2vh] font-bold text-text">Eletrodistribuidora Norte</td>
                <td className="px-[1.5vw] py-[1.2vh] text-muted">Material Elétrico</td>
                <td className="px-[1.5vw] py-[1.2vh] text-right font-bold text-primary">5,0</td>
                <td className="px-[1.5vw] py-[1.2vh] text-right">3,0</td>
                <td className="px-[1.5vw] py-[1.2vh] text-right">3,5</td>
              </tr>
              <tr className="border-b border-text/10 bg-surface">
                <td className="px-[1.5vw] py-[1.2vh] font-bold text-text">Eaton Brasil</td>
                <td className="px-[1.5vw] py-[1.2vh] text-muted">Equipamentos</td>
                <td className="px-[1.5vw] py-[1.2vh] text-right">4,0</td>
                <td className="px-[1.5vw] py-[1.2vh] text-right">4,5</td>
                <td className="px-[1.5vw] py-[1.2vh] text-right">4,5</td>
              </tr>
              <tr className="bg-bg">
                <td className="px-[1.5vw] py-[1.2vh] font-bold text-text">WEG Equipamentos</td>
                <td className="px-[1.5vw] py-[1.2vh] text-muted">Motores e Transformadores</td>
                <td className="px-[1.5vw] py-[1.2vh] text-right">3,5</td>
                <td className="px-[1.5vw] py-[1.2vh] text-right">4,0</td>
                <td className="px-[1.5vw] py-[1.2vh] text-right font-bold text-primary">5,0</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-[2.5vh] text-[2.2vw] text-muted">
            Avaliação: escala de 1,0 a 5,0 por critério · Fonte: avaliações internas registradas na plataforma
          </div>
        </div>
        <div className="absolute bottom-[3vh] right-[8vw] text-[2.2vw] text-muted">6 / 15</div>
      </div>
    </div>
  );
}
