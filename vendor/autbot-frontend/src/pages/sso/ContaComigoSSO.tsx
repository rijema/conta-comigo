import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useBrand } from "../../contexts/BrandContext";

const apiUrl = import.meta.env.VITE_API_URL;

export default function ContaComigoSSO() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const { assistantName, logoSrc } = useBrand();

  const token = searchParams.get("token");
  const requestedBrand = useMemo(
    () => searchParams.get("brand") || "titia",
    [searchParams],
  );

  useEffect(() => {
    const exchange = async () => {
      if (!token) {
        setError("Token de acesso não informado.");
        return;
      }

      if (!apiUrl) {
        setError("A conexão com a TitiA não está configurada neste ambiente.");
        return;
      }

      try {
        const response = await axios.post(`${apiUrl}/auth/exchange/conta-comigo`, {
          token,
        });

        if (!response.data || typeof response.data !== "object" || Array.isArray(response.data)) {
          throw new Error("A integração retornou um formato inválido.");
        }

        const authToken = response.data?.token;
        const userId =
          response.data?.user?.id ??
          response.data?.userId ??
          response.data?.decoded?.userId;

        if (!authToken) {
          throw new Error("Token de autenticação não retornado pela integração.");
        }

        if (!userId) {
          throw new Error("ID do usuário não retornado pela integração.");
        }

        localStorage.setItem("authToken", authToken);
        localStorage.setItem("id", userId);
        localStorage.setItem("userId", userId);
        localStorage.setItem("brand", requestedBrand);

        navigate("/chat", { replace: true });
      } catch (reason: any) {
        setError(
          reason?.response?.data?.message ||
            reason?.message ||
            "Não foi possível abrir a TitiA."
        );
      }
    };

    exchange();
  }, [navigate, requestedBrand, token]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #eef8ff 0%, #f7f0ff 50%, #ffffff 100%)",
        padding: "2rem",
      }}
    >
      <div
        style={{
          width: "min(560px, 100%)",
          borderRadius: "32px",
          background: "rgba(255,255,255,0.94)",
          boxShadow: "0 24px 80px rgba(15, 23, 42, 0.12)",
          padding: "2rem",
          border: "1px solid rgba(125, 211, 252, 0.3)",
          textAlign: "center",
        }}
      >
        <img
          src={logoSrc}
          alt={`${assistantName} logo`}
          style={{
            width: "72px",
            height: "72px",
            objectFit: "contain",
            margin: "0 auto 1rem",
          }}
        />
        <h1 style={{ color: "#0f172a", marginBottom: "0.5rem" }}>
          {error ? "Não foi possível abrir a TitiA" : `Preparando ${assistantName}...`}
        </h1>
        <p style={{ color: "#64748b", margin: 0 }}>
          {error || "Conectando sua sessão do Conta Comigo à TitiA."}
        </p>
        <p style={{ color: "rgba(109, 40, 217, 0.58)", marginTop: "1rem", fontSize: "0.9rem", fontWeight: 700 }}>
          TitiA (made with AutBot)
        </p>
      </div>
    </div>
  );
}
