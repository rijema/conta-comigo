import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Register.css";
import SharedTopBar from "../../components/topbar/SharedTopBar";
import { Modal } from "../../components/modal/Modal";
import { useBrand } from "../../contexts/BrandContext";

const Register = () => {
  const navigate = useNavigate();

  const [userName, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [userType, setUserType] = useState("");
  const [dataConsent, setDataConsent] = useState(false);

  const [userNameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [userTypeError, setUserTypeError] = useState("");
  const [dataConsentError, setDataConsentError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const { appName, assistantName } = useBrand();

  const today = new Date().toISOString().split("T")[0];

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (value.length < 3) {
      setUsernameError("O nome de usuário deve ter no mínimo 3 caracteres!");
    } else {
      setUsernameError("");
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value.length < 5 || !emailRegex.test(value)) {
      setEmailError("O e-mail digitado é inválido!");
    } else {
      setEmailError("");
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value.length < 6) {
      setPasswordError("A senha deve ter no mínimo 6 caracteres!");
    } else {
      setPasswordError("");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    let hasError = false;

    if (!userName) {
      setUsernameError("Nome é obrigatório");
      hasError = true;
    }

    if (!email) {
      setEmailError("E-mail é obrigatório");
      hasError = true;
    }

    if (!password) {
      setPasswordError("Senha é obrigatória");
      hasError = true;
    }

    if (!userType) {
      setUserTypeError("Tipo de usuário é obrigatório");
      hasError = true;
    } else {
      setUserTypeError("");
    }

    if (!dataConsent) {
      setDataConsentError("Você deve aceitar o consentimento de dados");
      hasError = true;
    } else {
      setDataConsentError("");
    }

    if (!hasError && !userNameError && !emailError && !passwordError) {
      try {
        const [year, month, day] = birthDate.split("-");
        const formattedBirthDate = `${day}-${month}-${year}`;

        const requestData = {
          email,
          password,
          name: userName,
          birthDate: formattedBirthDate,
          userType,
          dataConsent,
        };

        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/users`,
          requestData
        );

        const data = response.data;

        alert(data.mensagem || "Cadastro realizado com sucesso!");
        navigate("/");
      } catch (error: any) {
        console.error("Erro ao cadastrar:", error);
        if (error.response?.data?.mensagem) {
          alert(error.response.data.mensagem);
        }
      }
    } else {
      console.log("Preencha os campos solicitados corretamente!");
    }
  };

  return (
    <div className="cadastro-page-container">
      <SharedTopBar pageType="register" />
      <main className="cadastro-content-area">
        <form onSubmit={handleSubmit} className="cadastro-form">
          <div className="main-cadastro">
            <div className="left-cadastro">
              <h1>
                Que bom ter você aqui!
                <br />
                Cadastre-se para explorar o {appName}
              </h1>
              <img src="AutBot_Image.png" alt={assistantName} />
            </div>

            <div className="right-cadastro">
              <div className="card-cadastro">
                <h1>CADASTRO</h1>

                <div className="textfield">
                  <label htmlFor="usuario">Nome</label>
                  <input
                    type="text"
                    name="usuario"
                    placeholder="Usuário"
                    onChange={(e) => handleUsernameChange(e.target.value)}
                  />
                  {userNameError && (
                    <p className="error-message">{userNameError}</p>
                  )}
                </div>

                <div className="textfield">
                  <label htmlFor="email">E-mail</label>
                  <input
                    type="text"
                    name="email"
                    placeholder="E-mail"
                    onChange={(e) => handleEmailChange(e.target.value)}
                  />
                  {emailError && <p className="error-message">{emailError}</p>}
                </div>

                <div className="textfield">
                  <label htmlFor="senha">Senha</label>
                  <input
                    type="password"
                    name="senha"
                    placeholder="Senha"
                    onChange={(e) => handlePasswordChange(e.target.value)}
                  />
                  {passwordError && (
                    <p className="error-message">{passwordError}</p>
                  )}
                </div>

                <div className="textfield">
                  <label htmlFor="data">Data de Nascimento</label>
                  <input
                    type="date"
                    name="data"
                    placeholder="Data de Nascimento"
                    max={today}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>

                <div className="textfield">
                  <label htmlFor="userType">Tipo de Usuário</label>
                  <select
                    name="userType"
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    <option value="CUIDADOR">Cuidador</option>
                    <option value="PROFESSOR">Professor</option>
                    <option value="RESPONSAVEL">Responsável</option>
                    <option value="TEA_NIVEL_1">TEA Nível 1</option>
                    <option value="TEA_NIVEL_2">TEA Nível 2</option>
                    <option value="TEA_NIVEL_3">TEA Nível 3</option>
                    <option value="USUARIO">Usuário Geral</option>
                  </select>
                  {userTypeError && (
                    <p className="error-message">{userTypeError}</p>
                  )}
                </div>

                <div className="textfield checkbox-consent">
                  <label>
                    <input
                      type="checkbox"
                      checked={dataConsent}
                      onChange={(e) => setDataConsent(e.target.checked)}
                    />{" "}
                    Concordo com o tratamento dos meus dados pessoais{" "}
                    <span
                      onClick={() => setModalOpen(true)}
                      style={{
                        textDecoration: "underline",
                        color: "#0f1236",
                        cursor: "pointer",
                        fontWeight: "600",
                      }}
                      title="Leia o termo completo"
                    >
                      (Leia o termo)
                    </span>
                  </label>
                  {dataConsentError && (
                    <p className="error-message">{dataConsentError}</p>
                  )}
                </div>

                <button className="botao-cadastro" type="submit">
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};

export default Register;
