feat(proposals): add apps/web Vite app and Proposals automation UI

Resumo
- Adiciona um app frontend Vite + React + TypeScript em apps/web com UI inicial para Automação → Propostas (editor de templates, gerador de propostas).
- Integrações com APIs do backend via customFetch exportado do pacote @workspace/api-client-react.
- Scaffolding, serviços, hooks e componentes básicos implementados para permitir criação e geração de propostas fotovoltaicas.

Principais mudanças
- Novo app: apps/web (Vite + React + TypeScript)
  - arquivos: package.json, vite.config.ts, tsconfig.json, src/main.tsx, src/App.tsx, styles.css
- Novos componentes e páginas:
  - apps/web/src/pages/Automation/Proposals.tsx
  - apps/web/src/components/ProposalTemplateEditor.tsx
  - apps/web/src/components/ProposalGenerator.tsx
  - apps/web/src/components/FileUploader.tsx
- Serviços / hooks:
  - apps/web/src/services/proposals.ts (centraliza chamadas: listTemplates, createTemplate, uploadFile, generatePdf, saveClientFile)
  - apps/web/src/hooks/useTemplates.ts (react-query helpers)
- Monorepo / client:
  - pnpm-workspace.yaml — adicionado apps/* ao workspace
  - lib/api-client-react/src/index.ts — exporta customFetch e tipos para facilitar uso no frontend
- Tipos/config:
  - apps/web/tsconfig.json — adição de lib DOM e types vite/client (evita erros TS com Blob/DOM/JSX)

Fluxos implementados / como funciona
- Criar template: POST /api/automation/proposals/templates (via ProposalTemplateEditor)
- Listar templates: GET /api/automation/proposals/templates
- Fazer upload de imagens (logo/banner): POST /api/uploads → espera { url } ou { path } (via FileUploader)
- Gerar PDF: POST /api/automation/proposals/generate-pdf com { templateId, clientId, attachments } → retorna PDF (blob)
- Download automático do PDF no navegador + salvar PDF na área do cliente: POST /api/clients/{id}/files (multipart)

Arquivos principais modificados/ adicionados
- pnpm-workspace.yaml (inclui apps/*)
- apps/web/package.json
- apps/web/vite.config.ts
- apps/web/tsconfig.json
- apps/web/src/main.tsx
- apps/web/src/App.tsx
- apps/web/src/pages/Automation/Proposals.tsx
- apps/web/src/styles.css
- apps/web/src/components/ProposalTemplateEditor.tsx
- apps/web/src/components/ProposalGenerator.tsx
- apps/web/src/components/FileUploader.tsx
- apps/web/src/services/proposals.ts
- apps/web/src/hooks/useTemplates.ts
- lib/api-client-react/src/index.ts

Testes manuais recomendados (como validar localmente)
1. No root do repositório:
   - pnpm install
   - pnpm -w recursive install
2. (Opcional) build/checagem do monorepo:
   - pnpm -w -r build
   - ou pnpm -w -r tsc --build
3. Para rodar o frontend:
   - cd apps/web
   - pnpm install
   - pnpm dev
4. Acesse o app (ex.: http://localhost:5173) e navegue para Automação → Propostas.  
   Teste:
   - Criar um template (nome + conteúdo com placeholders)
   - Selecionar um cliente (GET /api/clients deve estar disponível)
   - Fazer upload de imagem/logo (ver retorno URL)
   - Gerar o PDF — verificar download automático e que o PDF foi enviado para /api/clients/{id}/files

Suposições feitas (confirme por favor)
- Endpoints e contratos que presumi:
  - GET/POST /api/automation/proposals/templates
  - POST /api/automation/proposals/generate-pdf → retorna blob PDF
  - POST /api/uploads → retorna { url } ou { path }
  - GET /api/clients e GET /api/clients/{id}
  - POST /api/clients/{id}/files → aceita multipart/form-data
- A substituição de placeholders (mail merge) é feita pelo backend ao receber templateId + clientId. Se for necessário fazer a substituição no frontend, implemento o renderer.

Pendências / recomendações após merge
- Substituir chamadas manuais por funções geradas pelo client OpenAPI (quando/ se existirem) para garantir tipagem e contrato.
- Adicionar testes end-to-end para o fluxo de geração e upload do PDF.
- Melhorar UX: previews de template, edição/remoção de templates, placeholders preview e validação de campos.
- Validar as rotas do backend e ajustar caminhos/payloads caso existam diferenças.

Checklist de merge
- [ ] Backend confirma/compatibiliza endpoints listados
- [ ] CI: rodar build/TS no monorepo (pnpm -w -r build)
- [ ] Testes manuais realizados e aprovados

Observação final
- A branch feature/proposals-integration já contém os commits e o código descrito. Se concordar com o texto acima, cole-o no PR #3 como descrição do PR.
- Posso também atualizar o PR por você se autorizar explicitamente a operação do PR via API (me diga se quer que eu tente abrir/editar o PR diretamente).

Link do PR
https://github.com/catherenelarissa-code/Vena-Enterprise-Suite/pull/3
