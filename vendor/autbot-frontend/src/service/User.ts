import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;

export interface UserData {
  id: string;
  name: string;
  userType: string;
  email: string; 
}

export interface UpdateUserDataInput {
  name: string;
  email: string;
  userType: string;
}

export async function fetchUserData(userId: string): Promise<UserData | null> {
  const authToken = localStorage.getItem("authToken");
  if (!authToken) {
    console.error("Token de autenticação não encontrado no localStorage.");
    return null;
  }

  if (!apiUrl) {
    console.error("Variável de ambiente VITE_API_URL não configurada.");
    return null;
  }

  try {
    const response = await axios.get<UserData>(`${apiUrl}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error(
        `Erro ao buscar dados do usuário: ${error.response?.status} ${error.response?.statusText}`
      );
    } else {
      console.error("Erro inesperado na requisição:", error);
    }
    return null;
  }
}

export async function updateUserData(
  userId: string,
  updates: UpdateUserDataInput
): Promise<UserData | null> {
  const authToken = localStorage.getItem("authToken");
  if (!authToken) {
    console.error("Token de autenticação não encontrado no localStorage.");
    return null;
  }

  if (!apiUrl) {
    console.error("Variável de ambiente VITE_API_URL não configurada.");
    return null;
  }

  try {
    const response = await axios.put<UserData>(
      `${apiUrl}/users/${userId}`,
      updates,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error(
        `Erro ao atualizar dados do usuário: ${error.response?.status} ${error.response?.statusText}`
      );
    } else {
      console.error("Erro inesperado na requisição:", error);
    }
    return null;
  }
}
