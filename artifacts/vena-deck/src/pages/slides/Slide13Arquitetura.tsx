export default function Slide13Arquitetura() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body">
      <div className="absolute top-0 left-0 right-0 h-[0.8vh] bg-primary" />
      <div className="relative flex flex-col h-full px-[8vw] py-[7vh]">
        <div className="flex items-start gap-[1.5vw] mb-[4.5vh]">
          <div className="w-[0.5vw] h-[5vh] bg-accent mt-[0.3vh] shrink-0" />
          <div>
            <div className="text-[2.4vw] text-muted font-body uppercase tracking-widest mb-[0.8vh]">Arquitetura Técnica</div>
            <div className="text-[3.4vw] font-bold text-text leading-snug" style={{ textWrap: "balance" }}>
              A arquitetura é construída sobre tecnologias de mercado consolidadas.
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-[2vw]">
          <div className="bg-surface rounded-[0.5vw] px-[2vw] py-[2.5vh] flex flex-col gap-[1.8vh] border-t-[0.4vh] border-primary">
            <div className="text-[2.4vw] font-bold text-primary uppercase tracking-wide">Frontend</div>
            <div className="flex flex-col gap-[1.2vh]">
              <div className="text-[2.5vw] text-text">React + Vite + Tailwind CSS</div>
              <div className="text-[2.5vw] text-text">Hooks gerados por Orval a partir do contrato OpenAPI</div>
              <div className="text-[2.5vw] text-text">TypeScript com validação Zod no cliente</div>
            </div>
          </div>
          <div className="bg-surface rounded-[0.5vw] px-[2vw] py-[2.5vh] flex flex-col gap-[1.8vh] border-t-[0.4vh] border-primary">
            <div className="text-[2.4vw] font-bold text-primary uppercase tracking-wide">Backend</div>
            <div className="flex flex-col gap-[1.2vh]">
              <div className="text-[2.5vw] text-text">Express 5 com logging estruturado Pino</div>
              <div className="text-[2.5vw] text-text">express-session para autenticação por sessão</div>
              <div className="text-[2.5vw] text-text">Validação de contrato com Zod em todas as rotas</div>
            </div>
          </div>
          <div className="bg-surface rounded-[0.5vw] px-[2vw] py-[2.5vh] flex flex-col gap-[1.8vh] border-t-[0.4vh] border-primary">
            <div className="text-[2.4vw] font-bold text-primary uppercase tracking-wide">Dados e Infra</div>
            <div className="flex flex-col gap-[1.2vh]">
              <div className="text-[2.5vw] text-text">PostgreSQL com Drizzle ORM</div>
              <div className="text-[2.5vw] text-text">Schema versionado e migrações automatizadas</div>
              <div className="text-[2.5vw] text-text">Monorepo pnpm workspaces — API, cliente e DB isolados</div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-[3vh] right-[8vw] text-[2.2vw] text-muted">13 / 15</div>
      </div>
    </div>
  );
}
