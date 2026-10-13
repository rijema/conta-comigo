"use client";

export function ConsentTermContent() {
  return (
    <div className="space-y-6 text-sm text-slate-700">
          {/* INTRODUÇÃO */}
          <section>
            <h2 className="mb-2 text-lg font-bold text-slate-900">1. Introdução</h2>
            <p>
              O <strong>Conta Comigo</strong> é uma plataforma de aprendizagem adaptativa baseada em 
              tecnologia de inteligência artificial, desenvolvida com propósitos educacionais e de pesquisa 
              científica. Esta plataforma é especialmente projetada para auxiliar crianças com Transtorno do 
              Espectro Autista (TEA) a desenvolver habilidades matemáticas de forma personalizada, acessível 
              e inclusiva.
            </p>
          </section>

          {/* O QUE FAZEMOS */}
          <section>
            <h2 className="mb-2 text-lg font-bold text-slate-900">2. O Que É o Conta Comigo?</h2>
            <p className="mb-2">
              O Conta Comigo é um sistema educacional inteligente que oferece:
            </p>
            <ul className="list-inside list-disc space-y-1 pl-4">
              <li>
                <strong>Atividades educacionais adaptativas:</strong> Exercícios matemáticos que se ajustam 
                ao nível de aprendizado de cada criança
              </li>
              <li>
                <strong>Análise de aprendizado em tempo real:</strong> Sistema que acompanha o progresso e 
                recomenda atividades personalizadas
              </li>
              <li>
                <strong>Assistente de IA (TitiA):</strong> Chatbot educacional disponível para responder 
                dúvidas sobre TEA, inclusão e aprendizagem
              </li>
              <li>
                <strong>Painéis de acompanhamento:</strong> Ferramentas para responsáveis e educadores 
                visualizarem o progresso da criança
              </li>
              <li>
                <strong>Interface acessível:</strong> Suporte a recursos de acessibilidade, múltiplos idiomas 
                e ajustes visuais/auditivos
              </li>
            </ul>
          </section>

          {/* O QUE VOCÊ FARÁ */}
          <section>
            <h2 className="mb-2 text-lg font-bold text-slate-900">
              3. O Que Você Fará ao Usar Conta Comigo?
            </h2>
            <p className="mb-2">Como usuário, você poderá:</p>
            <ul className="list-inside list-disc space-y-1 pl-4">
              <li>
                <strong>Criar uma conta:</strong> Registrar-se como responsável, educador ou criança com seus 
                dados pessoais básicos
              </li>
              <li>
                <strong>Resolver atividades educacionais:</strong> Participar de exercícios matemáticos 
                interativos adaptados ao nível de aprendizado
              </li>
              <li>
                <strong>Interagir com o assistente (TitiA):</strong> Fazer perguntas sobre tópicos educacionais 
                e receber respostas personalizadas
              </li>
              <li>
                <strong>Visualizar progresso:</strong> Acompanhar métricas de desempenho, habilidades 
                desenvolvidas e recomendações de próximas atividades
              </li>
              <li>
                <strong>Usar funcionalidades de acessibilidade:</strong> Ajustar fonte, contraste, velocidade 
                de fala, e utilizar legendas
              </li>
            </ul>
          </section>

          {/* COLETA DE DADOS */}
          <section>
            <h2 className="mb-2 text-lg font-bold text-slate-900">
              4. Coleta de Dados - Propósitos Científicos e Educacionais
            </h2>
            <p className="mb-2">
              <strong>Conta Comigo é uma plataforma de pesquisa científica.</strong> Ao usar a plataforma, 
              coletamos dados com o objetivo primário de:
            </p>
            <ul className="list-inside list-disc space-y-1 pl-4">
              <li>
                <strong>Avançar conhecimento científico:</strong> Entender como crianças com TEA aprendem 
                matemática e quais estratégias são mais eficazes
              </li>
              <li>
                <strong>Melhorar a plataforma:</strong> Usar análise de dados para aprimorar a qualidade das 
                atividades e recomendações
              </li>
              <li>
                <strong>Pesquisa acadêmica:</strong> Contribuir para publicações científicas revisadas por 
                pares sobre aprendizagem adaptativa e TEA
              </li>
              <li>
                <strong>Desenvolver melhores práticas:</strong> Informar educadores e profissionais sobre 
                abordagens eficazes
              </li>
            </ul>

            <p className="mt-3">
              <strong>Dados Coletados:</strong> Coletamos informações sobre seu comportamento de aprendizado, 
              respostas a atividades, tempo de resposta, padrões de uso, erros cometidos, interações com o 
              assistente de IA, e dados demográficos básicos (idade, região, tipo de deficiência ou diagnóstico).
            </p>

            <p className="mt-2">
              <strong>Anonimização:</strong> Todos os dados são pseudonimizados (identificadores são removidos 
              ou substituídos por códigos), garantindo que sua identidade pessoal não seja diretamente 
              identificável na pesquisa. Seus dados são vinculados a um identificador único que não revela 
              seu nome ou informações de contato.
            </p>
          </section>

          {/* CONFORMIDADE LEGAL */}
          <section>
            <h2 className="mb-2 text-lg font-bold text-slate-900">
              5. Conformidade Legal (LGPD e Privacidade)
            </h2>
            <p className="mb-2">Conta Comigo cumpre integralmente:</p>
            <ul className="list-inside list-disc space-y-1 pl-4">
              <li>
                <strong>Lei Geral de Proteção de Dados (LGPD):</strong> Suas informações são protegidas conforme 
                os direitos de privacidade garantidos pela legislação brasileira
              </li>
              <li>
                <strong>Direito de acesso:</strong> Você pode solicitar uma cópia de todos os dados que temos 
                sobre você
              </li>
              <li>
                <strong>Direito de correção:</strong> Você pode pedir para corrigir informações inexatas
              </li>
              <li>
                <strong>Direito de exclusão:</strong> Você pode solicitar a exclusão de seus dados (sujeito a 
                retenção legal para pesquisa)
              </li>
              <li>
                <strong>Direito de portabilidade:</strong> Você pode solicitar que seus dados sejam transferidos 
                para outro serviço
              </li>
            </ul>

            <p className="mt-3">
              Para exercer esses direitos ou relatar preocupações sobre privacidade, contate-nos em: 
              <strong className="block">privacidade@contacomigo.com</strong>
            </p>
          </section>

          {/* SEGURANÇA */}
          <section>
            <h2 className="mb-2 text-lg font-bold text-slate-900">6. Segurança dos Dados</h2>
            <p>
              Implementamos medidas técnicas e organizacionais rigorosas para proteger seus dados, incluindo:
            </p>
            <ul className="list-inside list-disc space-y-1 pl-4">
              <li>Criptografia de dados em trânsito (HTTPS/TLS)</li>
              <li>Criptografia de dados em repouso</li>
              <li>Controle de acesso baseado em funções</li>
              <li>Auditorias de segurança regulares</li>
              <li>Conformidade com padrões internacionais (ISO 27001)</li>
            </ul>
          </section>

          {/* CONSENTIMENTO */}
          <section>
            <h2 className="mb-2 text-lg font-bold text-slate-900">7. Seu Consentimento</h2>
            <p className="mb-2">
              Ao usar Conta Comigo, você concorda que:
            </p>
            <ul className="list-inside list-disc space-y-1 pl-4">
              <li>
                Seus dados educacionais são coletados e analisados para fins científicos, educacionais e de 
                melhoria da plataforma
              </li>
              <li>
                Dados pseudonimizados podem ser usados em pesquisas acadêmicas, publicações científicas e 
                compartilhados com instituições de pesquisa
              </li>
              <li>
                O uso de dados continua enquanto sua conta estiver ativa, a menos que você solicite a exclusão
              </li>
            </ul>

            <p className="mt-3">
              <strong>Você pode retirar seu consentimento a qualquer momento</strong> entrando em contato 
              conosco. Isso resultará na exclusão de sua conta e dados, com exceção do que foi necessário 
              reter por lei.
            </p>
          </section>

          {/* CONTATO */}
          <section>
            <h2 className="mb-2 text-lg font-bold text-slate-900">8. Dúvidas e Contato</h2>
            <p>
              Se você tiver dúvidas sobre este termo, nossa política de privacidade, ou como usamos seus dados, 
              entre em contato:
            </p>
            <div className="mt-2 space-y-1">
              <p><strong>E-mail:</strong> privacidade@contacomigo.com</p>
              <p><strong>Formulário de contato:</strong> Disponível em nossa plataforma</p>
            </div>
          </section>

          {/* VALIDADE */}
          <section>
            <p className="text-xs text-slate-500">
              <strong>Última atualização:</strong> Outubro de 2026
            </p>
            <p className="text-xs text-slate-500">
              Este termo pode ser atualizado periodicamente. Notificaremos sobre mudanças significativas 
              enviando um aviso para seu e-mail registrado.
            </p>
          </section>
    </div>
  );
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ConsentModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-2xl text-slate-500 hover:text-slate-700"
          aria-label="Fechar"
        >
          ×
        </button>

        <h1 className="mb-6 text-3xl font-black text-slate-900">
          Termo de Consentimento e Política de Privacidade
        </h1>

        <ConsentTermContent />

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border-2 border-slate-200 px-4 py-2 font-bold text-slate-700 hover:bg-slate-100"
          >
            Fechar
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 font-bold text-white hover:-translate-y-0.5"
          >
            Aceitar e Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
