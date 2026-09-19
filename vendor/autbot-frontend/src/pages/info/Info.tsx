import SharedTopBar from "../../components/topbar/SharedTopBar";
import "./Info.css";
import AutbotImage from '../../assets/Autbot_Image.png';

const Info = () => {
  return (
    <div className="info-container">
      <SharedTopBar pageType="info" />

      <main className="info-main">
        <div className="info-body">

          <div className="info-image-wrapper">
            <img
              src={AutbotImage}
              alt="Imagem sobre o AutBot"
              className="info-image"
            />
          </div>

          <div className="info-card">
            <h2><strong>Sobre o AutBot</strong></h2>
            <p>
              AutBot é um chatbot pensado para apoiar pessoas que convivem com o
              Transtorno do Espectro Autista (TEA). Criamos esse espaço
              acessível e acolhedor para que familiares, educadores, colegas de
              trabalho e interessados possam tirar dúvidas e encontrar
              informações claras e confiáveis sobre o autismo. Com base em
              documentos oficiais, guias educacionais e legislações, o AutBot
              oferece respostas sobre temas do dia a dia relacionados ao TEA,
              promovendo mais compreensão, empatia e autonomia. Nosso objetivo é
              facilitar o acesso à informação de forma respeitosa, segura e
              acessível — tudo isso por meio de uma conversa simples com o
              chatbot.
            </p>
            <a href="#">Clique aqui para saber como usar o chatbot!</a>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Info;
