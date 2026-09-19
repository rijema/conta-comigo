interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(5px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "1rem",
        }}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: "#fefefe",
            color: "#1b1c3f",
            maxWidth: "500px",
            maxHeight: "75vh",
            borderRadius: "1rem",
            overflowY: "auto",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              backgroundColor: "#b6d9ec",
              padding: "1.5rem 2rem",
              borderTopLeftRadius: "1rem",
              borderTopRightRadius: "1rem",
              fontWeight: "700",
              fontSize: "1.5rem",
              color: "#1b1c3f",
              userSelect: "none",
              textAlign: "center",
            }}
          >
            Termo de Consentimento para Uso do Software AutBot
          </div>

          <div
            style={{
              padding: "1.5rem 2rem",
              fontSize: "0.95rem",
              lineHeight: 1.6,
              whiteSpace: "pre-line",
              color: "#1b1c3f",
            }}
          >
            <strong style={{ fontSize: "1.1rem", display: "block", marginBottom: "0.5rem" }}>
              1. Apresentação do Projeto
            </strong>
            Você está sendo convidado(a) a utilizar o sistema AutBot, uma ferramenta web desenvolvida para oferecer suporte digital inclusivo a pessoas que convivem com crianças e adolescentes com Transtorno do Espectro Autista (TEA), como familiares, cuidadores e profissionais da área da educação. O sistema funciona por meio de um chatbot textual, que responde dúvidas sobre rotinas, estratégias de ensino, direitos e outras temáticas relacionadas ao TEA, com base em documentos oficiais, como legislações, guias e boas práticas.

            {"\n\n"}

            <strong style={{ fontSize: "1.1rem", display: "block", marginBottom: "0.5rem" }}>
              2. Objetivos do Software
            </strong>
            O AutBot visa:
            <ul style={{ marginTop: 0, paddingLeft: "1.2rem" }}>
              <li>Oferecer informações acessíveis e confiáveis sobre o TEA, com base em documentos estruturados;</li>
              <li>Apoiar a comunidade educacional e familiar no entendimento de práticas e direitos relacionados ao TEA;</li>
              <li>Promover acessibilidade digital com interface adaptada (contraste, navegação por teclado, leitura por voz);</li>
              <li>Garantir histórico de conversas por sessão ou login (quando aplicável).</li>
            </ul>

            <strong style={{ fontSize: "1.1rem", display: "block", marginBottom: "0.5rem" }}>
              3. Uso e Coleta de Dados
            </strong>
            O uso do AutBot requer a criação de uma conta, com a inserção de algumas informações pessoais como nome completo e data de nascimento. Esses dados são utilizados exclusivamente para personalizar a experiência e garantir a segurança do acesso.
            As interações com o chatbot podem ser armazenadas de forma anônima e confidencial, para fins de melhoria do sistema e análise de uso. Nenhuma informação será compartilhada com terceiros sem o seu consentimento prévio e explícito, conforme os princípios da LGPD (Lei Geral de Proteção de Dados).

            {"\n\n"}

            <strong style={{ fontSize: "1.1rem", display: "block", marginBottom: "0.5rem" }}>
              4. Riscos e Benefícios
            </strong>
            Não há riscos conhecidos associados ao uso do AutBot. O sistema é informativo e não substitui aconselhamento médico, jurídico ou pedagógico profissional. Os benefícios incluem o acesso facilitado a informações seguras e a promoção da inclusão digital para o público TEA.

            {"\n\n"}

            <strong style={{ fontSize: "1.1rem", display: "block", marginBottom: "0.5rem" }}>
              5. Direitos do Usuário
            </strong>
            Você poderá:
            <ul style={{ marginTop: 0, paddingLeft: "1.2rem" }}>
              <li>Interromper o uso do sistema a qualquer momento;</li>
              <li>Solicitar que suas interações não sejam armazenadas (quando login for utilizado);</li>
              <li>Sugerir melhorias e relatar eventuais problemas de acessibilidade ou conteúdo.</li>
            </ul>

            {"\n\n"}

            <strong style={{ fontSize: "1.1rem", display: "block", marginBottom: "0.5rem" }}>
              6. Declaração de Consentimento
            </strong>
            Ao utilizar o AutBot, você declara que:
            <ul style={{ marginTop: 0, paddingLeft: "1.2rem" }}>
              <li>Leu e compreendeu as informações acima;</li>
              <li>Está ciente dos objetivos e funcionamento do software;</li>
              <li>Autoriza, de forma livre e esclarecida, o uso do sistema e o possível registro anônimo de suas interações para fins de aprimoramento e pesquisa.</li>
            </ul>

            {"\n\n"}

            Em caso de dúvidas, entre em contato com a equipe de desenvolvimento pelo e-mail:
            <br />
            Ao prosseguir, confirmo que li e compreendi os termos acima, e estou de acordo com a utilização do AutBot nas condições descritas. Concordo com o uso das informações fornecidas conforme as finalidades apresentadas, em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD).
          </div>

          <button
            onClick={onClose}
            style={{
              margin: "1rem 2rem 2rem",
              backgroundColor: "#181d54",
              color: "#fff",
              padding: "0.6rem 1.4rem",
              border: "none",
              borderRadius: "0.6rem",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "1rem",
              alignSelf: "center",
              transition: "background-color 0.3s ease",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLButtonElement).style.backgroundColor = "#181d54")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLButtonElement).style.backgroundColor = "#b6d9ec")
            }
          >
            Fechar
          </button>
        </div>
      </div>
    </>
  );
};
