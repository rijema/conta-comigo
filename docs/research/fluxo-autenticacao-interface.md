# Fluxo de autenticação da interface

## Objetivo

[PROPOSTA CONTA COMIGO]

Este documento registra a integração entre as interfaces de autenticação do frontend e o contrato existente no backend. A alteração não introduz novos dados pessoais, não modifica o modelo de usuários e não altera regras de autorização.

[LITERATURA]

Nenhuma afirmação de literatura é utilizada para justificar o desenho do fluxo neste documento. Referências sobre usabilidade, autenticação ou acessibilidade deverão ser selecionadas e verificadas antes de uso na dissertação.

## Implementação existente

[DECISÃO DE ENGENHARIA]

O backend NestJS expõe os endpoints `POST /auth/register` e `POST /auth/login`. Os contratos são definidos por `RegisterDto` e `LoginDto`. O login infantil utiliza nome da criança, e-mail do responsável e senha. O cadastro de uma criança permanece vinculado ao cadastro de um responsável.

No frontend, `src/lib/auth.ts` é a fonte única para chamadas de autenticação. Tanto a página independente de cadastro quanto o modal da página inicial reutilizam `authService.register`. O hook `useAuth` reutiliza o mesmo serviço para autenticação e navegação após o login.

## Compatibilidade dos papéis

[DECISÃO DE ENGENHARIA]

Os valores transmitidos pela API são `guardian` e `professional`, em minúsculas, conforme o enum existente no backend. A tipagem do frontend foi alinhada a esses valores. Essa correção não renomeia os conceitos apresentados às pessoas usuárias.

[PARÂMETRO EXPERIMENTAL]

Não há parâmetro experimental, limiar de sucesso ou critério científico definido para o fluxo de autenticação. Restrições de senha e validações de campos são requisitos técnicos existentes e não são apresentadas como resultados de pesquisa.

[HIPÓTESE A VALIDAR]

Apresentar autenticação em modal, preservando as rotas independentes, pode reduzir a interrupção percebida no acesso inicial sem diminuir a conclusão bem-sucedida do cadastro ou login. Essa hipótese ainda não foi testada.

## Compatibilidade e limites

- As rotas independentes de login e cadastro foram mantidas como alternativa ao modal.
- O método cliente de renovação de token foi preservado para evitar remoção incompatível, embora esta alteração não adicione endpoint de renovação ao controller.
- Não há alteração de esquema ou migração de banco de dados.
- Não há novos parâmetros científicos ou experimentais.

## Verificação

Os testes do frontend verificam que existe apenas uma implementação do serviço de autenticação, que as interfaces reutilizam esse serviço e que os valores dos papéis correspondem ao contrato. O teste do backend valida o payload utilizado pelo frontend diretamente contra `RegisterDto`.

## Texto potencial para a dissertação

### Metodologia

O fluxo de autenticação foi integrado à página inicial por meio de um modal que reutiliza o serviço cliente e os contratos já existentes. A compatibilidade foi verificada por testes estruturais no frontend, validação do DTO no backend e builds de produção.

### Decisão de projeto

Foram mantidas as páginas independentes como caminho alternativo e adotado um único serviço de autenticação no frontend. Os valores enviados para os papéis foram alinhados ao enum do backend sem alterar os termos apresentados na interface.

### Limitações

Os testes confirmam estrutura e compatibilidade de contrato, mas não demonstram maior facilidade de uso, redução de abandono ou adequação para diferentes perfis de participantes. O endpoint cliente de renovação de token permanece fora do escopo desta alteração.

### Evidência necessária no experimento

Uma avaliação deverá registrar conclusão e abandono das tarefas de login e cadastro, erros encontrados, necessidade de ajuda, tempo de execução quando previsto no protocolo e experiência com navegação por teclado. As métricas e critérios de análise precisam ser definidos antes da coleta.
