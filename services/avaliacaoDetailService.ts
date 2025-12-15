/**
 * Serviço para enriquecer avaliações individuais com categoria e sentimento
 */

import type { Avaliacao, Sentimento, CategoriaComentario, Loja } from '@/types';
import { classificarSentimento } from './sentimentAnalysisService';
import { formatarNomeLoja } from '@/lib/lojaUtils';

/**
 * Categoriza um comentário individual baseado em palavras-chave
 */
export function categorizarComentario(comentario: string): CategoriaComentario {
  if (!comentario || comentario.trim().length === 0) {
    return 'Outros';
  }

  const comentarioLower = comentario.toLowerCase();

  // Atendimento
  if (
    comentarioLower.includes('atendimento') ||
    comentarioLower.includes('funcionário') ||
    comentarioLower.includes('vendedor') ||
    comentarioLower.includes('vendedora') ||
    comentarioLower.includes('equipe') ||
    comentarioLower.includes('pessoal') ||
    comentarioLower.includes('atendente') ||
    comentarioLower.includes('atenderam') ||
    comentarioLower.includes('atenderam') ||
    comentarioLower.includes('ajudaram') ||
    comentarioLower.includes('cordial') ||
    comentarioLower.includes('prestativo') ||
    comentarioLower.includes('educado')
  ) {
    return 'Atendimento';
  }

  // Ambiente
  if (
    comentarioLower.includes('ambiente') ||
    comentarioLower.includes('loja') && (comentarioLower.includes('limpa') || comentarioLower.includes('organizada') || comentarioLower.includes('arrumada')) ||
    comentarioLower.includes('limpeza') ||
    comentarioLower.includes('organização') ||
    comentarioLower.includes('organizado') ||
    comentarioLower.includes('estrutura') ||
    comentarioLower.includes('local') ||
    comentarioLower.includes('espaço')
  ) {
    return 'Ambiente';
  }

  // Tempo de Espera
  if (
    comentarioLower.includes('espera') ||
    comentarioLower.includes('esperar') ||
    comentarioLower.includes('fila') ||
    comentarioLower.includes('demora') ||
    comentarioLower.includes('rápido') ||
    comentarioLower.includes('rapidez') ||
    comentarioLower.includes('lento') ||
    comentarioLower.includes('demorou') ||
    comentarioLower.includes('demorado')
  ) {
    return 'Tempo de Espera';
  }

  // Produtos
  if (
    comentarioLower.includes('produto') ||
    comentarioLower.includes('qualidade') ||
    comentarioLower.includes('variedade') ||
    comentarioLower.includes('estoque') ||
    comentarioLower.includes('marca') ||
    comentarioLower.includes('tamanho') ||
    comentarioLower.includes('tamanhos') ||
    comentarioLower.includes('disponível') ||
    comentarioLower.includes('disponibilidade') ||
    comentarioLower.includes('opções') ||
    comentarioLower.includes('opcao')
  ) {
    return 'Produtos';
  }

  // Preços
  if (
    comentarioLower.includes('preço') ||
    comentarioLower.includes('preco') ||
    comentarioLower.includes('valor') ||
    comentarioLower.includes('caro') ||
    comentarioLower.includes('barato') ||
    comentarioLower.includes('promoção') ||
    comentarioLower.includes('promocao') ||
    comentarioLower.includes('desconto') ||
    comentarioLower.includes('competitivo') ||
    comentarioLower.includes('econômico') ||
    comentarioLower.includes('economico')
  ) {
    return 'Preços';
  }

  // Se não se encaixar em nenhuma categoria, retorna "Outros"
  return 'Outros';
}

/**
 * Enriquece uma avaliação com categoria e sentimento
 */
export interface AvaliacaoEnriquecida extends Avaliacao {
  categoria: CategoriaComentario;
  sentimento: Sentimento;
  nomeLoja?: string;
}

export function enriquecerAvaliacao(avaliacao: Avaliacao, nomeLoja?: string): AvaliacaoEnriquecida {
  const sentimento = classificarSentimento(avaliacao.nota);
  const categoria = avaliacao.comentario
    ? categorizarComentario(avaliacao.comentario)
    : 'Outros';

  return {
    ...avaliacao,
    categoria,
    sentimento,
    nomeLoja,
  };
}

/**
 * Enriquece múltiplas avaliações
 */
export function enriquecerAvaliacoes(
  avaliacoes: Avaliacao[],
  lojas: Loja[] | Array<{ id: string; nome: string; codigo?: string }>
): AvaliacaoEnriquecida[] {
  const lojasMap = new Map(
    lojas.map((l) => {
      // Se for objeto Loja completo, usa formatarNomeLoja, senão formata manualmente
      if ('codigo' in l || 'estado' in l) {
        const lojaCompleta = l as Loja;
        return [lojaCompleta.id, formatarNomeLoja(lojaCompleta)];
      } else {
        const lojaSimples = l as { id: string; nome: string; codigo?: string };
        const nomeFormatado = lojaSimples.codigo
          ? `${lojaSimples.codigo} - ${lojaSimples.nome}`
          : lojaSimples.nome;
        return [lojaSimples.id, nomeFormatado];
      }
    })
  );

  return avaliacoes.map((av) => {
    const nomeLoja = lojasMap.get(av.loja_id);
    return enriquecerAvaliacao(av, nomeLoja);
  });
}
