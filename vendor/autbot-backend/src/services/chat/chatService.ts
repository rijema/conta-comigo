import axios from "axios";
import dotenv from "dotenv";

// Fix: Updated RAG prompt system for better TEA contextualization
dotenv.config();

const apiKey = process.env.API_KEY;
const modelName = process.env.MODEL_NAME;

export const publicos = {
  PROFESSOR:
    "Responda de forma técnica e com orientações práticas para professores.",
  CUIDADOR:
    "Responda de forma explicativa e com exemplos para pais que não têm conhecimento técnico.",
  RESPONSAVEL:
    "Responda com paciência e clareza, oferecendo orientações úteis para pais ou responsáveis pela criança.",
  USUARIO:
    "Responda de forma simples, clara e acolhedora para um usuário comum.",
  TEA_NIVEL_1:
    "Responda de forma clara, respeitando a independência e as necessidades de uma pessoa com TEA nível 1 (leve).",
  TEA_NIVEL_2:
    "Responda com empatia e apoio, considerando as dificuldades moderadas enfrentadas por uma pessoa com TEA nível 2.",
  TEA_NIVEL_3:
    "Responda de forma cuidadosa, com linguagem simples e suporte adicional para uma pessoa com TEA nível 3 (severo).",
} as const;

export type PublicoKey = keyof typeof publicos;

const invalidQuestion =
  "Peço desculpas, mas não disponho de informações para responder a essa pergunta. Posso ajudar com algo relacionado à acessibilidade, inclusão ou Transtorno do Espectro Autista (TEA)?";

const fallbackResponses: Record<PublicoKey, string> = {
  PROFESSOR:
    "No momento estou com uma instabilidade técnica, mas posso seguir ajudando com uma orientação inicial: observe a situação da criança em contexto, registre exemplos concretos do que acontece, combine pequenas adaptações na rotina e retorne com a pergunta em alguns instantes para que eu aprofunde a resposta.",
  CUIDADOR:
    "Estou com uma instabilidade técnica agora, mas posso deixar uma orientação inicial: tente observar o que aconteceu antes, durante e depois da situação, mantenha uma rotina previsível e foque em uma ajuda de cada vez. Se quiser, envie a pergunta novamente em alguns instantes.",
  RESPONSAVEL:
    "Estou com uma instabilidade técnica neste momento, mas posso oferecer uma orientação inicial: observe em quais momentos a dificuldade aparece, mantenha explicações curtas e uma rotina previsível, e procure apoio da escola ou da equipe de saúde quando necessário. Se quiser, tente novamente em alguns instantes.",
  USUARIO:
    "Estou com uma instabilidade técnica agora, mas continuo aqui para ajudar assim que a conexão normalizar. Se quiser, envie a pergunta novamente em alguns instantes.",
  TEA_NIVEL_1:
    "Estou com uma instabilidade técnica no momento. Se quiser, tente novamente em alguns instantes e eu vou tentar responder de forma clara e objetiva.",
  TEA_NIVEL_2:
    "Estou com uma instabilidade técnica agora. Você pode tentar de novo em alguns instantes e eu vou responder com calma e clareza.",
  TEA_NIVEL_3:
    "Estou com uma instabilidade técnica agora. Tente novamente em alguns instantes. Vou responder de forma simples e com cuidado.",
};

// [DEPLOYMENT FIX: Improved RAG context for TEA/autism]
// This version interprets all questions through a TEA/neurodiversity lens
// See commit: feat: improve TiTiA chat UX
function buildPromptSystem(invalidResponse: string) {
  return `Você é um assistente especializado que responde a perguntas com foco em Transtorno do Espectro Autista (TEA), inclusão, acessibilidade e bem-estar neurodivergente.

**Seu objetivo principal é ajudar o usuário com informações relevantes, sempre que possível.**

**ESTRATÉGIA DE RESPOSTA - IMPORTANTE:**

Muitas perguntas aparentemente genéricas têm conexão com TEA, inclusão ou acessibilidade. Exemplos:
- "Como organizar meu dia?" → Relacionado a rotina e estrutura (essencial para TEA)
- "Tenho dificuldade em concentrar" → Pode envolver autismo, TDAH ou sensibilidades
- "Como falar com alguém que não entende?" → Relacionado a comunicação social
- "Que tipo de atividade funciona bem?" → Adaptação de interesses/força
- "Como lidar com mudanças?" → Transições e flexibilidade (desafio comum em TEA)

**Portanto, SUA ESTRATÉGIA É:**
1. **Sempre tentar interpretar a pergunta dentro do contexto de TEA, inclusão, acessibilidade e neurodivers idade**
2. **Se a pergunta tiver relação possível, responda com essa lente inclusiva**
3. **Ofereça perspectivas que consideram pessoas neurodivergentes, mesmo se a pergunta não mencionou explicitamente**
4. **Somente rejeite perguntas completamente fora de escopo** (ex: política partidária, celebridades, esportes recreativos)

**EXEMPLOS DE CONEXÃO:**
- Pergunta: "Como aprender programação?"
- Resposta INCLUIR: "Muitas pessoas autistas têm pontos fortes em pensamento sistemático. Aqui estão estratégias inclusive acessíveis..."

**Se a pergunta for genuinamente fora de escopo** (claramente irrelevante), responda **exatamente** com:
${invalidResponse}

**Qualidade da resposta:**
- Nunca invente diagnósticos ou níveis de gravidade
- Use linguagem respeitosa e pessoa-first quando apropriado
- Considere diferentes níveis de suporte e inteligência
- Valide as dificuldades como diferenças, não deficiências
- Ofereça estratégias práticas e baseadas em força

**Antes de finalizar, verifique:**
- ✓ Nenhuma linguagem capacitista ou ofensiva sobre neurodiversidade
- ✓ Inclusão de perspectivas neurodivergentes é apropriada e respeitosa
- ✓ Linguagem é acessível para o público-alvo
- ✓ Informações sobre escalas/categorias de TEA são corretas

**Ao final da resposta**, insira um link relevante que aprofunde o tema, escolhendo apenas UM dos links abaixo:

**Comportamento & Vida diária:**
- https://childmind.org/guide/parents-guide-to-autism/
- https://www.autismspeaks.org/

**Educação & Aprendizado:**
- https://www.inclusaoja.com.br/
- https://www.autism.org.uk/advice-and-guidance/topics/education

**Diagnóstico & Entendimento:**
- https://www.cdc.gov/ncbddd/autism/index.html
- https://www.nhs.uk/conditions/autism/diagnosis/
- https://ama.org.br/site/autismo/diagnostico/

**Apoio & Instituições:**
- https://ama.org.br/site/autismo/instituicoes/
- https://autismoerealidade.org.br/convivendo-com-o-tea/instituicoes-de-apoio/

**Métodos & Abordagens:**
- https://ama.org.br/site/autismo/escalas/
- http://www.autismoevida.org.br/p/metodos-de-abordagem.html

**Saúde & Bem-estar:**
- https://www.autism.org.uk/advice-and-guidance/topics/physical-health
- https://autismoerealidade.org.br/convivendo-com-o-tea/cartilhas/

**Direitos & Leis:**
- https://autismoerealidade.org.br/convivendo-com-o-tea/leis-e-direitos/

**FAQ & Comunidade:**
- https://autismoerealidade.org.br/convivendo-com-o-tea/perguntas-e-respostas/
- https://socialmentes.net/perguntas-e-respostas-no-autismo-2025/
- https://www.ifpb.edu.br/assuntos/fique-por-dentro/algumas-perguntas-sobre-autismo

**Info Geral:**
- https://autismoerealidade.org.br/o-que-e-o-autismo/
- https://www.cdc.gov/autism/living-with/index.html
- https://www.autism.org.uk/advice-and-guidance/what-is-autism
- https://www.who.int/news-room/fact-sheets/detail/autism-spectrum-disorders`;
}

function formatConversationMemory(memory?: string) {
  if (!memory?.trim()) return "";
  return `\n\nContexto observado de conversas anteriores do mesmo usuário:\n${memory.trim()}`;
}

export async function sendPrompt(
  publicoKey: PublicoKey,
  pergunta: string,
  conversationMemory?: string
): Promise<string> {
  if (!apiKey) {
    return fallbackResponses[publicoKey];
  }

  const prefixo = publicos[publicoKey];
  const promptCompleto = `${prefixo}${formatConversationMemory(conversationMemory)}\n\nPergunta atual:\n${pergunta}`;
  const promptSystem = buildPromptSystem(invalidQuestion);

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: modelName,
        messages: [
          { role: "system", content: promptSystem },
          { role: "user", content: promptCompleto },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.warn("Falha ao consultar modelo principal do chat:", error);
    return fallbackResponses[publicoKey];
  }
}

export async function generateConversationInsights(
  publicoKey: PublicoKey,
  conversationSample: string
): Promise<string> {
  if (!apiKey) {
    return "Conversa Sobre Apoio";
  }

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: modelName,
        messages: [
          {
            role: "system",
            content:
              "Você resume evidências observadas em conversas sobre TEA, inclusão e acessibilidade. Responda em português do Brasil. Gere no máximo 5 linhas curtas. Inclua: 1) temas recorrentes, 2) intenção predominante do usuário, 3) estilo de apoio mais útil. Não invente diagnóstico. Use linguagem observacional e cuidadosa.",
          },
          {
            role: "user",
            content: `Perfil de linguagem do público: ${publicos[publicoKey]}\n\nAmostra de conversas:\n${conversationSample}`,
          },
        ],
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.warn("Falha ao gerar insights conversacionais:", error);
    return "Temas recorrentes observados em conversa recente. Intenção predominante de buscar orientação prática. Estilo de apoio mais útil: respostas claras, acolhedoras e objetivas.";
  }
}

export async function generateSummary(text: string): Promise<string> {
  if (!apiKey) {
    return "Conversa Sobre Apoio";
  }

  const contexto = `Tema: Transtorno do Espectro Autista\n\n${text}`;

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: modelName,
        messages: [
          {
            role: "system",
            content: `Gere um título muito curto (máximo de 6 palavras) que resuma a intenção da pergunta do usuário, sem responder ou interpretar o conteúdo. Foque apenas na ação ou objetivo da pergunta. Comece cada substantivo com letra maiúscula e sem pontuação final. Ignore qualquer explicação ou resposta.`,
          },
          {
            role: "user",
            content: contexto,
          },
        ],
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.warn("Falha ao gerar resumo do histórico:", error);
    return "Conversa Sobre Apoio";
  }
}
