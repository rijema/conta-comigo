import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SharedTopBar from "../../components/topbar/SharedTopBar";
import { PasswordModal } from "../../components/modal/PasswordModal";
import "./ForgotPassword.css";
import AutbotImage from '../../assets/Autbot_Image.png';

const ResetPassword = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (!token) {
      setError("Token de redefinição inválido ou ausente.");
      return;
    }

    setIsLoading(true);
    setMessage("");
    setError("");
    setShowModal(false);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/reset-password/${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao redefinir a senha.");
      }

      setMessage(
        "Senha redefinida com sucesso! Você será redirecionado para o login."
      );
      setShowModal(true);

      setTimeout(() => {
        navigate("/"); 
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao redefinir a senha.");
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
                <h1>ALTERAÇÃO DE SENHA</h1>
                <p>Digite e confirme sua nova senha abaixo.</p>

                {error && <p className="error-message">{error}</p>}

                <div className="textfield">
                  <label htmlFor="password">Nova Senha</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="textfield">
                  <label htmlFor="confirmPassword">Confirmar Nova Senha</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  className="botao-forgot-password"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="spinner"></div>
                  ) : (
                    "Salvar Nova Senha"
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        <PasswordModal
          isOpen={showModal}
          onClose={closeModal}
          title="Alteração de Senha"
        >
          {message}
        </PasswordModal>
      </main>
    </div>
  );
};

export default ResetPassword;
