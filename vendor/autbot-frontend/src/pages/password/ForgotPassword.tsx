import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ForgotPassword.css";
import SharedTopBar from "../../components/topbar/SharedTopBar";
import { PasswordModal } from "../../components/modal/PasswordModal";
import AutbotImage from '../../assets/Autbot_Image.png';


const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");
    setShowModal(false);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao enviar e-mail de recuperação.");
      }

      setMessage(data.message || "Se esse e-mail estiver cadastrado, você receberá um link para redefinir sua senha.");
      setShowModal(true);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro. Por favor, tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="forgot-password-page-container">
      <SharedTopBar pageType="login" />
      <main className="forgot-password-content-area">
        <form onSubmit={handleSubmit} className="forgot-password-form">
          <div className="main-forgot-password">
             <div className="left-forgot-password">
              <h1>
                Bem-vindo ao AutBot!
                <br />
                Seu apoio acessível sobre TEA
              </h1>
              <img src={AutbotImage} alt="AutBot" />
            </div>

            <div className="right-forgot-password">
              <div className="card-forgot-password">
                <h1>Esqueceu sua senha?</h1>
                <p>Digite seu endereço de e-mail e você receberá um link para redefinir sua senha.</p>

                {error && <p className="error-message">{error}</p>}

                <div className="textfield">
                  <label htmlFor="email">E-mail</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="Digite seu e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <button className="botao-forgot-password" type="submit" disabled={isLoading}>
                  {isLoading ? <div className="spinner"></div> : "Enviar"}
                </button>
              </div>
            </div>
          </div>
        </form>

        <PasswordModal isOpen={showModal} onClose={closeModal} title="Recuperação de Senha">
          {message}
        </PasswordModal>
      </main>
    </div>
  );
};

export default ForgotPassword;
