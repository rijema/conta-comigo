import { useState } from "react";
import axios from "axios";
import "./Profissionais.css";
import SharedTopBar from "../../components/topbar/SharedTopBar";

const apiUrl = import.meta.env.VITE_API_URL;

interface Profissional {
  id: string;
  nome: string;
  endereco: string;
  telefone?: string;
  especialidade: string;
}

const Profissionais = () => {
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [especialidade, setEspecialidade] = useState("");

  const [resultados, setResultados] = useState<Profissional[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const buscarProfissionais = async () => {
    if (!cidade || !estado) {
      setFeedback("Cidade e estado são obrigatórios para a busca.");
      return;
    }

    setLoading(true);
    setFeedback("");

    try {
      const res = await axios.get(`${apiUrl}/profissionais`, {
        params: {
          cidade,
          estado,
          especialidade,
        },
      });

      setResultados(Array.isArray(res.data) ? res.data : []);
      setFeedback(Array.isArray(res.data) && res.data.length === 0 ? "Nenhum profissional encontrado para esses filtros." : "");
    } catch (error) {
      console.log(error);
      setFeedback("Erro ao buscar profissionais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profissionais-page-container">
      <SharedTopBar pageType='profissionais' />
      <div className="profissionais-content-area">
        <main className="main-profissionais">
          <section className="profissionais-left">
            <div className="profissionais-section-heading">
              <span className="profissionais-kicker">Rede de apoio</span>
              <h1>Buscar profissionais</h1>
              <p>Encontre especialistas por cidade, estado e área de atuação com uma interface mais acolhedora e legível.</p>
            </div>
            <div className="profissionais-card">
              <div className="profissionais-textfield">
                <label>Cidade*</label>
                <input
                  type="text"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder="Ex: Recife"
                />
              </div>

              <div className="profissionais-textfield">
                <label>Estado(UF)*</label>
                <input
                  type="text"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  placeholder="Ex: PE"
                />
              </div>

              <div className="profissionais-textfield">
                <label>Especialidade</label>
                <input
                  type="text"
                  value={especialidade}
                  onChange={(e) => setEspecialidade(e.target.value)}
                  placeholder="Psicólogo, psiquiatra..."
                />
              </div>

              <button className="profissionais-button" onClick={buscarProfissionais}>
                {loading ? "Buscando..." : "Buscar"}
              </button>

              {feedback && <p className="profissionais-feedback">{feedback}</p>}
            </div>
          </section>

          <section className="profissionais-right">
            <div className="profissionais-section-heading profissionais-section-heading-right">
              <span className="profissionais-kicker">Resultados</span>
              <h1>Profissionais encontrados</h1>
              <p>Veja contatos e especialidades para decidir quem pode apoiar melhor cada família, criança ou estudante.</p>
            </div>

            <div className="profissionais-list">
              {!loading && resultados.length === 0 && !feedback && (
                <p>Nenhum profissional encontrado.</p>
              )}

              {resultados.map((p) => (
                <div key={p.id} className="prof-card">
                  <h3>{p.nome}</h3>
                  <span><strong>Especialidade:</strong> {p.especialidade}</span>
                  <span><strong>Endereço:</strong> {p.endereco}</span>

                  {p.telefone && (
                    <>
                      <span><strong>Telefone:</strong> {p.telefone}</span>
                      <a
                        className="whatsapp-btn"
                        href={`https://wa.me/${p.telefone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Conversar no WhatsApp
                      </a>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>

        </main>
      </div>
    </div>
  );
};

export default Profissionais;
