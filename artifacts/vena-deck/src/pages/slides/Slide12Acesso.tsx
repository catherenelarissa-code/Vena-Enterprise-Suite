export default function Slide12Acesso() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg font-body">
      <div className="absolute top-0 left-0 right-0 h-[0.8vh] bg-primary" />
      <div className="relative flex flex-col h-full px-[8vw] py-[7vh]">
        <div className="flex items-start gap-[1.5vw] mb-[5vh]">
          <div className="w-[0.5vw] h-[5vh] bg-accent mt-[0.3vh] shrink-0" />
          <div>
            <div className="text-[2.4vw] text-muted font-body uppercase tracking-widest mb-[0.8vh]">Segurança e Acesso</div>
            <div className="text-[3.4vw] font-bold text-text leading-snug" style={{ textWrap: "balance" }}>
              O acesso ao sistema é controlado por aprovação administrativa individual.
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-[6vw]">
          <div className="flex flex-col gap-[2.5vh]">
            <div className="flex items-start gap-[1.5vw]">
              <div className="w-[0.4vw] min-h-[3.5vh] bg-primary shrink-0 mt-[0.5vh]" />
              <div className="text-[2.8vw] text-text leading-snug">Não há auto-cadastro: todo acesso requer solicitação e aprovação do administrador.</div>
            </div>
            <div className="flex items-start gap-[1.5vw]">
              <div className="w-[0.4vw] min-h-[3.5vh] bg-primary shrink-0 mt-[0.5vh]" />
              <div className="text-[2.8vw] text-text leading-snug">Autenticação via sessão segura com cookie HttpOnly e expiração de 7 dias.</div>
            </div>
            <div className="flex items-start gap-[1.5vw]">
              <div className="w-[0.4vw] min-h-[3.5vh] bg-primary shrink-0 mt-[0.5vh]" />
              <div className="text-[2.8vw] text-text leading-snug">Senha com hash SHA-256 + salt dedicado; sem armazenamento em texto plano.</div>
            </div>
          </div>
          <div className="flex flex-col gap-[2vh]">
            <div className="text-[2.4vw] font-bold text-primary uppercase tracking-wide mb-[1vh]">Perfis de Acesso</div>
            <div className="flex flex-col gap-[1.5vh]">
              <div className="flex items-center justify-between border-b border-text/10 pb-[1.5vh]">
                <div className="text-[2.6vw] font-bold text-text">Admin</div>
                <div className="text-[2.4vw] text-muted">Acesso completo e gestão de usuários</div>
              </div>
              <div className="flex items-center justify-between border-b border-text/10 pb-[1.5vh]">
                <div className="text-[2.6vw] font-bold text-text">Gerente</div>
                <div className="text-[2.4vw] text-muted">Aprovações e relatórios</div>
              </div>
              <div className="flex items-center justify-between border-b border-text/10 pb-[1.5vh]">
                <div className="text-[2.6vw] font-bold text-text">Engenheiro</div>
                <div className="text-[2.4vw] text-muted">Obras, compras e materiais</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-[2.6vw] font-bold text-text">Encarregado</div>
                <div className="text-[2.4vw] text-muted">Consulta e solicitações</div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-[3vh] right-[8vw] text-[2.2vw] text-muted">12 / 15</div>
      </div>
    </div>
  );
}
