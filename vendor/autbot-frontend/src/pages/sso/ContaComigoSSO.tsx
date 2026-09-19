import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useBrand } from "../../contexts/BrandContext";

const apiUrl = import.meta.env.VITE_API_URL;
const requestedBrandFromStorage =
  typeof window !== "undefined" ? localStorage.getItem("brand") : null;

export default function ContaComigoSSO() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const { appName, assistantName, logoSrc, footerText, brand: activeBrand } = useBrand();

  const token = searchParams.get("token");
  const requestedBrand = useMemo(() => searchParams.get("brand") || "titia", [searchParams]);
  const runtimeBrand = useMemo(() => localStorage.getItem("brand") || "autbot", []);
  const addLog = (message: string) => {
    console.log("[ContaComigoSSO]", message);
    setDebugLogs((current) => [...current, message]);
  };

  useEffect(() => {
    addLog("Tela SSO carregada.");
    addLog(`BrandContext ativo: ${activeBrand}.`);
    addLog(`Brand salvo no navegador antes da troca: ${runtimeBrand}.`);
    addLog(`VITE_API_URL: ${apiUrl || "ausente"}`);
    addLog(`Query token presente: ${token ? "sim" : "não"}`);
    addLog(`Query brand: ${requestedBrand}`);

    const exchange = async () => {
      if (!token) {
        addLog("Fluxo interrompido: token ausente na URL.");
        setError("Token de acesso não informado.");
        return;
      }

      if (!apiUrl) {
        addLog("Fluxo interrompido: VITE_API_URL ausente neste build.");
        setError("VITE_API_URL não está configurada no frontend da TitiA.");
        return;
      }

      try {
        addLog(`Chamando integração em ${apiUrl}/auth/exchange/conta-comigo`);
        const response = await axios.post(`${apiUrl}/auth/exchange/conta-comigo`, {
          token,
        });

        addLog(`HTTP ${response.status} recebido da integração.`);
        addLog(`Chaves da resposta: ${Object.keys(response.data ?? {}).join(", ") || "nenhuma"}`);
        addLog(`Payload bruto: ${JSON.stringify(response.data ?? null)}`);

        if (!response.data || Array.isArray(response.data) || typeof response.data !== "object") {
          addLog("Falha: resposta recebida não é um objeto JSON de sessão.");
          throw new Error("A integração retornou um formato inválido.");
        }

        const authToken = response.data?.token;
        const userId =
          response.data?.user?.id ??
          response.data?.userId ??
          response.data?.decoded?.userId;

        if (!authToken) {
          addLog("Falha: resposta não trouxe token.");
          throw new Error("Token de autenticação não retornado pela integração.");
        }

        if (!userId) {
          addLog("Falha: resposta não trouxe user id.");
          throw new Error("ID do usuário não retornado pela integração.");
        }

        addLog(`Token recebido com ${authToken.length} caracteres.`);
        addLog(`User ID resolvido: ${userId}`);
        localStorage.setItem("authToken", authToken);
        localStorage.setItem("id", userId);
        localStorage.setItem("userId", userId);
        localStorage.setItem("brand", requestedBrand);
        addLog(`Brand salvo no navegador após troca: ${requestedBrand}`);
        addLog("Redirecionando para /chat.");

        navigate("/chat", { replace: true });
      } catch (reason: any) {
        addLog(
          `Erro capturado: ${reason?.message || "desconhecido"}`
        );
        if (reason?.response) {
          addLog(`HTTP de erro: ${reason.response.status}`);
          addLog(`Body de erro: ${JSON.stringify(reason.response.data ?? null)}`);
        }
        setError(
          reason?.response?.data?.message ||
            reason?.message ||
            "Não foi possível abrir a TitiA."
        );
      }
    };

    exchange();
  }, [activeBrand, navigate, requestedBrand, runtimeBrand, token]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #fff7ed 0%, #fdf2f8 45%, #eef2ff 100%)",
        padding: "2rem",
      }}
    >
      <div
        style={{
          width: "min(920px, 100%)",
          borderRadius: "32px",
          background: "rgba(255,255,255,0.92)",
          boxShadow: "0 24px 80px rgba(76, 29, 149, 0.16)",
          padding: "2rem",
          border: "1px solid rgba(192, 132, 252, 0.28)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <img
            src={requestedBrand === "titia" ? "/AutBot_Logo.png" : logoSrc}
            alt={`${appName} logo`}
            style={{ width: "72px", height: "72px", objectFit: "contain", borderRadius: "20px", background: "#fff" }}
          />
          <div>
            <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.24em", textTransform: "uppercase", color: "#d946ef" }}>
              Chat now with TitiA
            </p>
            <h1 style={{ color: "#4c1d95", margin: "0.25rem 0 0 0" }}>
              {error ? "Falha ao abrir a TitiA" : `Abrindo ${assistantName}...`}
            </h1>
          </div>
        </div>

        <p style={{ color: "#475569", marginTop: 0 }}>
          {error || "Conectando sua sessão do Conta Comigo ao AutBot."}
        </p>

        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            borderRadius: "20px",
            background: "#faf5ff",
            border: "1px solid #e9d5ff",
          }}
        >
          <h2 style={{ marginTop: 0, color: "#581c87", fontSize: "1rem" }}>Diagnóstico da integração</h2>
          <div style={{ display: "grid", gap: "0.5rem", color: "#475569", fontSize: "0.9rem" }}>
            <div><strong>BrandContext:</strong> {activeBrand}</div>
            <div><strong>Brand salvo no navegador:</strong> {runtimeBrand}</div>
            <div><strong>Brand no boot do app:</strong> {requestedBrandFromStorage || "ausente"}</div>
            <div><strong>Query brand:</strong> {requestedBrand}</div>
            <div><strong>Token na URL:</strong> {token ? "presente" : "ausente"}</div>
            <div><strong>VITE_API_URL:</strong> {apiUrl || "ausente"}</div>
            <div><strong>Logo ativa:</strong> {requestedBrand === "titia" ? "/AutBot_Logo.png" : logoSrc}</div>
            <div><strong>Footer configurado:</strong> {requestedBrand === "titia" ? "Constructed under AutBot - a free software." : footerText || "ausente"}</div>
          </div>
        </div>

        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            borderRadius: "20px",
            background: "#0f172a",
            color: "#e2e8f0",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "0.85rem",
            maxHeight: "320px",
            overflow: "auto",
            textAlign: "left",
          }}
        >
          {debugLogs.length === 0 ? (
            <div>Aguardando logs...</div>
          ) : (
            debugLogs.map((log, index) => (
              <div key={`${index}-${log}`} style={{ marginBottom: "0.5rem", whiteSpace: "pre-wrap" }}>
                [{index + 1}] {log}
              </div>
            ))
          )}
        </div>

        {requestedBrand === "titia" || footerText ? (
          <div style={{ marginTop: "1rem", textAlign: "center", color: "#7c3aed", fontSize: "0.9rem", fontWeight: 600 }}>
            {requestedBrand === "titia" ? "Constructed under AutBot - a free software." : footerText}
          </div>
        ) : null}
      </div>
    </div>
  );
}
