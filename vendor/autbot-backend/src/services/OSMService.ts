import axios from 'axios';

interface FindProfessionalParams {
  cidade?: string;
  estado?: string;
  especialidade?: string;
}

export class OSMService {
  async execute({ cidade, estado, especialidade }: FindProfessionalParams) {
    
    const termo = `${especialidade || 'Saúde'}, ${cidade}, ${estado}`;

    console.log(` Buscando no OpenStreetMap: "${termo}"`);

    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: termo,
          format: 'json',
          addressdetails: 1,
          limit: 30, 
        },
        headers: {
          'User-Agent': 'AutBot-Student-Project/1.0'
        }
      });

      const resultados = response.data;

      const profissionais = resultados.map((item: any) => ({
        id: String(item.place_id),
        // Pegamos o nome. Se não tiver nome  usa tipo do local
        nome: item.name || item.type || "Local sem nome", 
        endereco: item.display_name,
        especialidade: especialidade || item.type || "Hospital",
        telefone: null
      }));

      return profissionais.filter((p: any) => p.nome !== "Local sem nome");

    } catch (error) {
      console.error("Erro no OpenStreetMap:", error);
      return [];
    }
  }
}