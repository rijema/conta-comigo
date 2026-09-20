import { useState, useEffect } from 'react';
import axios from 'axios';
import SharedTopBar from "../../components/topbar/SharedTopBar";
import './Agenda.css';

const apiUrl = import.meta.env.VITE_API_URL;

interface Lembrete {
  id: number;
  titulo: string;
  descricao: string;
  data: string;
  horaInicio?: string;
  horaFim?: string;
}

const Agenda = () => {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim, setHoraFim] = useState('');
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchLembretes = async () => {
      try {
        const res = await axios.get(`${apiUrl}/lembretes`);
        setLembretes(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Erro ao carregar lembretes:', err);
        setLembretes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLembretes();
  }, []);

  const handleAdicionarLembrete = async () => {
    if (!titulo || !data) {
      setFeedback("Preencha o título e a data para salvar o lembrete.");
      return;
    }

    try {
      setSubmitting(true);
      setFeedback("");
      const res = await axios.post(`${apiUrl}/lembretes`, {
        titulo,
        descricao,
        data,
        horaInicio,
        horaFim,
      });
      setLembretes((current) => [res.data, ...current]);
      setTitulo('');
      setDescricao('');
      setData('');
      setHoraInicio('');
      setHoraFim('');
      setFeedback("Lembrete salvo com sucesso.");
    } catch (err) {
      console.error('Erro ao adicionar lembrete:', err);
      setFeedback("Não foi possível salvar o lembrete agora.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoverLembrete = async (id: number) => {
    try {
      await axios.delete(`${apiUrl}/lembretes/${id}`);
      setLembretes((current) => current.filter((l) => l.id !== id));
      setFeedback("Lembrete removido.");
    } catch (err) {
      console.error('Erro ao remover lembrete:', err);
      setFeedback("Não foi possível remover esse lembrete.");
    }
  };

  return (
    <div className="agenda-page-container">
            <SharedTopBar pageType='agenda' />
      <div className="agenda-content-area">
        <div className="main-agenda">
          <div className="agenda-left">
            <div className="agenda-section-heading">
              <span className="agenda-kicker">Organização da rotina</span>
              <h1>Agenda da TitiA</h1>
              <p>Registre consultas, tarefas e combinados importantes para acompanhar a rotina com clareza.</p>
            </div>

            <div className="agenda-card">
              <div className="agenda-textfield">
                <label>Título *</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Digite o título do lembrete"
                />
              </div>

              <div className="agenda-textfield">
                <label>Descrição</label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Detalhes opcionais"
                />
              </div>

              <div className="agenda-textfield">
                <label>Data *</label>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                />
              </div>

              <div className="agenda-time-fields">
                <div className="agenda-textfield half">
                  <label>Hora Início</label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                  />
                </div>

                <div className="agenda-textfield half">
                  <label>Hora Fim</label>
                  <input
                    type="time"
                    value={horaFim}
                    onChange={(e) => setHoraFim(e.target.value)}
                  />
                </div>
              </div>

              <button className="agenda-button" onClick={handleAdicionarLembrete} disabled={submitting}>
                {submitting ? "Salvando..." : "Adicionar lembrete"}
              </button>

              {feedback && <p className="agenda-feedback">{feedback}</p>}
            </div>
          </div>

          <div className="agenda-right">
            <div className="agenda-section-heading agenda-section-heading-right">
              <span className="agenda-kicker">Visão rápida</span>
              <h1>Próximos lembretes</h1>
              <p>Veja o que já foi salvo e mantenha tudo acessível para a família e os profissionais.</p>
            </div>

            <div className="agenda-list">
              {loading ? (
                <p>Carregando...</p>
              ) : lembretes.length === 0 ? (
                <p>Nenhum lembrete encontrado.</p>
              ) : (
                lembretes.map((l) => (
                  <div className="lembrete-card" key={l.id}>
                    <h3>{l.titulo}</h3>
                    <span>
                      {new Date(l.data).toLocaleDateString('pt-BR')}
                      {l.horaInicio && ` — ${l.horaInicio}`}
                      {l.horaFim && ` às ${l.horaFim}`}
                    </span>
                    {l.descricao && <p>{l.descricao}</p>}
                    <button
                      className="remover-btn"
                      onClick={() => handleRemoverLembrete(l.id)}
                    >
                      Remover
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Agenda;
