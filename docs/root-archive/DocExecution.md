# Documentação de Execução — Correções de Sessão (out/2026)

Este documento registra, de forma estruturada e com fundamentação
científica, as correções aplicadas nos commits mais recentes do branch
`master` do projeto *Conta Comigo*. Cada seção cobre: o problema relatado,
a causa raiz identificada, a correção aplicada (com referência aos
arquivos/commits) e a base teórica/científica que sustenta a decisão de
design, quando aplicável.

Commits cobertos (do mais antigo para o mais recente):

| Commit    | Resumo |
|-----------|--------|
| `a649e20` | Dashboard do educador não exibia dados do aluno (token expirado) |
| `809ddef` | Cliente HTTP não usava o refresh token; sessão "morria" silenciosamente |
| `9ceedbd` | Vazamento de sessão de atendimento profissional entre contas de alunos diferentes |
| `fe13390` | Motor de recomendação repetindo exercícios dentro do mesmo ciclo |

---

## 1. Dashboard do educador sem dados dos alunos ("Alunos (0)")

### Problema relatado
O usuário reportou que a tela do profissional/educador parava de mostrar as
informações dos alunos ("não está indo back com a informação profissional/
aluno"), exibindo a lista como vazia mesmo com alunos cadastrados.

### Causa raiz
O token de acesso (JWT) tem expiração de 1 hora em produção
(`JWT_EXPIRES_IN=1h`, ver `.env.example`), e o token de refresh dura 7 dias
(`JWT_REFRESH_EXPIRES_IN=7d`). O serviço `authService.refresh()` já existia
em `frontend/src/lib/auth.ts`, mas **nunca era chamado** por nenhum outro
módulo do frontend. Quando o access token expirava, toda requisição
autenticada retornava `401 Unauthorized`, e esse erro era silenciosamente
engolido por um `.catch(console.error)` no carregamento do dashboard,
deixando a lista de alunos vazia sem qualquer mensagem de erro visível ao
usuário.

### Correção aplicada
- `frontend/src/lib/api-client.tsx`: adicionada lógica transparente de
  renovação de token. Ao receber `401`, o cliente chama
  `refreshAccessToken()` e repete a requisição original uma única vez
  (`_isRetry` flag evita loop infinito) antes de desistir.
- `frontend/src/app/[locale]/dashboard/educator/page.tsx` e
  `frontend/src/app/[locale]/dashboard/page.tsx` (commit `a649e20`):
  corrigido redirecionamento incorreto que, em certos fluxos de login,
  levava a telas de criança (`child`) quando o usuário autenticado era
  profissional, e vice-versa.

### Fundamentação
Esta é uma correção de engenharia de software (gestão de ciclo de vida de
token OAuth2/JWT) e não depende de literatura de educação especial, mas
segue a prática padrão de *silent token refresh* descrita na RFC 6749
(OAuth 2.0 Authorization Framework, seção 6 — "Refreshing an Access
Token") — o padrão correto é renovar o token de forma transparente ao
usuário, sem exigir novo login, e apenas forçar reautenticação quando o
refresh também falhar.

---

## 2. Falha de segurança: vazamento de sessão de atendimento entre alunos

### Problema relatado
> "eu entrei na sessão de outra criança, pelo login mesmo, e apareceu o
> ícone da tela da profissional que no caso seria o exercício que a Olivia
> tá fazendo também. isso é uma falha de segurança gravíssima."

Ao fazer login direto com as credenciais de uma criança, o app mostrava a
barra de "Atendimento em andamento · Olivia" (nome de outra criança, de
outra sessão), incluindo o botão "Encerrar atendimento" — ou seja, uma
criança conseguia ver e potencialmente interagir com o controle de sessão
de atendimento de **outra** criança.

### Causa raiz
O recurso "Iniciar atendimento" permite que um profissional entre
temporariamente na sessão de uma criança sem usar a senha dela. Para isso,
o token/usuário do profissional é guardado em chaves separadas do
`localStorage` (`professional_access_token`, `professional_refresh_token`,
`professional_user`), e o token ativo é trocado para o da criança.

A função `isAttendingAsChild()` em `frontend/src/lib/attendance.ts`
verificava **apenas a existência** da chave
`professional_access_token` no `localStorage`, sem validar a qual aluno
(learner) aquele atendimento pertencia. Se um atendimento fosse abandonado
sem clicar em "Encerrar atendimento" (ex.: aba fechada, navegador
reiniciado), o estado "stale" (obsoleto) permanecia no `localStorage` do
navegador e vazava para **qualquer login subsequente** feito naquele
mesmo navegador — inclusive o login direto de uma criança completamente
não relacionada.

Esse é um caso clássico de **falha de isolamento de sessão** (broken
session management), categoria **A07:2021 — Identification and
Authentication Failures** do OWASP Top 10, e também se enquadra em
**CWE-613 (Insufficient Session Expiration)**.

### Correção aplicada (`frontend/src/lib/attendance.ts`,
`frontend/src/hooks/use-auth.ts`,
`frontend/src/components/educator/professional-attendance-bar.tsx` —
commit `9ceedbd`):
- Nova chave `ATTENDANCE_LEARNER_ID_KEY`: o ID do aluno atendido passa a
  ser persistido junto do estado de atendimento.
- `isAttendingAsChild()` agora valida que o `learnerId` armazenado é
  **igual** ao ID do usuário atualmente autenticado (via `useAuthStore`).
  Caso não bata, o estado é autolimpo (`clearAttendanceState()`) — ou
  seja, o próprio sistema detecta e corrige o estado inconsistente.
- `login`, `register` e `logout` (`use-auth.ts`) agora chamam
  `clearAttendanceState()` como defesa em profundidade (*defense in
  depth*), garantindo que nenhum estado de atendimento sobreviva a uma
  troca de identidade, mesmo que a validação acima falhe por algum motivo.
- O banner de atendimento (`professional-attendance-bar.tsx`) passou a
  reavaliar sua visibilidade reativamente a cada mudança do usuário
  autenticado, não apenas na montagem do componente.

### Fundamentação
A exigência de **vincular todo estado de sessão privilegiado a uma
identidade verificada, revalidada a cada uso** (e não apenas checar
"existe um token") é um princípio central dos guias de autenticação e
gestão de sessão do OWASP (*OWASP Session Management Cheat Sheet*) e do
NIST SP 800-63B (*Digital Identity Guidelines — Authentication and
Lifecycle Management*), que recomendam invalidar/revalidar sessões no
login, logout e troca de contexto de privilégio. A defesa em profundidade
(múltiplas camadas de limpeza de estado, não apenas uma) segue o princípio
de *defense in depth* descrito desde Saltzer & Schroeder (1975),
*"The Protection of Information in Computer Systems"* — ainda hoje a
referência seminal em princípios de design de sistemas seguros.

Dado que os usuários desta plataforma são **crianças autistas**, o risco
de confusão/ansiedade causado por uma criança ver, sem explicação,
elementos de interface pertencentes a outra sessão é agravado pelas
dificuldades de *theory of mind* e previsibilidade de ambiente
frequentemente associadas ao espectro autista (American Psychiatric
Association, DSM-5-TR, critérios diagnósticos de TEA) — reforçando que
esta não é apenas uma falha técnica, mas também uma falha de
acessibilidade/previsibilidade de interface.

---

## 3. Motor de recomendação repetindo exercícios dentro do mesmo ciclo

### Problema relatado
O usuário colou logs de `[sequence:submit]` mostrando o motor de
recomendação alternando (*ping-pong*) entre dois exercícios de
`composition_decomposition` ("Decomponha o número 7" e
"composition_8_bars") dentro de um único ciclo de 10 exercícios, e
perguntou por que isso acontecia.

Em seguida, formalizou um requisito novo:

> "se um exercício já foi feito por um aluno eu não quero que ele seja
> repetido NUNCA mais em um outro ciclo, a não ser que seja em outro
> formato de exercício (...) o exercício que já foi feito só pode aparecer
> no exercício de revisão."

E refinou:

> "só se errou. eu quero que se errar, possa sugerir o mesmo exercício de
> novo só que de uma maneira mais fácil (...) por um método que ele tenha
> mais strength, como visual."

Com a condição de fallback:

> "tudo bem se, no caso de não ter variante visual da mesma estrutura, ele
> pular pra outra atividade qualquer da mesma bnccSkill."

### 3.1 Causa raiz do *ping-pong*
`HybridRecommendationService.rank()`
(`backend/src/modules/ade/hybrid-recommendation.service.ts`) implementa um
filtro de diversidade (*anti-repetition / novelty filter*) que bloqueia
candidatos cujo `content.semantic.structureId` apareceu recentemente na
janela de bloqueio (`blockWindow`). Porém, qualquer atividade **sem**
`structureId` é explicitamente isenta desse filtro
(`if (!structureId) return true`).

A atividade "Decomponha o número 7" existe no banco desde antes do campo
`content.semantic.structureId` ter sido introduzido no *seed*
(`backend/src/database/seeds/activities.seed.ts`). A lógica de *upsert* do
seed casa registros já existentes por `structureId` OU por `title`; porém
o caminho de casamento por `title` só sincroniza campos estreitos
(`bnccSkills`, falas autorais, `targetYear`) e **nunca** sincronizava
`content.semantic` — então esse registro ficava com `structureId: null`
permanentemente, tornando-se imune ao filtro de diversidade e
"martelando" sempre que sorteado, alternando com o único outro exercício
de `composition_decomposition` disponível.

**Correção** (`backend/src/database/seeds/activities.seed.ts`, commit
`fe13390`): adicionado backfill aditivo (nunca sobrescreve conteúdo
autoral existente) de `content.semantic` no branch de casamento por
título, no mesmo padrão já usado para `targetYear`. Como o `db:seed` roda
incondicionalmente em todo `npm start` (`start": "npm run db:migrate &&
npm run db:seed && node dist/main.js`), nenhuma migration de schema é
necessária — não há coluna/tabela nova, apenas dado dentro de uma coluna
`jsonb` já existente sendo preenchido retroativamente.

### 3.2 "Nunca repetir exercício corretamente completado, exceto na
revisão espaçada"

**Implementação** (`backend/src/modules/activities/activities.service.ts`,
commit `fe13390`):
- Novo método `getEverCorrectlyCompletedActivityIds(userId)`: consulta
  **todo o histórico** de tentativas (`ActivityAttempt`) do aluno,
  filtrando `isCorrect = true`, sem limite de janela temporal (diferente
  de `getRecentAttempts`, que é limitado a 20-50 registros recentes e não
  seria suficiente para uma regra "nunca mais").
- Esse conjunto de IDs é excluído do pool de candidatos tanto em
  `findMatchingActivity()` (caminho principal) quanto em
  `selectFallbackActivity()` (caminho de contingência), com uma válvula
  de segurança: se a exclusão esvaziar todo o pool de candidatos (ex.:
  criança já dominou todas as atividades daquela habilidade), o filtro é
  relaxado para não travar a seleção de atividade.
- Confirmado que o fluxo de revisão espaçada
  (`ReviewOrchestrationService.getNextReviewActivity()`) é consultado e
  retorna **antes** dessa lógica ser alcançada no fluxo de
  `recommendNextActivity`, portanto a revisão continua podendo
  resurfacing exercícios já dominados — exatamente como o requisito pede.

#### Fundamentação científica
A combinação "nunca repita o que já foi dominado, exceto em revisão
espaçada programada" corresponde diretamente a dois pilares bem
estabelecidos da ciência da aprendizagem:

1. **Mastery Learning** (Bloom, B. S., 1968, *"Learning for Mastery"*,
   Evaluation Comment, UCLA-CSEIP) — uma vez que o aprendiz demonstra
   domínio de um objetivo de aprendizagem, o sistema deve avançar para
   novos objetivos em vez de repetir o que já foi dominado, sob pena de
   gerar tédio e desengajamento.
2. **Repetição espaçada / curva de esquecimento** (Ebbinghaus, H., 1885,
   *"Über das Gedächtnis"* — a base histórica do conceito de curva de
   esquecimento) e sua aplicação prática em algoritmos de repetição
   espaçada (ex.: SM-2/Anki — Wozniak & Gorzelanczyk, 1994,
   *"Optimization of repetition spacing in the practice of learning"*).
   O item já dominado não deve ser testado novamente de forma aleatória,
   mas sim reapresentado em intervalos crescentes e controlados — que é
   exatamente o papel do `ReviewOrchestrationService` já existente no
   projeto (`retentionHalfLifeDays`, ver
   `review-candidate-generation.service.ts`), que já implementa esse
   conceito de "meia-vida de retenção" alinhado à curva de esquecimento.

Este desenho já estava parcialmente presente no projeto (a arquitetura de
revisão já existia); a mudança desta sessão foi fechar a lacuna que
permitia que a seleção *do dia a dia* (fora da revisão) também
resurfaçasse itens já dominados, o que contradizia a própria premissa de
mastery learning que o sistema de revisão pressupõe.

### 3.3 "Se errar, oferecer de novo, mas mais fácil e alinhado ao
ponto forte"

**Implementação**
(`applyRetryModalityPreference()` em `activities.service.ts`, commit
`fe13390`):
- Diferente do caso de acerto, uma atividade respondida **incorretamente**
  **não** é adicionada a nenhuma lista de exclusão — ela continua
  elegível para nova seleção (já existia um mecanismo de *cooldown* de
  curto prazo para não repetir a atividade exata nas 2-8 tentativas
  seguintes, preservado sem alteração).
- Quando a tentativa mais recente na habilidade (BNCC skill) alvo foi
  incorreta, o pool de candidatos é filtrado para priorizar atividades
  com a **mesma `structureId`** (mesma estrutura semântica/conceitual do
  exercício errado) cujo `targetModalities` contenha pelo menos uma
  modalidade declarada como ponto forte (`profile.strengths`) da criança
  (visual, auditivo, motor, lógico ou sensorial).
- Caso não exista nenhuma variante da mesma estrutura alinhada ao ponto
  forte, o filtro é relaxado e qualquer atividade da mesma `bnccSkill`
  permanece elegível — exatamente a condição de fallback confirmada pelo
  usuário.
- A redução de dificuldade ("mais fácil") **não** precisou de lógica
  nova: a regra `D2` já existente em
  `backend/src/modules/ade/rules/rule-engine.service.ts` já reduz
  automaticamente o nível de dificuldade após 2+ tentativas de
  dificuldade na mesma habilidade (erro, uso excessivo de dicas ou tempo
  de resposta muito longo).

#### Fundamentação científica
1. **Zona de Desenvolvimento Proximal / Scaffolding** (Vygotsky, L. S.,
   1978, *Mind in Society*; e Wood, D., Bruner, J. S., & Ross, G., 1976,
   *"The role of tutoring in problem solving"*, Journal of Child
   Psychology and Psychiatry) — após um erro, o suporte adequado é
   reduzir a complexidade/aumentar o andaime (*scaffold*) para a criança
   conseguir reconstruir o conceito dentro da sua zona de desenvolvimento
   proximal, em vez de simplesmente repetir a mesma tarefa na mesma
   dificuldade. Esse princípio **já é citado explicitamente no código**
   (`hybrid-recommendation.service.ts`, linha ~474:
   `[LITERATURA] Vygotsky ZPD - match activity modality to student
   strengths`), então a nova lógica de retry é uma extensão consistente de
   uma decisão de design já adotada no projeto.
2. **Ensino multimodal alinhado a pontos fortes e Universal Design for
   Learning (UDL)** — o framework UDL do CAST (Center for Applied Special
   Technology; ver *CAST UDL Guidelines*, https://udlguidelines.cast.org/)
   recomenda explicitamente oferecer **múltiplos meios de representação**
   do mesmo conteúdo, escolhendo a modalidade mais acessível para cada
   aprendiz, em vez de repetir a mesma representação que já falhou.
3. **Suporte visual para autismo (TEACCH)** — Mesibov, G. B., Shea, V., &
   Schopler, E. (2004), *The TEACCH Approach to Autism Spectrum Disorders*
   (Springer), documenta extensivamente a eficácia de suportes visuais
   estruturados para aprendizes autistas, o que justifica cientificamente
   por que "visual" é citado como exemplo recorrente de modalidade de
   força neste projeto (tanto no requisito do usuário quanto no código já
   existente).
4. A **analogia com teste adaptativo computadorizado (CAT)** —
   itens errados levam a um ajuste de dificuldade/formato na próxima
   apresentação, não a repetição idêntica — é um princípio estabelecido em
   psicometria de testes adaptativos (Lord, F. M., 1980, *Applications of
   Item Response Theory to Practical Testing Problems*), reforçando a
   abordagem de "mesma estrutura, dificuldade/modalidade ajustada" em vez
   de repetição exata.

### 3.4 Verificação
- `npx tsc --noEmit` limpo em ambos os arquivos alterados.
- Suítes de teste relevantes executadas e **100% passando** (37 testes):
  `activities.service.spec.ts`,
  `hybrid-recommendation.service.spec.ts`,
  `ade/__tests__/repetition-prevention.spec.ts`,
  `ade/__tests__/progression-and-diversity.spec.ts`.
- Nenhuma migration de schema foi necessária: a mudança é inteiramente de
  dados (`jsonb` já existente) e de lógica de aplicação; o seed já roda
  automaticamente em todo deploy (`npm start`).

---

## 4. Lacunas conhecidas / trabalho não concluído nesta sessão

Para transparência e continuidade:

- **Reescrita de autoria de commits** para `ricmartinsrocha@gmail.com`:
  solicitada pelo usuário, mas o escopo (quantos/quais commits) ainda não
  foi confirmado antes desta sessão ser retomada para as correções acima.
  Operação de histórico destrutiva (`git rebase`/`filter-branch` +
  `push --force`) — requer confirmação explícita de escopo antes de
  execução.
- **Recálculo retroativo de recomendações já geradas** antes desta
  correção: os registros de `ActivityAttempt` e `LearningEvent` já
  persistidos não foram reprocessados. A correção vale a partir de agora
  para novas sessões; não há reprocessamento de decisões antigas do motor
  de recomendação (não solicitado explicitamente, mas registrado aqui como
  lacuna potencial caso seja necessário auditar decisões passadas).
