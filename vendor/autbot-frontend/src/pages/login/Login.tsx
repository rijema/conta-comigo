import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { loginUser } from "../../service/Login";
import SharedTopBar from "../../components/topbar/SharedTopBar";
import { useBrand } from "../../contexts/BrandContext";

const Login = () => {
  const [userName, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { appName, assistantName } = useBrand();

  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await loginUser({ email: userName, password });

      localStorage.setItem("authToken", response.token);
      localStorage.setItem("userId", response.user.id);
      localStorage.setItem("id", response.user.id);

      navigate("/chat");
    } catch (error) {
      console.error("Erro ao realizar login:", error);
      setError("Erro ao conectar ao servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <SharedTopBar pageType="login" />
      <main className="login-content-area">
        <form onSubmit={handleSubmit} className="login-form">
          <div className="main-login">
            <div className="left-login">
              <h1>
                Bem-vindo ao {appName}!
                <br />
                Seu apoio acessível sobre TEA
              </h1>
              <img src="AutBot_Image.png" alt={assistantName} />
            </div>

            <div className="right-login">
              <div className="card-login">
                <h1>LOGIN</h1>

                {error && <p className="error-message">{error}</p>}

                <div className="textfield">
                  <label htmlFor="usuario">E-mail</label>
                  <input
                    type="text"
                    name="usuario"
                    placeholder="Digite seu e-mail"
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                <div className="textfield">
                  <label htmlFor="senha">Senha</label>
                  <input
                    type="password"
                    name="senha"
                    placeholder="Senha"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button
                  className="botao-login"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? <div className="spinner"></div> : "Login"}
                </button>
                <button
                  type="button"
                  className="botao-esqueci-senha"
                  onClick={() => navigate("/recuperar-senha")}
                >
                  Esqueci minha senha
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Login;
