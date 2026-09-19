import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

export async function getTopFaqQuestions(): Promise<string[]> {
  const token = localStorage.getItem("authToken");

  if (!token) {
    throw new Error("Usuário não autenticado. Token não encontrado.");
  }

  const response = await axios.get(`${apiUrl}/faq`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = response.data as { question: string }[];

  return data.map((item) => item.question);
}
