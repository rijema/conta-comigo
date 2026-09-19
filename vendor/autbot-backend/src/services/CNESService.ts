import axios from 'axios';
import https from 'https';

interface FindProfessionalParams {
  cidade?: string;
  estado?: string;
  especialidade?: string;
}

export class CNESService {
  
  // Agente para ignorar SSL inválido
  private httpsAgent = new https.Agent({  
    rejectUnauthorized: false,
    keepAlive: true
  });

  private async getCodigoIbge(cidade: string, estado: string): Promise<string | null> {
    try {
      const response = await axios.get(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/municipios`);
      const listaCidades = response.data;
      
      const cidadeEncontrada = listaCidades.find((item: any) => {
        const nomeItem = item.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const nomeBusca = cidade.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return nomeItem === nomeBusca;
      });

      if (cidadeEncontrada) {
        return String(cidadeEncontrada.id).substring(0, 6);
      }
      return null;
    } catch (error) {
      console.error("Erro IBGE:", error);
      return null;
    }
  }

  async execute({ cidade, estado, especialidade }: FindProfessionalParams) {
    if (!cidade || !estado) {
      throw new Error("Cidade/Estado obrigatórios.");
    }

    console.log(`Procurand0 CNES para: ${cidade}/${estado}`);

    const codigoIbge = await this.getCodigoIbge(cidade, estado);
    if (!codigoIbge) return [];

    try {
      // URL usada pelo portal público
      const urlCNES = `https://cnes.datasus.gov.br/services/estabelecimentos?municipio=${codigoIbge}`;
      
      const response = await axios.get(urlCNES, {
        // Cabeçalhos para parecer um navegador Chrome real acessando o site do governo
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Referer': 'https://cnes.datasus.gov.br/pages/estabelecimentos/consulta.jsp',
          'Origin': 'https://cnes.datasus.gov.br',
          'Host': 'cnes.datasus.gov.br',
          'Connection': 'keep-alive',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin'
        },
        httpsAgent: this.httpsAgent
      });

      const listaCompleta = response.data;

      let estabelecimentos = listaCompleta.map((item: any) => {
        const logradouro = item.logradouro || "";
        const numero = item.numero || "S/N";
        const bairro = item.bairro || "";
        
        return {
          id: String(item.coCnes),
          nome: item.noFantasia || item.noEmpresarial || "Unidade de Saúde",
          endereco: `${logradouro}, ${numero} - ${bairro}`,
          telefone: item.telefone,
          especialidade: item.dsTipoUnidade || "Saúde",
          sus: item.tpGestao === 'M' ? 'SUS' : 'Privado'
        };
      });

      // Filtro na memória
      if (especialidade) {
        const termo = especialidade.toLowerCase();
        estabelecimentos = estabelecimentos.filter((est: any) => 
          est.nome.toLowerCase().includes(termo) || 
          est.especialidade.toLowerCase().includes(termo)
        );
      }

      return estabelecimentos.slice(0, 50);

    } catch (error: any) {
      if (error.response?.status === 503 || error.response?.status === 403) {
        console.error(" BLOQUEIO DO GOVERNO DETECTADO: O DataSUS recusou a conexão.");
      } else {
        console.error("Erro CNES:", error.message);
      }
      return [];
    }
  }
}