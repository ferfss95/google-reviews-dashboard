/**
 * Serviço de integração com o Google Maps Places API
 * 
 * Este serviço utiliza a biblioteca oficial @googlemaps/google-maps-services-js
 * para buscar detalhes de lugares e avaliações via Google Places API.
 * 
 * Configure a variável de ambiente GOOGLE_MAPS_API_KEY com sua chave da API.
 */

import { Client } from '@googlemaps/google-maps-services-js';
import type { MapsPlaceDetails, MapsReview, Avaliacao, Loja } from '@/types';

/**
 * Interface para o cliente do Maps
 */
interface MapsMCPClient {
  getPlaceDetails(placeId: string): Promise<MapsPlaceDetails>;
}

/**
 * Cliente usando Google Places API oficial
 */
class GooglePlacesAPIClient implements MapsMCPClient {
  private client: Client;
  private apiKey: string;

  constructor(apiKey: string) {
    this.client = new Client({});
    this.apiKey = apiKey;
  }

  async getPlaceDetails(placeId: string): Promise<MapsPlaceDetails> {
    try {
      const response = await this.client.placeDetails({
        params: {
          place_id: placeId,
          fields: [
            'place_id',
            'name',
            'formatted_address',
            'rating',
            'user_ratings_total',
            'reviews',
          ],
          language: 'pt-BR', // Português do Brasil
          key: this.apiKey,
        },
      });

      const place = response.data.result;

      return {
        place_id: place.place_id || placeId,
        name: place.name,
        formatted_address: place.formatted_address,
        rating: place.rating,
        user_ratings_total: place.user_ratings_total,
        reviews: place.reviews?.map((review) => ({
          author_name: review.author_name || 'Anônimo',
          author_url: review.author_url,
          language: review.language || 'pt-BR',
          profile_photo_url: review.profile_photo_url,
          rating: review.rating || 0,
          relative_time_description: review.relative_time_description || '',
          text: review.text || '',
          time: review.time || Math.floor(Date.now() / 1000),
        })) || [],
      };
    } catch (error: any) {
      console.error(`Erro ao buscar place_id ${placeId}:`, error);
      throw new Error(
        `Falha ao buscar dados do Google Places API: ${error.message || error}`
      );
    }
  }
}

/**
 * Cliente mock para desenvolvimento/teste (usado quando API key não está configurada)
 */
class MockMapsMCPClient implements MapsMCPClient {
  async getPlaceDetails(placeId: string): Promise<MapsPlaceDetails> {
    console.warn(
      '⚠️ Usando cliente mock do Maps. Configure GOOGLE_MAPS_API_KEY para usar dados reais.'
    );

    // Gera dados mock variados
    const ratings = [4.0, 4.2, 4.5, 4.7, 4.8];
    const rating = ratings[Math.floor(Math.random() * ratings.length)];

    return {
      place_id: placeId,
      name: 'Centauro Mock Store',
      formatted_address: 'Endereço simulado',
      rating: rating,
      user_ratings_total: Math.floor(Math.random() * 200) + 50,
      reviews: [
        {
          author_name: 'Cliente Teste 1',
          rating: 5,
          text: 'Excelente atendimento e variedade de produtos esportivos.',
          time: Math.floor(Date.now() / 1000) - 86400,
          relative_time_description: 'há 1 dia',
          language: 'pt-BR',
        },
        {
          author_name: 'Cliente Teste 2',
          rating: 4,
          text: 'Loja bem organizada, mas faltou alguns tamanhos no estoque.',
          time: Math.floor(Date.now() / 1000) - 172800,
          relative_time_description: 'há 2 dias',
          language: 'pt-BR',
        },
        {
          author_name: 'Cliente Teste 3',
          rating: 5,
          text: 'Atendimento excepcional e produtos de qualidade.',
          time: Math.floor(Date.now() / 1000) - 259200,
          relative_time_description: 'há 3 dias',
          language: 'pt-BR',
        },
      ],
    };
  }
}

class MapsMCPService {
  private client: MapsMCPClient;
  private cache: Map<string, { data: MapsPlaceDetails; timestamp: number }>;
  private readonly CACHE_TTL = 3600000; // 1 hora em ms

  constructor() {
    // Tenta usar Google Places API se a chave estiver configurada
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (apiKey && apiKey.trim() !== '') {
      console.log('✅ Usando Google Places API (dados reais)');
      this.client = new GooglePlacesAPIClient(apiKey);
    } else {
      console.warn(
        '⚠️ GOOGLE_MAPS_API_KEY não configurada. Usando dados mock.'
      );
      this.client = new MockMapsMCPClient();
    }

    this.cache = new Map();
  }

  /**
   * Inicializa o cliente MCP real (chamar quando MCP estiver configurado)
   */
  setClient(client: MapsMCPClient) {
    this.client = client;
  }

  /**
   * Busca detalhes de um lugar pelo place_id
   */
  async getPlaceDetails(placeId: string, useCache = true): Promise<MapsPlaceDetails> {
    const cacheKey = `place:${placeId}`;

    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }
    }

    try {
      const details = await this.client.getPlaceDetails(placeId);
      
      if (useCache) {
        this.cache.set(cacheKey, {
          data: details,
          timestamp: Date.now(),
        });
      }

      return details;
    } catch (error) {
      console.error(`Erro ao buscar detalhes do place_id ${placeId}:`, error);
      throw new Error(`Falha ao buscar dados do Maps: ${error}`);
    }
  }

  /**
   * Extrai avaliações de um lugar e normaliza para o formato interno
   */
  async getAvaliacoesFromPlace(
    placeId: string,
    lojaId: string
  ): Promise<Avaliacao[]> {
    const details = await this.getPlaceDetails(placeId);
    
    if (!details.reviews || details.reviews.length === 0) {
      return [];
    }

    return details.reviews.map((review, index) => ({
      id: `${placeId}-${review.time}-${index}`,
      loja_id: lojaId,
      place_id: placeId,
      data: new Date(review.time * 1000),
      nota: review.rating as 1 | 2 | 3 | 4 | 5,
      comentario: review.text || undefined,
      autor: review.author_name,
      autor_url: review.author_url,
      data_avaliacao_maps: new Date(review.time * 1000),
    }));
  }

  /**
   * Processa itens em lotes com limite de concorrência
   */
  private async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    concurrency: number = 5,
    delayMs: number = 200
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += concurrency) {
      const batch = items.slice(i, i + concurrency);
      const batchPromises = batch.map((item) =>
        processor(item).catch((error) => {
          console.error(`Erro ao processar item:`, error);
          return null as R;
        })
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter((r) => r !== null));
      
      // Delay entre lotes para evitar rate limiting
      if (i + concurrency < items.length) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    
    return results;
  }

  /**
   * Busca avaliações para múltiplas lojas com processamento em lotes
   * 
   * Otimizações aplicadas:
   * - Processamento em lotes de 5 lojas por vez
   * - Delay de 200ms entre lotes
   * - Timeout de 10s por requisição
   * - Tratamento robusto de erros
   */
  async getAvaliacoesFromLojas(lojas: Loja[]): Promise<Avaliacao[]> {
    if (lojas.length === 0) {
      return [];
    }

    console.log(`🔄 Buscando avaliações de ${lojas.length} lojas...`);

    // Processa em lotes de 5 lojas por vez (evita rate limiting)
    const avaliacoesPorLoja = await this.processBatch(
      lojas,
      async (loja) => {
        try {
          // Timeout de 10 segundos por loja
          const timeoutPromise = new Promise<Avaliacao[]>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 10000)
          );
          
          const avaliacoesPromise = this.getAvaliacoesFromPlace(loja.place_id, loja.id);
          
          const avaliacoes = await Promise.race([avaliacoesPromise, timeoutPromise]);
          return avaliacoes;
        } catch (error: any) {
          console.warn(
            `⚠️ Não foi possível buscar avaliações da loja ${loja.nome} (${loja.id}): ${error.message}`
          );
          return [] as Avaliacao[];
        }
      },
      5, // 5 requisições simultâneas por vez
      200 // 200ms de delay entre lotes
    );

    const todasAvaliacoes = avaliacoesPorLoja.flat();
    
    console.log(`✅ Busca concluída: ${todasAvaliacoes.length} avaliações encontradas de ${lojas.length} lojas`);
    
    return todasAvaliacoes;
  }

  /**
   * Limpa o cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Limpa entradas antigas do cache
   */
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }
}

// Exporta instância singleton
export const mapsMcpService = new MapsMCPService();

/**
 * Função helper para inicializar um cliente customizado
 * Útil se você quiser usar outro cliente além do padrão
 * 
 * Exemplo de uso:
 * 
 * import { initializeMapsMCP } from '@/services/mapsMcpService';
 * 
 * const customClient: MapsMCPClient = {
 *   async getPlaceDetails(placeId: string) {
 *     // Sua implementação customizada
 *   }
 * };
 * 
 * initializeMapsMCP(customClient);
 */
export function initializeMapsMCP(client: MapsMCPClient) {
  mapsMcpService.setClient(client);
}

