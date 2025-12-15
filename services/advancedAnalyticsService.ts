/**
 * Serviço de análises avançadas inspirado nas análises apresentadas
 * Inclui: distribuição por nota, análise por região, detecção de anomalias
 */

import type {
  Avaliacao,
  Loja,
  RankingLoja,
  Regiao,
  EstadoUF,
} from '@/types';
import { calcularNotaMedia, gerarRanking } from './analyticsService';

/**
 * Distribuição de notas por loja (quantas lojas têm cada nota média)
 */
export interface DistribuicaoNotasLojas {
  [key: string]: {
    notaMedia: number;
    quantidade: number;
    porcentagem: number;
  };
}

export interface AnaliseRegiao {
  regiao: string;
  mediaGeral: number;
  totalLojas: number;
  status: 'Campeã 🏆' | 'Equilibrada ✅' | 'Inconsistente ⚠️' | 'Problemática ❌';
  topLojas: Array<{
    loja: Loja;
    notaMedia: number;
    totalAvaliacoes: number;
    destaques: string[];
  }>;
  lojasOportunidades: Array<{
    loja: Loja;
    notaMedia: number;
    totalAvaliacoes: number;
    problemas: string[];
  }>;
  piorLoja?: {
    loja: Loja;
    notaMedia: number;
    problemas: string[];
  };
  padrao: 'POSITIVO' | 'NEGATIVO' | 'MISTO';
  padraoDescricao: string;
  excecoes: Array<{
    loja: Loja;
    notaMedia: number;
    motivo: string;
  }>;
  motivo?: string;
}

export interface Anomalia {
  loja: Loja;
  notaMedia: number;
  mediaGeral: number;
  gap: number;
  totalAvaliacoes: number;
  severidade: 'CRÍTICA 💀' | 'ALTA ⚠️' | 'MÉDIA ⚠️';
  motivos: string[];
  aspectos: {
    estrutura?: { status: '✅' | '❌' | '⚠️'; descricao: string };
    atendimento?: { status: '✅' | '❌' | '⚠️'; descricao: string; porcentagemNegativa?: number };
    politicas?: { status: '✅' | '❌' | '⚠️'; descricao: string };
    operacao?: { status: '✅' | '❌' | '⚠️'; descricao: string };
  };
  padrao?: string;
  conclusao: string;
}

/**
 * Calcula distribuição de notas por loja (quantas lojas têm cada nota média)
 */
export function calcularDistribuicaoNotasLojas(
  avaliacoes: Avaliacao[],
  lojas: Loja[]
): DistribuicaoNotasLojas {
  // Calcula nota média por loja
  const notasPorLoja = new Map<string, { soma: number; total: number }>();

  avaliacoes.forEach((av) => {
    if (!notasPorLoja.has(av.loja_id)) {
      notasPorLoja.set(av.loja_id, { soma: 0, total: 0 });
    }
    const atual = notasPorLoja.get(av.loja_id)!;
    atual.soma += av.nota;
    atual.total += 1;
  });

  // Arredonda notas médias para 1 decimal e agrupa
  const distribuicao: { [key: string]: number } = {};
  notasPorLoja.forEach((dados, lojaId) => {
    const notaMedia = Number((dados.soma / dados.total).toFixed(1));
    const chave = notaMedia.toString();
    distribuicao[chave] = (distribuicao[chave] || 0) + 1;
  });

  const totalLojas = Object.values(distribuicao).reduce((acc, val) => acc + val, 0);

  // Converte para formato final
  const resultado: DistribuicaoNotasLojas = {};
  Object.entries(distribuicao).forEach(([nota, quantidade]) => {
    resultado[nota] = {
      notaMedia: parseFloat(nota),
      quantidade,
      porcentagem: totalLojas > 0 ? Number(((quantidade / totalLojas) * 100).toFixed(1)) : 0,
    };
  });

  return resultado;
}

/**
 * Analisa uma região específica
 */
export function analisarRegiao(
  avaliacoes: Avaliacao[],
  lojas: Loja[],
  regiao: Regiao
): AnaliseRegiao {
  const lojasRegiao = lojas.filter((l) => l.regiao === regiao);
  const avaliacoesRegiao = avaliacoes.filter((av) =>
    lojasRegiao.some((l) => l.id === av.loja_id)
  );

  if (lojasRegiao.length === 0) {
    throw new Error(`Nenhuma loja encontrada na região ${regiao}`);
  }

  // Calcula nota média por loja na região
  const notasPorLoja = new Map<string, { soma: number; total: number; loja: Loja }>();

  lojasRegiao.forEach((loja) => {
    notasPorLoja.set(loja.id, { soma: 0, total: 0, loja });
  });

  avaliacoesRegiao.forEach((av) => {
    const dados = notasPorLoja.get(av.loja_id);
    if (dados) {
      dados.soma += av.nota;
      dados.total += 1;
    }
  });

  // Calcula médias
  const lojasComNota: Array<{
    loja: Loja;
    notaMedia: number;
    totalAvaliacoes: number;
  }> = [];

  notasPorLoja.forEach((dados) => {
    if (dados.total > 0) {
      lojasComNota.push({
        loja: dados.loja,
        notaMedia: Number((dados.soma / dados.total).toFixed(2)),
        totalAvaliacoes: dados.total,
      });
    }
  });

  // Ordena por nota média
  lojasComNota.sort((a, b) => b.notaMedia - a.notaMedia);

  // Calcula média geral da região
  const somaTotal = lojasComNota.reduce((acc, item) => acc + item.notaMedia, 0);
  const mediaGeral = lojasComNota.length > 0
    ? Number((somaTotal / lojasComNota.length).toFixed(2))
    : 0;

  // Define status da região
  let status: AnaliseRegiao['status'] = 'Equilibrada ✅';
  if (mediaGeral >= 4.2) status = 'Campeã 🏆';
  else if (mediaGeral < 3.8) status = 'Problemática ❌';
  else if (lojasComNota.some((l) => l.notaMedia < 3.5)) status = 'Inconsistente ⚠️';

  // Classifica todas as lojas
  const mediaGeralCalc = mediaGeral;
  
  // Lojas Nota Destaque (acima ou igual à média)
  const topLojas = lojasComNota
    .filter((item) => item.notaMedia >= mediaGeralCalc - 0.1)
    .map((item) => ({
      ...item,
      destaques: [], // Será preenchido pela análise de IA
    }));

  // Lojas com Oportunidades de Melhoria (abaixo da média, mas não a pior)
  const lojasOportunidades = lojasComNota
    .filter((item) => {
      const isPior = lojasComNota.length > 0 && item.loja.id === lojasComNota[lojasComNota.length - 1].loja.id;
      return item.notaMedia < mediaGeralCalc - 0.1 && !isPior;
    })
    .map((item) => ({
      ...item,
      problemas: [], // Será preenchido pela análise de IA
    }));

  // Pior loja (a que tem a menor nota média)
  const piorLoja = lojasComNota.length > 0 && lojasComNota[lojasComNota.length - 1].notaMedia < 4.0
    ? {
        loja: lojasComNota[lojasComNota.length - 1].loja,
        notaMedia: lojasComNota[lojasComNota.length - 1].notaMedia,
        problemas: [], // Será preenchido pela análise de IA
      }
    : undefined;

  // Identifica padrão
  const lojasAcimaMedia = lojasComNota.filter((l) => l.notaMedia >= mediaGeralCalc).length;
  const porcentagemAcima = (lojasAcimaMedia / lojasComNota.length) * 100;

  let padrao: 'POSITIVO' | 'NEGATIVO' | 'MISTO' = 'MISTO';
  let padraoDescricao = '';

  if (porcentagemAcima >= 70) {
    padrao = 'POSITIVO';
    padraoDescricao = `${regiao} tem as melhores avaliações gerais, com ${lojasAcimaMedia} de ${lojasComNota.length} lojas acima de ${mediaGeralCalc.toFixed(2)} estrelas.`;
  } else if (porcentagemAcima <= 30) {
    padrao = 'NEGATIVO';
    padraoDescricao = `${regiao} tem as piores avaliações e maior variação (${lojasComNota[lojasComNota.length - 1].notaMedia.toFixed(1)} a ${lojasComNota[0].notaMedia.toFixed(1)}).`;
  } else {
    padraoDescricao = `${regiao} apresenta avaliações equilibradas, com variação moderada entre as lojas.`;
  }

  // Identifica exceções (lojas que destoam significativamente)
  const excecoes: AnaliseRegiao['excecoes'] = [];
  lojasComNota.forEach((item) => {
    const diff = Math.abs(item.notaMedia - mediaGeralCalc);
    if (diff > 0.5) {
      const motivo =
        item.notaMedia < mediaGeralCalc
          ? `Nota ${item.notaMedia.toFixed(1)} puxa a média para baixo`
          : `Nota ${item.notaMedia.toFixed(1)} acima da média`;
      excecoes.push({
        loja: item.loja,
        notaMedia: item.notaMedia,
        motivo,
      });
    }
  });

  return {
    regiao,
    mediaGeral,
    totalLojas: lojasComNota.length,
    status,
    topLojas,
    lojasOportunidades,
    piorLoja,
    padrao,
    padraoDescricao,
    excecoes,
  };
}

/**
 * Detecta anomalias (lojas com performance muito abaixo da média)
 */
export function detectarAnomalias(
  avaliacoes: Avaliacao[],
  lojas: Loja[],
  threshold: number = 3.5
): Anomalia[] {
  // Calcula média geral
  const notaMediaGeral = calcularNotaMedia(avaliacoes);

  // Calcula nota média por loja
  const notasPorLoja = new Map<string, { soma: number; total: number; loja: Loja }>();

  lojas.forEach((loja) => {
    notasPorLoja.set(loja.id, { soma: 0, total: 0, loja });
  });

  avaliacoes.forEach((av) => {
    const dados = notasPorLoja.get(av.loja_id);
    if (dados) {
      dados.soma += av.nota;
      dados.total += 1;
    }
  });

  // Identifica anomalias
  const anomalias: Anomalia[] = [];

  notasPorLoja.forEach((dados) => {
    if (dados.total === 0) return;

    const notaMedia = dados.soma / dados.total;
    const gap = notaMediaGeral - notaMedia;

    // Se estiver abaixo do threshold E com gap significativo
    if (notaMedia < threshold && gap > 0.5) {
      let severidade: Anomalia['severidade'] = 'MÉDIA ⚠️';
      if (notaMedia < 2.0) severidade = 'CRÍTICA 💀';
      else if (notaMedia < 3.0) severidade = 'ALTA ⚠️';

      const motivos: string[] = [];
      if (notaMedia < threshold) {
        motivos.push(`Nota abaixo de ${threshold.toFixed(1)} estrelas`);
      }
      if (gap > 1.0) {
        motivos.push(`Gap de ${gap.toFixed(2)} pontos vs média geral`);
      }
      if (dados.total < 10) {
        motivos.push('Poucas avaliações para análise confiável');
      }

      anomalias.push({
        loja: dados.loja,
        notaMedia: Number(notaMedia.toFixed(2)),
        mediaGeral: notaMediaGeral,
        gap: Number(gap.toFixed(2)),
        totalAvaliacoes: dados.total,
        severidade,
        motivos,
        aspectos: {}, // Será preenchido pela análise de IA
        conclusao: `Problema de PROCESSOS e SISTEMAS. Loja não consegue executar operações básicas adequadamente.`,
      });
    }
  });

  // Ordena por severidade (crítica primeiro) e depois por gap
  anomalias.sort((a, b) => {
    const ordemSeveridade = { 'CRÍTICA 💀': 0, 'ALTA ⚠️': 1, 'MÉDIA ⚠️': 2 };
    const diff = ordemSeveridade[a.severidade] - ordemSeveridade[b.severidade];
    return diff !== 0 ? diff : b.gap - a.gap;
  });

  return anomalias;
}

/**
 * Analisa todas as regiões disponíveis
 */
export function analisarTodasRegioes(
  avaliacoes: Avaliacao[],
  lojas: Loja[]
): AnaliseRegiao[] {
  const regioes = Array.from(new Set(lojas.map((l) => l.regiao))) as Regiao[];

  return regioes
    .map((regiao) => analisarRegiao(avaliacoes, lojas, regiao))
    .sort((a, b) => b.mediaGeral - a.mediaGeral); // Ordena por média (melhor primeiro)
}

/**
 * Analisa um estado específico
 */
export function analisarEstado(
  avaliacoes: Avaliacao[],
  lojas: Loja[],
  estado: EstadoUF
): AnaliseRegiao {
  const lojasEstado = lojas.filter((l) => l.estado === estado);
  const avaliacoesEstado = avaliacoes.filter((av) =>
    lojasEstado.some((l) => l.id === av.loja_id)
  );

  if (lojasEstado.length === 0) {
    throw new Error(`Nenhuma loja encontrada no estado ${estado}`);
  }

  // Calcula nota média por loja no estado
  const notasPorLoja = new Map<string, { soma: number; total: number; loja: Loja }>();

  lojasEstado.forEach((loja) => {
    notasPorLoja.set(loja.id, { soma: 0, total: 0, loja });
  });

  avaliacoesEstado.forEach((av) => {
    const dados = notasPorLoja.get(av.loja_id);
    if (dados) {
      dados.soma += av.nota;
      dados.total += 1;
    }
  });

  // Calcula médias
  const lojasComNota: Array<{
    loja: Loja;
    notaMedia: number;
    totalAvaliacoes: number;
  }> = [];

  notasPorLoja.forEach((dados) => {
    if (dados.total > 0) {
      lojasComNota.push({
        loja: dados.loja,
        notaMedia: Number((dados.soma / dados.total).toFixed(2)),
        totalAvaliacoes: dados.total,
      });
    }
  });

  // Ordena por nota média
  lojasComNota.sort((a, b) => b.notaMedia - a.notaMedia);

  // Calcula média geral do estado
  const somaTotal = lojasComNota.reduce((acc, item) => acc + item.notaMedia, 0);
  const mediaGeral = lojasComNota.length > 0
    ? Number((somaTotal / lojasComNota.length).toFixed(2))
    : 0;

  // Define status do estado
  let status: AnaliseRegiao['status'] = 'Equilibrada ✅';
  if (mediaGeral >= 4.2) status = 'Campeã 🏆';
  else if (mediaGeral < 3.8) status = 'Problemática ❌';
  else if (lojasComNota.some((l) => l.notaMedia < 3.5)) status = 'Inconsistente ⚠️';

  // Classifica todas as lojas
  const mediaGeralCalc = mediaGeral;
  
  // Lojas Nota Destaque (acima ou igual à média)
  const topLojas = lojasComNota
    .filter((item) => item.notaMedia >= mediaGeralCalc - 0.1)
    .map((item) => ({
      ...item,
      destaques: [],
    }));

  // Lojas com Oportunidades de Melhoria (abaixo da média, mas não a pior)
  const lojasOportunidades = lojasComNota
    .filter((item) => {
      const isPior = lojasComNota.length > 0 && item.loja.id === lojasComNota[lojasComNota.length - 1].loja.id;
      return item.notaMedia < mediaGeralCalc - 0.1 && !isPior;
    })
    .map((item) => ({
      ...item,
      problemas: [],
    }));

  // Pior loja
  const piorLoja = lojasComNota.length > 0 && lojasComNota[lojasComNota.length - 1].notaMedia < 4.0
    ? {
        loja: lojasComNota[lojasComNota.length - 1].loja,
        notaMedia: lojasComNota[lojasComNota.length - 1].notaMedia,
        problemas: [],
      }
    : undefined;

  // Identifica padrão
  const lojasAcimaMedia = lojasComNota.filter((l) => l.notaMedia >= mediaGeralCalc).length;
  const porcentagemAcima = (lojasAcimaMedia / lojasComNota.length) * 100;

  let padrao: 'POSITIVO' | 'NEGATIVO' | 'MISTO' = 'MISTO';
  let padraoDescricao = '';

  if (porcentagemAcima >= 70) {
    padrao = 'POSITIVO';
    padraoDescricao = `${estado} tem as melhores avaliações gerais, com ${lojasAcimaMedia} de ${lojasComNota.length} lojas acima de ${mediaGeralCalc.toFixed(2)} estrelas.`;
  } else if (porcentagemAcima <= 30) {
    padrao = 'NEGATIVO';
    padraoDescricao = `${estado} tem as piores avaliações e maior variação (${lojasComNota[lojasComNota.length - 1].notaMedia.toFixed(1)} a ${lojasComNota[0].notaMedia.toFixed(1)}).`;
  } else {
    padraoDescricao = `${estado} apresenta avaliações equilibradas, com variação moderada entre as lojas.`;
  }

  // Identifica exceções
  const excecoes: AnaliseRegiao['excecoes'] = [];
  lojasComNota.forEach((item) => {
    const diff = Math.abs(item.notaMedia - mediaGeralCalc);
    if (diff > 0.5) {
      const motivo =
        item.notaMedia < mediaGeralCalc
          ? `Nota ${item.notaMedia.toFixed(1)} puxa a média para baixo`
          : `Nota ${item.notaMedia.toFixed(1)} acima da média`;
      excecoes.push({
        loja: item.loja,
        notaMedia: item.notaMedia,
        motivo,
      });
    }
  });

  return {
    regiao: estado,
    mediaGeral,
    totalLojas: lojasComNota.length,
    status,
    topLojas,
    lojasOportunidades,
    piorLoja,
    padrao,
    padraoDescricao,
    excecoes,
  };
}

/**
 * Analisa todos os estados disponíveis
 */
export function analisarTodosEstados(
  avaliacoes: Avaliacao[],
  lojas: Loja[]
): AnaliseRegiao[] {
  const estados = Array.from(new Set(lojas.map((l) => l.estado))) as EstadoUF[];

  return estados
    .map((estado) => analisarEstado(avaliacoes, lojas, estado))
    .sort((a, b) => b.mediaGeral - a.mediaGeral);
}

/**
 * Analisa uma regional específica (time)
 */
export function analisarRegional(
  avaliacoes: Avaliacao[],
  lojas: Loja[],
  regional: string
): AnaliseRegiao {
  const lojasRegional = lojas.filter((l) => l.time === regional);
  const avaliacoesRegional = avaliacoes.filter((av) =>
    lojasRegional.some((l) => l.id === av.loja_id)
  );

  if (lojasRegional.length === 0) {
    throw new Error(`Nenhuma loja encontrada na regional ${regional}`);
  }

  // Calcula nota média por loja na regional
  const notasPorLoja = new Map<string, { soma: number; total: number; loja: Loja }>();

  lojasRegional.forEach((loja) => {
    notasPorLoja.set(loja.id, { soma: 0, total: 0, loja });
  });

  avaliacoesRegional.forEach((av) => {
    const dados = notasPorLoja.get(av.loja_id);
    if (dados) {
      dados.soma += av.nota;
      dados.total += 1;
    }
  });

  // Calcula médias
  const lojasComNota: Array<{
    loja: Loja;
    notaMedia: number;
    totalAvaliacoes: number;
  }> = [];

  notasPorLoja.forEach((dados) => {
    if (dados.total > 0) {
      lojasComNota.push({
        loja: dados.loja,
        notaMedia: Number((dados.soma / dados.total).toFixed(2)),
        totalAvaliacoes: dados.total,
      });
    }
  });

  // Ordena por nota média
  lojasComNota.sort((a, b) => b.notaMedia - a.notaMedia);

  // Calcula média geral da regional
  const somaTotal = lojasComNota.reduce((acc, item) => acc + item.notaMedia, 0);
  const mediaGeral = lojasComNota.length > 0
    ? Number((somaTotal / lojasComNota.length).toFixed(2))
    : 0;

  // Define status da regional
  let status: AnaliseRegiao['status'] = 'Equilibrada ✅';
  if (mediaGeral >= 4.2) status = 'Campeã 🏆';
  else if (mediaGeral < 3.8) status = 'Problemática ❌';
  else if (lojasComNota.some((l) => l.notaMedia < 3.5)) status = 'Inconsistente ⚠️';

  // Classifica todas as lojas
  const mediaGeralCalc = mediaGeral;
  
  // Lojas Nota Destaque (acima ou igual à média)
  const topLojas = lojasComNota
    .filter((item) => item.notaMedia >= mediaGeralCalc - 0.1)
    .map((item) => ({
      ...item,
      destaques: [],
    }));

  // Lojas com Oportunidades de Melhoria (abaixo da média, mas não a pior)
  const lojasOportunidades = lojasComNota
    .filter((item) => {
      const isPior = lojasComNota.length > 0 && item.loja.id === lojasComNota[lojasComNota.length - 1].loja.id;
      return item.notaMedia < mediaGeralCalc - 0.1 && !isPior;
    })
    .map((item) => ({
      ...item,
      problemas: [],
    }));

  // Pior loja
  const piorLoja = lojasComNota.length > 0 && lojasComNota[lojasComNota.length - 1].notaMedia < 4.0
    ? {
        loja: lojasComNota[lojasComNota.length - 1].loja,
        notaMedia: lojasComNota[lojasComNota.length - 1].notaMedia,
        problemas: [],
      }
    : undefined;

  // Identifica padrão
  const lojasAcimaMedia = lojasComNota.filter((l) => l.notaMedia >= mediaGeralCalc).length;
  const porcentagemAcima = (lojasAcimaMedia / lojasComNota.length) * 100;

  let padrao: 'POSITIVO' | 'NEGATIVO' | 'MISTO' = 'MISTO';
  let padraoDescricao = '';

  if (porcentagemAcima >= 70) {
    padrao = 'POSITIVO';
    padraoDescricao = `${regional} tem as melhores avaliações gerais, com ${lojasAcimaMedia} de ${lojasComNota.length} lojas acima de ${mediaGeralCalc.toFixed(2)} estrelas.`;
  } else if (porcentagemAcima <= 30) {
    padrao = 'NEGATIVO';
    padraoDescricao = `${regional} tem as piores avaliações e maior variação (${lojasComNota[lojasComNota.length - 1].notaMedia.toFixed(1)} a ${lojasComNota[0].notaMedia.toFixed(1)}).`;
  } else {
    padraoDescricao = `${regional} apresenta avaliações equilibradas, com variação moderada entre as lojas.`;
  }

  // Identifica exceções
  const excecoes: AnaliseRegiao['excecoes'] = [];
  lojasComNota.forEach((item) => {
    const diff = Math.abs(item.notaMedia - mediaGeralCalc);
    if (diff > 0.5) {
      const motivo =
        item.notaMedia < mediaGeralCalc
          ? `Nota ${item.notaMedia.toFixed(1)} puxa a média para baixo`
          : `Nota ${item.notaMedia.toFixed(1)} acima da média`;
      excecoes.push({
        loja: item.loja,
        notaMedia: item.notaMedia,
        motivo,
      });
    }
  });

  return {
    regiao: regional,
    mediaGeral,
    totalLojas: lojasComNota.length,
    status,
    topLojas,
    lojasOportunidades,
    piorLoja,
    padrao,
    padraoDescricao,
    excecoes,
  };
}

/**
 * Analisa todas as regionais disponíveis
 */
export function analisarTodosRegionais(
  avaliacoes: Avaliacao[],
  lojas: Loja[]
): AnaliseRegiao[] {
  const regionais = Array.from(new Set(lojas.map((l) => l.time).filter((t): t is string => !!t)));

  return regionais
    .map((regional) => analisarRegional(avaliacoes, lojas, regional))
    .sort((a, b) => b.mediaGeral - a.mediaGeral);
}

