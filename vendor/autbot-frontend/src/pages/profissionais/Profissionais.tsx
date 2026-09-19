import { useState } from "react";
import axios from "axios";
import "./Profissionais.css";
import SharedTopBar from "../../components/topbar/SharedTopBar";

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

  const buscarProfissionais = async () => {
    if (!cidade || !estado) {
      alert("Cidade e Estado são obrigatórios!");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.get("api/profissionais", {
        params: {
          cidade,
          estado,
          especialidade,
        },
      });

      setResultados(res.data);
    } catch (error) {
      console.log(error);
      alert("Erro ao buscar profissionais.");
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
            <h1>Buscar Profissionais</h1>
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
            </div>
          </section>

          <section className="profissionais-right">
            <h1>Resultados</h1>

            <div className="profissionais-list">
              {!loading && resultados.length === 0 && (
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
