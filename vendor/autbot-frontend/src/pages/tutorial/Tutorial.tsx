import { useState } from "react";
import "./Tutorial.css";
import SharedTopBar from "../../components/topbar/SharedTopBar";


interface Slide {
    text: string;
}

const slides: Slide[] = [
    {
        text: "Digite sua dúvida ou tema sobre o Transtorno do Espectro Autista (TEA). Ex.: Como ajudar meu filho na escola? Quais são os direitos legais das pessoas com TEA?",
    },
    {
        text: "Clique no ícone de enviar para que o AutBot possa responder à sua pergunta! Pronto! É só aguardar a resposta com informações.",
    },
    {
        text: "Após a resposta do AutBot, você pode copiá-la, avaliá-la como útil ou não e seguir perguntando sobre seus direitos ou outros temas relacionados ao TEA.",
    },
    {
        text: "Você pode clicar no ícone de lupa, localizado acima, para pesquisar seus chats anteriores de forma rápida e prática. Também é possível iniciar um novo chat clicando na opção “Novo chat” ou selecionar uma das conversas recentes exibidas na lista.",
    },
];

const Tutorial = () => {

    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = () => {
        if (currentIndex < slides.length - 1) setCurrentIndex(currentIndex + 1);
    };

    const prevSlide = () => {
        if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    };

    return (
        <div className="tutorial-page-container"> {/* Renomeado para clareza */}
            <SharedTopBar pageType="tutorial" />
            <main className="tutorial-content-area"> {/* Wrapper para o conteúdo principal */}
                <div className="manual-carousel">
                    <h2>Como usar o AutBot?</h2>
                    <div className="slide">
                        <p>{slides[currentIndex].text}</p>
                    </div>
                    <div className="controls">
                        <button onClick={prevSlide} disabled={currentIndex === 0}>
                            ◀
                        </button>
                        <button onClick={nextSlide} disabled={currentIndex === slides.length - 1}>
                            ▶
                        </button>
                    </div>
                    <div className="dots">
                        {slides.map((_, i) => (
                            <span key={i} className={i === currentIndex ? "active" : ""}>●</span>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Tutorial;
