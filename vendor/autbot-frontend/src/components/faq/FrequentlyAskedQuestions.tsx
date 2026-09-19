import { useEffect, useState } from "react";
import { getTopFaqQuestions } from "../../service/Faq"; 

interface FrequentlyAskedQuestionsProps {
  onQuestionClick: (questionText: string) => void;
}

const FrequentlyAskedQuestions: React.FC<FrequentlyAskedQuestionsProps> = ({ onQuestionClick }) => {
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const data = await getTopFaqQuestions();
        setQuestions(data);
      } catch (err) {
        setError("Erro ao carregar perguntas frequentes.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  return (
    <div className="faq-container">
      <h3 className="faq-title">Perguntas Frequentes</h3>

      {loading && <p>Carregando...</p>}
      {error && <p className="error-message">{error}</p>}

      {!loading && !error && (
        <div className="faq-list">
          {questions.map((question, index) => (
            <button
              key={index}
              className="faq-button"
              onClick={() => onQuestionClick(question)}
            >
              {question}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FrequentlyAskedQuestions;
