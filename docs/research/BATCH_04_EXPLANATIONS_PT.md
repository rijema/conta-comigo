# Batch 04.3 — Explicações de recomendação por audiência

## 1. Objetivo

[PROPOSTA CONTA COMIGO] Uma única `AdeDecision`, já persistida pelo motor adaptativo, passa a originar quatro apresentações: criança, responsável, profissional e pesquisa/debug. A audiência altera somente a linguagem e a quantidade de detalhes; não altera a atividade escolhida nem executa novamente o ranqueamento.

## 2. Implementação preexistente

[DECISÃO DE ENGENHARIA] `AdeDecision` é a implementação existente equivalente à decisão de recomendação citada no requisito. Ela armazena habilidade BNCC, dificuldade, modalidade, tipo de atividade, instantâneo de entrada e `xaiLog`.

Antes deste batch, detalhes como `finalReason`, confiança, regras e inferências eram exibidos diretamente nos painéis e também escritos no console do fluxo infantil. Isso misturava explicação pedagógica e diagnóstico técnico.

## 3. Uma decisão, múltiplas explicações

[DECISÃO DE ENGENHARIA] `RecommendationExplanationService` é determinístico e não grava nem modifica decisões. Sua entrada é a decisão persistida e, quando disponíveis, resultado, estado agregado do estudante e traço semântico. Sua saída contém:

- `childExplanation`;
- `guardianExplanation`;
- `professionalExplanation`;
- `researchExplanation`.

[PROPOSTA CONTA COMIGO] A estimativa de domínio exibida ao profissional é a registrada no momento da decisão. BKT continua sendo a fonte de verdade do domínio; o explicador não atualiza nem recalcula esse estado.

## 4. Criança

[DECISÃO DE ENGENHARIA] A explicação é curta, positiva e não contém pontuações técnicas.

Exemplo: “Esta tem figuras para ajudar!”

## 5. Responsável

[DECISÃO DE ENGENHARIA] A explicação usa linguagem cotidiana, informa a habilidade trabalhada e a justificativa geral do formato. Não apresenta BKT, `semanticFit`, inferência ontológica, confiança ou score.

Exemplo: “O ContaComigo escolheu esta atividade para continuar desenvolvendo a habilidade EF01MA08 e porque o formato visual oferece apoio à compreensão.”

## 6. Profissional

[PROPOSTA CONTA COMIGO] A apresentação começa por uma síntese pedagógica e permite abrir “Ver detalhes”. São apresentados, quando registrados:

- habilidade BNCC;
- domínio estimado em percentual legível;
- necessidade atual de aprendizagem;
- evidência agregada de interação;
- considerações de apoio;
- histórico recente fornecido ao serviço;
- motivo da escolha ou mudança de formato.

Exemplo: “A atividade foi selecionada para continuar desenvolvendo a habilidade EF01MA08. A estimativa de domínio registrada é de 42%. O formato visual oferece apoio à compreensão.”

[HIPÓTESE A VALIDAR] A compreensão e utilidade da explicação profissional devem ser avaliadas com profissionais da educação; o texto atual é uma proposta de interface, não evidência de eficácia pedagógica.

## 7. Pesquisa e debug

[DECISÃO DE ENGENHARIA] Pesquisa/debug não é um novo tipo de usuário. É uma visualização técnica oculta (“easter egg”) no painel profissional, habilitada somente quando as três condições são verdadeiras:

1. `NEXT_PUBLIC_ENABLE_RESEARCH_DEBUG=true`;
2. a URL contém `?research=true`;
3. o usuário autenticado tem papel existente `professional` ou `admin`.

O parâmetro da URL isoladamente não habilita a tela. O endpoint técnico também usa autenticação e autorização por papel. Fluxos comuns de criança e responsável não renderizam o painel.

Exemplo técnico abreviado:

```text
Recommendation ID: 8a...
Target BNCC skill: EF01MA08
StudentSkillState / mastery: { masteryProbability: 0.42 }
Semantic inferences: [dados persistidos]
Challenge Fit: Not recorded by the current recommendation pipeline
Candidate ranking: Not recorded by the current recommendation pipeline
```

## 8. Campos técnicos e lacunas do runtime

[LIMITAÇÃO] O recomendador atual filtra por dificuldade/modalidade e pode selecionar aleatoriamente entre atividades compatíveis. Ele não persiste um ranqueamento de candidatos nem calcula atualmente `challengeFit`, `interactionFit`, `semanticFit`, novidade, risco de rejeição ou score final.

[DECISÃO DE ENGENHARIA] O contrato técnico inclui esses campos, mas usa `status: not_recorded` e `value: null` quando o dado não existe. Nenhum score, peso, versão ou traço foi inventado para preencher a interface.

[PARÂMETRO EXPERIMENTAL] Pesos e versões de ranqueamento poderão ser apresentados futuramente apenas quando forem configurados e registrados pelo pipeline que efetivamente tomou a decisão.

## 9. Privacidade

[DECISÃO DE ENGENHARIA] As explicações públicas são projeções sanitizadas da decisão. O painel técnico usa evidências agregadas necessárias — por exemplo, precisão recente e domínio registrado — e não expõe eventos brutos, respostas livres da criança ou o instantâneo completo do perfil.

## 10. Testes

[DECISÃO DE ENGENHARIA] Os testes verificam a geração das quatro saídas a partir da mesma decisão, ausência de termos/scores técnicos nas explicações públicas, legibilidade da explicação profissional, presença do contrato técnico completo, marcação explícita de dados indisponíveis e combinação obrigatória de flag, parâmetro e papel.

## 11. Referências

[LITERATURA] TODO: selecionar referências sobre explicações adaptadas a diferentes audiências e avaliar sua aplicabilidade ao contexto do ContaComigo. Nenhuma citação nova foi atribuída neste batch.

## Texto potencial para a dissertação

### Metodologia

Foi implementada uma transformação determinística que projeta uma decisão adaptativa persistida em explicações adequadas à criança, ao responsável e ao profissional, além de um traço técnico condicionado para inspeção de pesquisa. Testes automatizados verificaram conteúdo, privacidade e controle de acesso da interface técnica.

### Decisão de projeto

A separação foi realizada na camada de explicação, mantendo uma única decisão de recomendação. Dados técnicos inexistentes são identificados como não registrados, preservando rastreabilidade sem fabricar evidência.

### Limitações

O runtime atual não possui ranqueamento completo de candidatos nem todos os componentes de score previstos para pesquisas futuras. O histórico recente só é exibido quando fornecido de forma agregada ao explicador.

### Evidência necessária no experimento

Será necessário avaliar se cada audiência compreende a justificativa, se o detalhamento profissional é útil e se a visualização técnica permite auditar decisões sem expor dados pessoais desnecessários.
