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
    plugins: {
      legend: { display: false },
    },
  };

  return (
    <div
      style={{
        width: "65%",
        margin: "0 auto",
        background: "#fff",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 0 10px rgba(0,0,0,0.1)"
      }}
    >
      <h3 style={{ textAlign: "center", marginBottom: "20px", color: "#181d54" }}>
        Visão Geral do Sistema
      </h3>

      <Bar data={data} options={options} />
    </div>
  );
}
