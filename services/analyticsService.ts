/**
 * Serviço de análise quantitativa de avaliações
 */

import type {
  Avaliacao,
  MetricasQuantitativas,
  DistribuicaoNotas,
  RankingLoja,
  FiltrosDashboard,
  Loja,
} from '@/types';
import { format, startOfDay, subDays } from 'date-fns';

/**
 * Filtra avaliações conforme os filtros do dashboard
 * Nota: Filtros de data foram removidos pois a API retorna apenas as 5 últimas avaliações
 */
export function filtrarAvaliacoes(
  avaliacoes: Avaliacao[],
  filtros: FiltrosDashboard
): Avaliacao[] {
  // Retorna todas as avaliações (sem filtro de data)
  // A filtragem por loja/região/estado é feita em outro lugar
  return avaliacoes;
}

/**
 * Calcula distribuição de notas
 */
export function calcularDistribuicao(avaliacoes: Avaliacao[]): DistribuicaoNotas {
  const distribuicao: DistribuicaoNotas = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  avaliacoes.forEach((av) => {
    distribuicao[av.nota] = (distribuicao[av.nota] || 0) + 1;
  });

  return distribuicao;
}

/**
 * Calcula nota média
 */
export function calcularNotaMedia(avaliacoes: Avaliacao[]): number {
  if (avaliacoes.length === 0) return 0;

  const soma = avaliacoes.reduce((acc, av) => acc + av.nota, 0);
  return Number((soma / avaliacoes.length).toFixed(2));
}

/**
 * Calcula métricas quantitativas completas
 */
export function calcularMetricas(
  avaliacoes: Avaliacao[],
  periodo: 'dia' | 'semana' | 'mes' = 'dia'
): MetricasQuantitativas {
  if (avaliacoes.length === 0) {
    return {
      notaMedia: 0,
      totalAvaliacoes: 0,
      distribuicao: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      notaMediaPorPeriodo: [],
    };
  }

  const distribuicao = calcularDistribuicao(avaliacoes);
  const notaMedia = calcularNotaMedia(avaliacoes);

  // Agrupa avaliações por período
  const agrupadas = new Map<string, Avaliacao[]>();

  avaliacoes.forEach((av) => {
    let chave: string;
    const data = startOfDay(av.data);

    switch (periodo) {
      case 'dia':
        chave = format(data, 'yyyy-MM-dd');
        break;
      case 'semana':
        chave = format(data, 'yyyy-ww');
        break;
      case 'mes':
        chave = format(data, 'yyyy-MM');
        break;
      default:
        chave = format(data, 'yyyy-MM-dd');
    }

    if (!agrupadas.has(chave)) {
      agrupadas.set(chave, []);
    }
    agrupadas.get(chave)!.push(av);
  });

  const notaMediaPorPeriodo = Array.from(agrupadas.entries())
    .map(([data, avs]) => ({
      data,
      notaMedia: calcularNotaMedia(avs),
      total: avs.length,
    }))
    .sort((a, b) => a.data.localeCompare(b.data));

  return {
    notaMedia,
    totalAvaliacoes: avaliacoes.length,
    distribuicao,
    notaMediaPorPeriodo,
  };
}

/**
 * Gera ranking de lojas
 */
export function gerarRanking(
  avaliacoes: Avaliacao[],
  lojas: Loja[],
  tipo: 'melhores' | 'piores' = 'melhores',
  limite: number = 10
): RankingLoja[] {
  const lojaMap = new Map(lojas.map((loja) => [loja.id, loja]));

  // Agrupa avaliações por loja
  const avaliacoesPorLoja = new Map<string, Avaliacao[]>();
  avaliacoes.forEach((av) => {
    if (!avaliacoesPorLoja.has(av.loja_id)) {
      avaliacoesPorLoja.set(av.loja_id, []);
    }
    avaliacoesPorLoja.get(av.loja_id)!.push(av);
  });

  // Calcula métricas por loja
  const rankings: RankingLoja[] = [];

  avaliacoesPorLoja.forEach((avs, lojaId) => {
    const loja = lojaMap.get(lojaId);
    if (!loja) return;

    const notaMedia = calcularNotaMedia(avs);
    const totalAvaliacoes = avs.length;

    if (totalAvaliacoes === 0) return;

    rankings.push({
      loja_id: lojaId,
      nome: loja.nome,
      codigo: loja.codigo,
      estado: loja.estado,
      regiao: loja.regiao,
      notaMedia,
      totalAvaliacoes,
      posicao: 0, // Será definido após ordenação
    });
  });

  // Ordena por nota média (desempate por total de avaliações)
  rankings.sort((a, b) => {
    if (Math.abs(a.notaMedia - b.notaMedia) < 0.01) {
      return b.totalAvaliacoes - a.totalAvaliacoes;
    }
    return b.notaMedia - a.notaMedia;
  });

  // Define posições
  rankings.forEach((ranking, index) => {
    ranking.posicao = index + 1;
  });

  // Retorna melhores ou piores conforme solicitado
  if (tipo === 'piores') {
    return rankings.reverse().slice(0, limite);
  }

  return rankings.slice(0, limite);
}

/**
 * Filtra avaliações por loja, região ou estado
 */
export function filtrarAvaliacoesPorEscopo(
  avaliacoes: Avaliacao[],
  lojas: Loja[],
  escopo: {
    lojaId?: string;
    regiao?: string;
    estado?: string;
    regional?: string;
  }
): Avaliacao[] {
  let lojasFiltradas = lojas;

  if (escopo.lojaId) {
    lojasFiltradas = lojasFiltradas.filter((l) => l.id === escopo.lojaId);
  } else {
    // Aplica filtros em cascata
    if (escopo.regiao) {
      lojasFiltradas = lojasFiltradas.filter((l) => l.regiao === escopo.regiao);
    }
    if (escopo.estado) {
      lojasFiltradas = lojasFiltradas.filter((l) => l.estado === escopo.estado);
    }
    if (escopo.regional) {
      lojasFiltradas = lojasFiltradas.filter((l) => l.time === escopo.regional);
    }
  }

  const lojaIds = new Set(lojasFiltradas.map((l) => l.id));

  return avaliacoes.filter((av) => lojaIds.has(av.loja_id));
}

