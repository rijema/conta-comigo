# Fluxo de cadastro profissional na home

## Objetivo

[PROPOSTA CONTA COMIGO]

Validar que o modal de cadastro da página inicial não exija criação de perfil infantil para usuários do papel profissional. O ajuste preserva o cadastro de responsável e evita um passo desnecessário no cadastro de profissional.

[LITERATURA]

Não há referência bibliográfica específica usada para a decisão de fluxo desta correção. A validação segue a convenção do contrato já existente entre frontend e backend no projeto.

## Implementação existente

[DECISÃO DE ENGENHARIA]

O modal de autenticação em `frontend/src/components/home/auth-dialog.tsx` reunia a etapa de cadastro em duas fases. A etapa 2 usava `role` padrão como `guardian`, então o formulário de criança aparecia mesmo quando a pessoa selecionava profissional. O payload enviado para `authService.register` também incluía `childProfile` e `childPassword` apenas quando `form.role === "guardian"`, mas a etapa de coleta ainda era exibida antes da validação.

## Correção aplicada

[DECISÃO DE ENGENHARIA]

A condição de exibição do formulário infantil foi centralizada em `requiresChildProfile = form.role === "guardian"`. Com isso:

- cadastro de responsável continua pedindo nome, idade e senha da criança;
- cadastro de profissional não mostra o bloco de dados da criança;
- a validação do submit exige dados da criança somente para `guardian`;
- o estado do modal é resetado ao abrir, evitando uso de dados antigos.

[PARÂMETRO EXPERIMENTAL]

Não há parâmetro experimental ou limiar científico para este ajuste. A correção é funcional e de compatibilidade do fluxo de interface.

[HIPÓTESE A VALIDAR]

Ao remover a etapa infantil do fluxo profissional, a pessoa usuária conseguirá concluir o cadastro sem confusão de papéis e com menor risco de abandono em primeira interação.

## Verificação

Testes do frontend validam a compatibilidade do contrato e a ausência da exigência de perfil infantil em cadastro profissional.

## Texto potencial para a dissertação

### Metodologia

A correção foi validada por testes estruturais do frontend que verificam o uso único do serviço de autenticação, a compatibilidade de papéis com o contrato do backend e a ausência de campos de criança no cadastro profissional.

### Decisão de projeto

A interface foi ajustada para exibir campos dependentes do papel do usuário. A regra foi implementada no próprio modal de autenticação para preservar o desenho de página inicial sem duplicar telas ou serviços.

### Limitações

O ajuste cobre a consistência do fluxo de cadastro na interface, mas não mede abandono, tempo de conclusão ou satisfação do usuário em experimentos com participantes reais. A avaliação de experiência ainda depende de protocolo específico.

### Evidência necessária no experimento

Serão necessárias métricas de conclusão do cadastro, taxa de abandono por etapa, tempo gasto no modal e número de erros de preenchimento por perfil de usuário.
