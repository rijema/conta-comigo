# Acessibilidade da interface visual

## Escopo

[PROPOSTA CONTA COMIGO]

Este documento registra os comportamentos de acessibilidade aplicados à página inicial e aos modais de apresentação e autenticação. A alteração não modifica conteúdo pedagógico, regras adaptativas ou coleta de dados.

[LITERATURA]

Este documento não atribui seus requisitos a uma referência bibliográfica ou norma específica. Uma versão destinada à dissertação deverá incluir e verificar as referências adotadas antes de relacionar a implementação a critérios formais de conformidade.

## Ampliação da página

[DECISÃO DE ENGENHARIA]

O viewport mantém a escala inicial, mas não define escala máxima e não desativa a ampliação. Dessa forma, o navegador e as tecnologias assistivas podem ampliar o conteúdo conforme a necessidade da pessoa usuária.

## Comportamento dos modais

[DECISÃO DE ENGENHARIA]

Os modais da página inicial reutilizam o hook `useModalFocus`, responsável por:

- mover o foco para um controle do modal ao abrir;
- manter a navegação por `Tab` dentro do modal;
- permitir fechamento pela tecla `Escape`;
- impedir o deslocamento do conteúdo ao fundo enquanto o modal está aberto;
- devolver o foco ao controle que abriu o modal após o fechamento.

Os títulos e descrições são associados ao diálogo por atributos ARIA. Seletores que representam escolhas usam `aria-pressed` para comunicar o estado atual.

## Movimento

[DECISÃO DE ENGENHARIA]

Os movimentos decorativos da página inicial utilizam `motion-safe`. Quando o sistema operacional solicita redução de movimento, essas animações CSS não são executadas. O GIF fornecido é decorativo e utiliza texto alternativo vazio; a compreensão da página não depende de sua animação.

[PARÂMETRO EXPERIMENTAL]

Não há limiar, pontuação ou parâmetro experimental definido nesta alteração. Duração, intensidade e frequência das animações não são tratadas neste documento como valores cientificamente validados.

[HIPÓTESE A VALIDAR]

A possibilidade de ampliar o conteúdo e solicitar redução de movimento pode reduzir barreiras percebidas durante o uso da interface. Essa relação não é assumida como resultado e precisa ser avaliada com participantes e instrumentos definidos no protocolo experimental.

## Limites

Esta revisão cobre os componentes alterados na página inicial. Ela não representa uma certificação formal de conformidade de toda a aplicação. Nenhuma afirmação clínica ou pedagógica é derivada destas decisões de interface.

## Texto potencial para a dissertação

### Metodologia

Foi realizada uma revisão técnica dos componentes da página inicial que controlam ampliação, movimento e interação com modais. A implementação foi verificada por testes automatizados de regressão e pelo build de produção do frontend.

### Decisão de projeto

Optou-se por não restringir a ampliação do navegador e por concentrar o gerenciamento de foco dos modais em um único hook. Elementos decorativos utilizam uma variante que respeita a preferência de redução de movimento do sistema.

### Limitações

A revisão abrange apenas os componentes modificados e não constitui auditoria integral de acessibilidade nem certificação de conformidade. Os testes estruturais não substituem avaliação com tecnologias assistivas e pessoas participantes.

### Evidência necessária no experimento

É necessário registrar o protocolo de avaliação, as tecnologias assistivas utilizadas, as tarefas executadas, as dificuldades observadas e a percepção das pessoas participantes. Qualquer comparação deverá definir previamente métricas e condições, sem inferir benefício clínico a partir da implementação técnica.
