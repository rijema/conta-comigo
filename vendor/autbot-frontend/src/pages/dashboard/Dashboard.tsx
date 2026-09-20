import { useEffect, useState } from "react";
import SharedTopBar from "../../components/topbar/SharedTopBar";
import { getDashboardStats } from "../../service/Dashboard";
import BarChartDashboard from "../../components/BarChartDashboard";
import "./Dashboard.css";

interface DashboardData {
    totalUsuarios: number;
    totalChats: number;
    mensagensEnviadas?: number;
    usuariosAtivosHoje?: number;
}
export default function Dashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const result = await getDashboardStats();
                setData(result);
            } catch (err) {
                console.error(err);
                setError("Erro ao carregar estatísticas do dashboard.");
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    return (
        <div className="dashboard-page">
            <SharedTopBar pageType="dashboard" />
            <div className="dashboard-content">
                <div className="dashboard-hero">
                    <span className="dashboard-kicker">Visão geral</span>
                    <h1 className="dashboard-title">Painel da TitiA</h1>
                    <p className="dashboard-subtitle">
                        Acompanhe rapidamente uso, conversas e atividade recente com uma leitura mais clara e acolhedora.
                    </p>
                </div>

                {loading && <p className="dashboard-status">Carregando indicadores...</p>}
                {error && <p className="dashboard-error">{error}</p>}

                {data && (
                    <div className="dashboard-grid-layout">
                        <div className="dashboard-cards">
                            <div className="dashboard-card">
                                <span className="dashboard-card-accent dashboard-card-accent-users" />
                                <p className="card-label">Total de Usuários</p>
                                <h2 className="card-value">{data.totalUsuarios}</h2>
                            </div>
                            <div className="dashboard-card">
                                <span className="dashboard-card-accent dashboard-card-accent-chats" />
                                <p className="card-label">Total de Chats</p>
                                <h2 className="card-value">{data.totalChats}</h2>
                            </div>
                            <div className="dashboard-card">
                                <span className="dashboard-card-accent dashboard-card-accent-messages" />
                                <p className="card-label">Mensagens Enviadas</p>
                                <h2 className="card-value">{data.mensagensEnviadas || 0}</h2>
                            </div>
                            <div className="dashboard-card">
                                <span className="dashboard-card-accent dashboard-card-accent-active" />
                                <p className="card-label">Usuários Ativos Hoje</p>
                                <h2 className="card-value">{data.usuariosAtivosHoje || 0}</h2>
                            </div>
                        </div>

                        <div className="dashboard-chart-area">
                            <h2 className="chart-title">Estatísticas Gerais</h2>
                            <BarChartDashboard
                                totalUsuarios={data.totalUsuarios}
                                totalChats={data.totalChats}
                                totalMensagens={data.mensagensEnviadas || 0}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}