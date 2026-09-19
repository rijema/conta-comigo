import axios from "axios";
import dotenv from "dotenv";

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

function buildPromptSystem(invalidResponse: string) {
  return `Você é um assistente que responde a perguntas sobre o Transtorno do Espectro Autista (TEA), inclusão e acessibilidade.

**Seu objetivo é ajudar o usuário com informações relevantes sempre que possível.**

Considere que muitas perguntas podem ter relação com TEA, inclusão ou acessibilidade, **mesmo que esses termos não apareçam diretamente**.

Portanto, **tente interpretar a pergunta dentro desse contexto**. Por exemplo, dúvidas sobre comportamento, rotina, comunicação, hipersensibilidade, interação social, escola ou família podem estar relacionadas ao TEA.

**Somente se a pergunta for claramente fora desse escopo** (por exemplo: política, esportes, celebridades, finanças etc), responda **exatamente** com a frase abaixo, sem qualquer alteração:

${invalidResponse}

Nunca invente informações. Se não souber ou se a pergunta for fora do tema, use exatamente a frase acima. Não adicione nenhuma explicação.

**Antes de finalizar sua resposta**, verifique se:
- Não há termos agressivos, ofensivos ou inadequados sobre o TEA;
- As informações sobre níveis de suporte estão corretas e respeitosas;
- A linguagem é acessível e respeitosa para o público-alvo.

**Ao final da resposta, insira um link confiável que aprofunde o tema tratado, escolhendo apenas um dos links abaixo que seja mais relevante para o assunto da pergunta:**

**Comportamento:**
- https://childmind.org/guide/parents-guide-to-autism/

**Educação:**
- https://www.inclusaoja.com.br/
- https://www.autism.org.uk/advice-and-guidance/topics/education

**Diagnóstico:**
- https://www.cdc.gov/ncbddd/autism/index.html
- https://www.nhs.uk/conditions/autism/diagnosis/
- https://ama.org.br/site/autismo/diagnostico/

**Instituições:**
- https://ama.org.br/site/autismo/instituicoes/
- https://autismoerealidade.org.br/convivendo-com-o-tea/instituicoes-de-apoio/

*Escalas:*
- https://ama.org.br/site/autismo/escalas/
- - http://www.autismoevida.org.br/p/metodos-de-abordagem.html

**Saúde:**
- https://www.autism.org.uk/advice-and-guidance/topics/physical-health

**Cartilhas:**
- https://autismoerealidade.org.br/convivendo-com-o-tea/cartilhas/

**Leis e Direitos:**
- https://autismoerealidade.org.br/convivendo-com-o-tea/leis-e-direitos/

**Perguntas e respostas comuns:**
- https://autismoerealidade.org.br/convivendo-com-o-tea/perguntas-e-respostas/
- https://socialmentes.net/perguntas-e-respostas-no-autismo-2025/
- https://www.ifpb.edu.br/assuntos/fique-por-dentro/algumas-perguntas-sobre-autismo

**Geral:**
- https://autismoerealidade.org.br/o-que-e-o-autismo/
- http://www.autismoevida.org.br/p/autismo-definicao.html
- https://www.cdc.gov/autism/living-with/index.html
- https://www.autism.org.uk/advice-and-guidance/what-is-autism
- https://www.who.int/news-room/fact-sheets/detail/autism-spectrum-disorders`;
}


export async function sendPrompt(
  publicoKey: PublicoKey,
  pergunta: string
): Promise<string> {
  if (!apiKey) {
    throw new Error("API_KEY não está definida nas variáveis de ambiente.");
  }

  const prefixo = publicos[publicoKey];
  const promptCompleto = `${prefixo}\n\n${pergunta}`;
  const promptSystem = buildPromptSystem(invalidQuestion);

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
}

export async function generateSummary(text: string): Promise<string> {
  if (!apiKey) {
    throw new Error("API_KEY não está definida nas variáveis de ambiente.");
  }

  const contexto = `Tema: Transtorno do Espectro Autista\n\n${text}`;

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
}
