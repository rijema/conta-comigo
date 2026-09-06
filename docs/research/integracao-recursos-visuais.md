# Integração dos recursos visuais do Conta Comigo

## Objetivo

[PROPOSTA CONTA COMIGO]

Este documento registra como os recursos visuais fornecidos para o protótipo são usados na interface. A integração preserva a arquitetura existente em Next.js e não altera o mecanismo de adaptação das atividades.

[LITERATURA]

Este documento não associa os recursos visuais a benefícios descritos na literatura. Qualquer fundamentação sobre representação visual, engajamento ou aprendizagem deverá ser incluída somente após seleção e verificação das fontes correspondentes.

## Caminho de execução

[DECISÃO DE ENGENHARIA]

Os arquivos ficam em `frontend/public/assets/`. O Next.js os disponibiliza pela rota pública `/assets/<arquivo>`. Na implantação com a saída `standalone`, o estágio final do Docker precisa copiar explicitamente a pasta `public`; sem essa cópia, a página é renderizada, mas as requisições dos recursos retornam HTTP 404.

O `frontend/Dockerfile` contém, portanto:

```dockerfile
COPY --from=builder /app/public ./public
```

## Mapeamento atual

[DECISÃO DE ENGENHARIA]

| Recurso | Uso atual |
| --- | --- |
| `iconbrowser.png` | Identidade no cabeçalho e ícone do navegador |
| `mainiconfirstpage.png` | Apresentação da TitiA na página inicial e no modal de autenticação |
| `rainbowGiff.gif` | Elemento animado decorativo da página inicial |
| `correctanswer.png` | Feedback visual de resposta correta |
| `tryagain.png` | Feedback visual de nova tentativa |
| `arasaac.png` | Identificação da seção expansível sobre ARASAAC |
| `wildcard.png` | Apresentação complementar da TitiA |
| Demais imagens | Cartões informativos e reações visuais da TitiA |

## Acessibilidade

[DECISÃO DE ENGENHARIA]

- Imagens informativas recebem texto alternativo em português.
- Imagens apenas decorativas usam texto alternativo vazio.
- As animações CSS utilizam a variante `motion-safe`, sendo desativadas quando a pessoa configura redução de movimento no sistema operacional.
- A estrela continua presente como elemento de recompensa, sem substituir a informação textual.
- Os modais preservam navegação por teclado, fechamento com `Escape` e retorno do foco ao controle que os abriu.

[PARÂMETRO EXPERIMENTAL]

Não foi definido parâmetro experimental para quantidade, frequência, duração ou posição dos recursos visuais. As configurações atuais são decisões de interface e não valores cientificamente validados.

[HIPÓTESE A VALIDAR]

A presença contextual das reações visuais da TitiA pode influenciar a compreensão do feedback e a experiência percebida durante as atividades. O sentido e a magnitude de qualquer efeito precisam ser avaliados; não são assumidos pela implementação.

## Limites desta alteração

Esta integração não estabelece efeitos pedagógicos ou clínicos para as imagens e animações. Também não altera pontuação, dificuldade, seleção adaptativa ou critérios de acerto. Esses comportamentos permanecem sob responsabilidade dos componentes e serviços já existentes.

## Verificação

O comando `npm test`, executado em `frontend/`, verifica a presença e integridade básica dos arquivos, a cópia da pasta `public` pelo Dockerfile e o uso do GIF e da estrela no caminho executado pela página inicial.

## Texto potencial para a dissertação

### Metodologia

Os recursos visuais fornecidos para o protótipo foram mapeados para pontos específicos da página inicial, autenticação e feedback de atividades. A disponibilidade dos arquivos no container foi verificada por testes automatizados e por requisições HTTP ao runtime standalone.

### Decisão de projeto

Optou-se por servir os arquivos pelo diretório público já previsto no Next.js e incluí-lo explicitamente no estágio final da imagem Docker. Imagens informativas e decorativas foram diferenciadas por texto alternativo, e movimentos CSS respeitam a preferência de redução de movimento.

### Limitações

A integração técnica não demonstra impacto sobre aprendizagem, engajamento, autorregulação ou experiência emocional. O GIF decorativo também não é controlado pela variante CSS de redução de movimento, embora a informação da página não dependa dele.

### Evidência necessária no experimento

É necessário definir tarefas, condições de apresentação, formas de registro da compreensão do feedback e instrumentos de percepção antes do experimento. A análise deverá distinguir carregamento correto dos arquivos, preferência visual e possíveis efeitos sobre a execução das atividades.
