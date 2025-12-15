/**
 * Serviço de análise qualitativa com IA
 * 
 * Utiliza modelos de linguagem para analisar comentários textuais
 * das avaliações e gerar insights acionáveis.
 */

import type { Avaliacao, AnaliseQualitativa, Loja } from '@/types';
import { filtrarAvaliacoesPorEscopo } from './analyticsService';

/**
 * Configuração do serviço de IA
 */
interface AIServiceConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
}

class AIAnalysisService {
  private config: Required<AIServiceConfig>;

  constructor(config: AIServiceConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.OPENAI_API_KEY || '',
      model: config.model || 'gpt-4-turbo-preview',
      temperature: config.temperature ?? 0.7,
    };
  }

  /**
   * Gera análise qualitativa para nível macro (rede/região/estado)
   */
  async analisarMacro(
    avaliacoes: Avaliacao[],
    lojas: Loja[],
    escopo: 'rede' | `regiao:${string}` | `estado:${string}`
  ): Promise<AnaliseQualitativa> {
    const comentarios = avaliacoes
      .filter((av) => av.comentario && av.comentario.trim().length > 0)
      .map((av) => av.comentario!)
      .slice(0, 500); // Limita para não exceder tokens

    if (comentarios.length === 0) {
      return this.criarAnaliseVazia('macro', escopo);
    }

    const prompt = this.criarPromptMacro(comentarios, escopo);
    const resposta = await this.chamarIA(prompt);

    return this.parserRespostaMacro(resposta, escopo);
  }

  /**
   * Gera análise qualitativa para nível micro (loja individual)
   */
  async analisarMicro(
    avaliacoes: Avaliacao[],
    loja: Loja
  ): Promise<AnaliseQualitativa> {
    const comentarios = avaliacoes
      .filter((av) => av.comentario && av.comentario.trim().length > 0)
      .map((av) => av.comentario!)
      .slice(0, 500);

    if (comentarios.length === 0) {
      return this.criarAnaliseVazia('micro', `loja:${loja.id}`);
    }

    const prompt = this.criarPromptMicro(comentarios, loja);
    const resposta = await this.chamarIA(prompt);

    return this.parserRespostaMicro(resposta, loja.id);
  }

  /**
   * Cria prompt para análise macro
   */
  private criarPromptMacro(
    comentarios: string[],
    escopo: string
  ): string {
    return `Você é um analista especializado em avaliar o desempenho de lojas físicas de varejo esportivo.

Analise os seguintes comentários de clientes sobre lojas da Centauro ${escopo === 'rede' ? 'em toda a rede' : `na ${escopo}`}.

Comentários dos clientes:
${comentarios.map((c, i) => `${i + 1}. "${c}"`).join('\n')}

Gere uma análise estruturada com os seguintes elementos:

1. **Pontos Fortes** (até 5 itens): Principais aspectos positivos mencionados pelos clientes
2. **Pontos Fracos** (até 5 itens): Principais problemas ou reclamações recorrentes
3. **Tendências** (até 3 itens): Padrões de satisfação/insatisfação identificados
4. **Oportunidades** (até 4 itens): Sugestões práticas de melhorias

Responda APENAS em formato JSON válido, sem markdown, seguindo este formato exato:
{
  "pontosFortes": ["item1", "item2", ...],
  "pontosFracos": ["item1", "item2", ...],
  "tendencias": ["item1", "item2", ...],
  "oportunidades": ["item1", "item2", ...]
}`;
  }

  /**
   * Cria prompt para análise micro
   */
  private criarPromptMicro(comentarios: string[], loja: Loja): string {
    return `Você é um consultor especializado em análise de experiência do cliente em lojas físicas.

Analise os comentários de clientes sobre a loja "${loja.nome}" (${loja.cidade}, ${loja.estado}).

Comentários dos clientes:
${comentarios.map((c, i) => `${i + 1}. "${c}"`).join('\n')}

Gere uma análise detalhada e acionável com os seguintes elementos:

1. **Resumo** (1 parágrafo): Visão geral da percepção dos clientes sobre esta loja
2. **Pontos Fortes** (até 5 itens): Destaques positivos específicos desta loja
3. **Pontos Fracos** (até 5 itens): Problemas específicos mencionados
4. **Reclamações Frequentes** (até 5 itens): Reclamações que aparecem múltiplas vezes
5. **Destaques Positivos** (até 3 itens): Aspectos únicos que os clientes valorizam
6. **Planos de Ação** (até 4 itens): Ações práticas e específicas para melhorar

Responda APENAS em formato JSON válido, sem markdown, seguindo este formato exato:
{
  "resumo": "texto do resumo",
  "pontosFortes": ["item1", "item2", ...],
  "pontosFracos": ["item1", "item2", ...],
  "reclamacoesFrequentes": ["item1", "item2", ...],
  "destaquesPositivos": ["item1", "item2", ...],
  "planosAcao": ["item1", "item2", ...]
}`;
  }

  /**
   * Chama o serviço de IA (OpenAI ou similar)
   */
  private async chamarIA(prompt: string): Promise<string> {
    if (!this.config.apiKey) {
      console.warn('⚠️ OPENAI_API_KEY não configurada. Retornando análise mockada.');
      return this.getMockResponse();
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: 'Você é um analista especializado em experiência do cliente e análise de avaliações de lojas físicas. Sempre responda em formato JSON válido.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: this.config.temperature,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '{}';
    } catch (error) {
      console.error('Erro ao chamar serviço de IA:', error);
      return this.getMockResponse();
    }
  }

  /**
   * Resposta mockada para desenvolvimento sem API key
   */
  private getMockResponse(): string {
    return JSON.stringify({
      pontosFortes: [
        'Atendimento rápido e eficiente',
        'Boa variedade de produtos esportivos',
        'Ambiente organizado e limpo',
      ],
      pontosFracos: [
        'Falta de estoque em alguns tamanhos',
        'Fila de caixa em horários de pico',
        'Preços podem ser mais competitivos',
      ],
      tendencias: [
        'Clientes valorizam atendimento personalizado',
        'Insatisfação relacionada a disponibilidade de produtos',
      ],
      oportunidades: [
        'Implementar sistema de reserva online',
        'Expandir horário de atendimento',
        'Programa de fidelidade mais visível',
      ],
    });
  }

  /**
   * Parseia resposta macro
   */
  private parserRespostaMacro(
    respostaJson: string,
    escopo: string
  ): AnaliseQualitativa {
    try {
      const data = JSON.parse(respostaJson);

      return {
        nivel: 'macro',
        escopo,
        pontosFortes: Array.isArray(data.pontosFortes) ? data.pontosFortes : [],
        pontosFracos: Array.isArray(data.pontosFracos) ? data.pontosFracos : [],
        tendencias: Array.isArray(data.tendencias) ? data.tendencias : [],
        oportunidades: Array.isArray(data.oportunidades) ? data.oportunidades : [],
        geradoEm: new Date(),
      };
    } catch (error) {
      console.error('Erro ao parsear resposta da IA:', error);
      return this.criarAnaliseVazia('macro', escopo);
    }
  }

  /**
   * Parseia resposta micro
   */
  private parserRespostaMicro(
    respostaJson: string,
    lojaId: string
  ): AnaliseQualitativa {
    try {
      const data = JSON.parse(respostaJson);

      return {
        nivel: 'micro',
        escopo: `loja:${lojaId}`,
        pontosFortes: Array.isArray(data.pontosFortes) ? data.pontosFortes : [],
        pontosFracos: Array.isArray(data.pontosFracos) ? data.pontosFracos : [],
        tendencias: [],
        oportunidades: Array.isArray(data.planosAcao) ? data.planosAcao : [],
        resumo: data.resumo || '',
        reclamacoesFrequentes: Array.isArray(data.reclamacoesFrequentes)
          ? data.reclamacoesFrequentes
          : [],
        destaquesPositivos: Array.isArray(data.destaquesPositivos)
          ? data.destaquesPositivos
          : [],
        planosAcao: Array.isArray(data.planosAcao) ? data.planosAcao : [],
        geradoEm: new Date(),
      };
    } catch (error) {
      console.error('Erro ao parsear resposta da IA:', error);
      return this.criarAnaliseVazia('micro', `loja:${lojaId}`);
    }
  }

  /**
   * Cria análise vazia quando não há dados
   */
  private criarAnaliseVazia(
    nivel: 'macro' | 'micro',
    escopo: string
  ): AnaliseQualitativa {
    return {
      nivel,
      escopo,
      pontosFortes: [],
      pontosFracos: [],
      tendencias: [],
      oportunidades: [],
      geradoEm: new Date(),
    };
  }
}

// Exporta instância singleton
export const aiAnalysisService = new AIAnalysisService();

/**
 * Função helper para gerar análise conforme escopo
 */
export async function gerarAnaliseQualitativa(
  avaliacoes: Avaliacao[],
  lojas: Loja[],
  escopo: {
    lojaId?: string;
    regiao?: string;
    estado?: string;
  }
): Promise<AnaliseQualitativa> {
  const avaliacoesFiltradas = filtrarAvaliacoesPorEscopo(
    avaliacoes,
    lojas,
    escopo
  );

  if (escopo.lojaId) {
    const loja = lojas.find((l) => l.id === escopo.lojaId);
    if (!loja) {
      throw new Error(`Loja ${escopo.lojaId} não encontrada`);
    }
    return aiAnalysisService.analisarMicro(avaliacoesFiltradas, loja);
  } else if (escopo.estado) {
    return aiAnalysisService.analisarMacro(
      avaliacoesFiltradas,
      lojas,
      `estado:${escopo.estado}`
    );
  } else if (escopo.regiao) {
    return aiAnalysisService.analisarMacro(
      avaliacoesFiltradas,
      lojas,
      `regiao:${escopo.regiao}`
    );
  } else {
    return aiAnalysisService.analisarMacro(
      avaliacoesFiltradas,
      lojas,
      'rede'
    );
  }
}

