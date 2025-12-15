/**
 * Serviço para enriquecer análises com dados adicionais
 * Preenche destaques, problemas e outros campos que requerem análise de texto
 */

import type { Avaliacao, Loja } from '@/types';
import type { AnaliseRegiao } from './advancedAnalyticsService';
import { analisarLojaProfundamente } from './lojaAnalysisService';

/**
 * Enriquece análise de região com destaques das lojas
 */
export function enriquecerAnaliseRegiao(
  analise: AnaliseRegiao,
  avaliacoes: Avaliacao[]
): AnaliseRegiao {
  // Enriquece top lojas com destaques baseados nos comentários
  const analiseEnriquecida = {
    ...analise,
    topLojas: analise.topLojas.map((topLoja) => {
      const avaliacoesLoja = avaliacoes.filter((av) => av.loja_id === topLoja.loja.id);
      const comentarios = avaliacoesLoja
        .filter((av) => av.comentario && av.nota >= 4)
        .map((av) => av.comentario!.toLowerCase());

      const destaques: string[] = [];

      // Identifica destaques baseados em keywords
      if (comentarios.some((c) => c.includes('atendimento') && (c.includes('bom') || c.includes('excelente')))) {
        destaques.push('Atendimento destacado');
      }
      if (comentarios.some((c) => c.includes('variedade') || c.includes('opções'))) {
        destaques.push('Boa variedade de produtos');
      }
      if (comentarios.some((c) => c.includes('preço') && (c.includes('bom') || c.includes('competitivo')))) {
        destaques.push('Preços competitivos');
      }
      if (comentarios.some((c) => c.includes('organizado') || c.includes('limpo'))) {
        destaques.push('Ambiente organizado');
      }
      if (comentarios.some((c) => c.includes('troca') && (c.includes('fácil') || c.includes('aceita')))) {
        destaques.push('Facilidade de trocas');
      }
      if (comentarios.some((c) => c.includes('estoque') && c.includes('bom'))) {
        destaques.push('Bom estoque');
      }

      // Se não encontrou destaques, adiciona um genérico baseado na nota
      if (destaques.length === 0) {
        if (topLoja.notaMedia >= 4.5) {
          destaques.push('Excelente avaliação geral');
        } else if (topLoja.notaMedia >= 4.3) {
          destaques.push('Avaliações muito positivas');
        } else {
          destaques.push('Boa performance');
        }
      }

      return {
        ...topLoja,
        destaques,
      };
    }),
  };

  // Enriquece pior loja com problemas
  if (analiseEnriquecida.piorLoja) {
    const avaliacoesPiorLoja = avaliacoes.filter(
      (av) => av.loja_id === analiseEnriquecida.piorLoja!.loja.id
    );
    const comentarios = avaliacoesPiorLoja
      .filter((av) => av.comentario && av.nota <= 3)
      .map((av) => av.comentario!.toLowerCase());

    const problemas: string[] = [];

    if (comentarios.some((c) => c.includes('atendimento') && (c.includes('ruim') || c.includes('péssimo')))) {
      problemas.push('Atendimento problemático');
    }
    if (comentarios.some((c) => c.includes('preço') && (c.includes('caro') || c.includes('alto')))) {
      problemas.push('Preços elevados');
    }
    if (comentarios.some((c) => c.includes('estoque') && (c.includes('falta') || c.includes('sem')))) {
      problemas.push('Falta de estoque');
    }
    if (comentarios.some((c) => c.includes('erro') || c.includes('não entregou'))) {
      problemas.push('Erros operacionais');
    }
    if (comentarios.some((c) => c.includes('política') && (c.includes('ruim') || c.includes('restritiva')))) {
      problemas.push('Políticas restritivas');
    }

    if (problemas.length === 0) {
      problemas.push('Necessita melhorias');
    }

    analiseEnriquecida.piorLoja = {
      ...analiseEnriquecida.piorLoja,
      problemas,
    };
  }

  return analiseEnriquecida;
}

/**
 * Enriquece anomalias com aspectos detalhados
 */
export function enriquecerAnomalias(
  anomalias: Array<{
    loja: Loja;
    notaMedia: number;
    mediaGeral: number;
    gap: number;
    severidade: 'CRÍTICA 💀' | 'ALTA ⚠️' | 'MÉDIA ⚠️';
    motivos: string[];
    aspectos: any;
    padrao?: string;
    conclusao: string;
  }>,
  avaliacoes: Avaliacao[]
) {
  return anomalias.map((anomalia) => {
    const analiseProfunda = analisarLojaProfundamente(
      avaliacoes.filter((av) => av.loja_id === anomalia.loja.id),
      anomalia.loja
    );

    return {
      ...anomalia,
      aspectos: analiseProfunda.aspectos,
      padrao: analiseProfunda.padrao,
      conclusao: analiseProfunda.conclusao,
    };
  });
}

