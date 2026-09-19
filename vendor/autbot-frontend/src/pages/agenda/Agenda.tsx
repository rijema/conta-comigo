import { useState, useEffect } from 'react';
import axios from 'axios';
import SharedTopBar from "../../components/topbar/SharedTopBar";
import './Agenda.css';

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

  useEffect(() => {
    const fetchLembretes = async () => {
      try {
        const res = await axios.get('/api/lembretes');
        setLembretes(res.data);
      } catch (err) {
        console.error('Erro ao carregar lembretes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLembretes();
  }, []);

  const handleAdicionarLembrete = async () => {
    if (!titulo || !data) return alert('Preencha o título e a data.');

    try {
      const res = await axios.post('/api/lembretes', {
        titulo,
        descricao,
        data,
        horaInicio,
        horaFim,
      });
      setLembretes([res.data, ...lembretes]);
      setTitulo('');
      setDescricao('');
      setData('');
      setHoraInicio('');
      setHoraFim('');
    } catch (err) {
      console.error('Erro ao adicionar lembrete:', err);
    }
  };

  const handleRemoverLembrete = async (id: number) => {
    try {
      await axios.delete(`/api/lembretes/${id}`);
      setLembretes(lembretes.filter((l) => l.id !== id));
    } catch (err) {
      console.error('Erro ao remover lembrete:', err);
    }
  };

  return (
    <div className="agenda-page-container">
            <SharedTopBar pageType='agenda' />
      <div className="agenda-content-area">
        <div className="main-agenda">
          <div className="agenda-left">
            <h1>Adicionar Lembrete</h1>

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

              <button className="agenda-button" onClick={handleAdicionarLembrete}>
                Adicionar
              </button>
            </div>
          </div>

          <div className="agenda-right">
            <h1>Meus Lembretes</h1>

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
