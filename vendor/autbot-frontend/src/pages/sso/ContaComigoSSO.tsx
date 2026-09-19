import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

export default function ContaComigoSSO() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const token = searchParams.get("token");
  const brand = useMemo(() => searchParams.get("brand") || "titia", [searchParams]);

  useEffect(() => {
    const exchange = async () => {
      if (!token) {
        setError("Token de acesso não informado.");
        return;
      }

      try {
        const response = await axios.post(`${apiUrl}/auth/exchange/conta-comigo`, {
          token,
        });

        localStorage.setItem("authToken", response.data.token);
        localStorage.setItem("id", response.data.user.id);
        localStorage.setItem("userId", response.data.user.id);
        localStorage.setItem("brand", brand);

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
  }, [brand, navigate, token]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background:
          "linear-gradient(135deg, #fff7ed 0%, #fdf2f8 45%, #eef2ff 100%)",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <div>
        <h1 style={{ color: "#4c1d95" }}>{error ? "Falha ao abrir a TitiA" : "Abrindo a TitiA..."}</h1>
        <p style={{ color: "#475569" }}>
          {error || "Conectando sua sessão do Conta Comigo ao AutBot."}
        </p>
      </div>
    </div>
  );
}
