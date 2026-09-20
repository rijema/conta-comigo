import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface BarChartDashboardProps {
  totalUsuarios: number;
  totalChats: number;
  totalMensagens: number;
}

export default function BarChartDashboard({
  totalUsuarios,
  totalChats,
  totalMensagens
}: BarChartDashboardProps) {
  const data = {
    labels: ["Usuários", "Chats", "Mensagens"],
    datasets: [
      {
        label: "Totais",
        data: [totalUsuarios, totalChats, totalMensagens],
        backgroundColor: ["#6bb6d9", "#4fa3d1", "#357ca5"],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: "#475569",
          precision: 0,
        },
        grid: {
          color: "rgba(148, 163, 184, 0.18)",
        },
      },
      x: {
        ticks: {
          color: "#334155",
          font: {
            weight: 700,
          },
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div
      style={{
        width: "100%",
        margin: "0 auto",
        background: "linear-gradient(135deg, #f8fbff 0%, #fff7fb 100%)",
        padding: "20px",
        borderRadius: "22px",
        border: "1px solid #dbeafe",
        boxShadow: "0 12px 24px rgba(15, 23, 42, 0.05)",
        minHeight: "360px"
      }}
    >
      <h3 style={{ textAlign: "center", marginBottom: "20px", color: "#1e1b4b" }}>
        Visão Geral do Sistema
      </h3>
      <div style={{ height: "280px" }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
