/**
 * Serviço para análise profunda de lojas individuais
 * Gera análise detalhada de aspectos específicos (estrutura, atendimento, etc.)
 */

import type { Avaliacao, Loja } from '@/types';

export interface AspectoLoja {
  estrutura?: {
    status: '✅' | '❌' | '⚠️';
    descricao: string;
    porcentagemPositiva?: number;
  };
  atendimento?: {
    status: '✅' | '❌' | '⚠️';
    descricao: string;
    porcentagemNegativa: number;
    totalAvaliacoes: number;
  };
  politicas?: {
    status: '✅' | '❌' | '⚠️';
    descricao: string;
  };
  operacao?: {
    status: '✅' | '❌' | '⚠️';
    descricao: string;
  };
}

export interface AnaliseProfundaLoja {
  loja: Loja;
  notaMedia: number;
  totalAvaliacoes: number;
  aspectos: AspectoLoja;
  padrao?: string;
  quotesReveladores: string[];
  conclusao: string;
}

/**
 * Analisa aspectos específicos de uma loja
 */
export function analisarLojaProfundamente(
  avaliacoes: Avaliacao[],
  loja: Loja
): AnaliseProfundaLoja {
  const avaliacoesLoja = avaliacoes.filter((av) => av.loja_id === loja.id);

  if (avaliacoesLoja.length === 0) {
    return {
      loja,
      notaMedia: 0,
      totalAvaliacoes: 0,
      aspectos: {},
      quotesReveladores: [],
      conclusao: 'Insuficiente dados para análise.',
    };
  }

  const notaMedia =
    avaliacoesLoja.reduce((acc, av) => acc + av.nota, 0) / avaliacoesLoja.length;

  const comentarios = avaliacoesLoja
    .filter((av) => av.comentario && av.comentario.length > 10)
    .map((av) => av.comentario!.toLowerCase());

  // Análise de Estrutura
  const estruturaKeywords = [
    'organizado',
    'limpo',
    'estrutura',
    'moderno',
    'amplo',
    'espaçoso',
    'bem organizado',
  ];
  const estruturaPositiva = comentarios.filter((c) =>
    estruturaKeywords.some((kw) => c.includes(kw))
  );
  const estruturaStatus =
    estruturaPositiva.length / comentarios.length > 0.5
      ? '✅'
      : estruturaPositiva.length / comentarios.length > 0.2
      ? '⚠️'
      : '❌';

  // Análise de Atendimento
  const atendimentoNegativoKeywords = [
    'atendimento ruim',
    'atendimento péssimo',
    'lento',
    'desinteressado',
    'má vontade',
    'ignorou',
    'não atendeu',
    'deplorável',
    'terrível',
    'conversando',
    'funcionários',
    'vendedores',
  ];
  const atendimentoPositivoKeywords = [
    'atendimento bom',
    'atendimento excelente',
    'prestativo',
    'educado',
    'simpático',
    'atencioso',
    'caloroso',
    'gentil',
  ];

  const atendimentoNegativo = comentarios.filter((c) =>
    atendimentoNegativoKeywords.some((kw) => c.includes(kw))
  );
  const atendimentoPositivo = comentarios.filter((c) =>
    atendimentoPositivoKeywords.some((kw) => c.includes(kw))
  );

  const porcentagemNegativaAtendimento =
    comentarios.length > 0
      ? Number(((atendimentoNegativo.length / comentarios.length) * 100).toFixed(0))
      : 0;

  const atendimentoStatus =
    atendimentoNegativo.length > atendimentoPositivo.length * 2
      ? '❌'
      : atendimentoNegativo.length > atendimentoPositivo.length
      ? '⚠️'
      : '✅';

  // Análise de Políticas
  const politicasKeywords = ['política', 'troca', 'trocas', 'devolução', 'políticas'];
  const politicasNegativaKeywords = ['absurda', 'restritiva', 'problemática', 'ruim'];
  const politicasMencionadas = comentarios.filter((c) =>
    politicasKeywords.some((kw) => c.includes(kw))
  );
  const politicasNegativas = politicasMencionadas.filter((c) =>
    politicasNegativaKeywords.some((kw) => c.includes(kw))
  );

  const politicasStatus =
    politicasMencionadas.length === 0
      ? '✅'
      : politicasNegativas.length / politicasMencionadas.length > 0.5
      ? '❌'
      : politicasNegativas.length > 0
      ? '⚠️'
      : '✅';

  // Análise de Operação
  const operacaoKeywords = [
    'erro',
    'tamanho errado',
    'cor errada',
    'produto errado',
    'não entregou',
    'não entregue',
    'falta',
    'sem estoque',
    'produto não',
    'nunca entregou',
  ];
  const operacaoNegativa = comentarios.filter((c) =>
    operacaoKeywords.some((kw) => c.includes(kw))
  );

  const operacaoStatus =
    operacaoNegativa.length / comentarios.length > 0.3
      ? '❌'
      : operacaoNegativa.length > 0
      ? '⚠️'
      : '✅';

  // Extrai quotes reveladores (comentários negativos mais impactantes)
  const quotesReveladores = avaliacoesLoja
    .filter((av) => av.nota <= 2 && av.comentario)
    .sort((a, b) => a.nota - b.nota)
    .slice(0, 3)
    .map((av) => av.comentario!)
    .filter((q) => q.length > 20);

  // Gera conclusão
  let conclusao = '';
  const problemas: string[] = [];
  if (atendimentoStatus === '❌') problemas.push('GESTÃO e ATENDIMENTO');
  if (operacaoStatus === '❌') problemas.push('PROCESSOS e SISTEMAS');
  if (politicasStatus === '❌') problemas.push('POLÍTICAS ultrapassadas');

  if (problemas.length > 0) {
    conclusao = `Problema de ${problemas.join(' e ')}. Loja não consegue executar operações básicas adequadamente.`;
  } else if (notaMedia < 3.5) {
    conclusao = 'Problemas operacionais e de gestão identificados. Necessária intervenção.';
  } else {
    conclusao = 'Performance dentro do esperado, com oportunidades de melhoria.';
  }

  const aspectos: AspectoLoja = {
    estrutura:
      estruturaPositiva.length > 0
        ? {
            status: estruturaStatus,
            descricao:
              estruturaStatus === '✅'
                ? 'Excelente (padrão Centauro)'
                : estruturaStatus === '⚠️'
                ? 'Regular'
                : 'Precisa melhorias',
            porcentagemPositiva: Number(
              ((estruturaPositiva.length / comentarios.length) * 100).toFixed(0)
            ),
          }
        : undefined,
    atendimento:
      comentarios.length > 0
        ? {
            status: atendimentoStatus,
            descricao:
              atendimentoStatus === '❌'
                ? `Deplorável (${atendimentoNegativo.length} de ${comentarios.length} avaliações negativas)`
                : atendimentoStatus === '⚠️'
                ? 'Necessita melhorias'
                : 'Satisfatório',
            porcentagemNegativa: porcentagemNegativaAtendimento,
            totalAvaliacoes: comentarios.length,
          }
        : undefined,
    politicas:
      politicasMencionadas.length > 0
        ? {
            status: politicasStatus,
            descricao:
              politicasStatus === '❌'
                ? 'Ultrapassadas e restritivas'
                : politicasStatus === '⚠️'
                ? 'Podem ser melhoradas'
                : 'Adequadas',
          }
        : undefined,
    operacao:
      operacaoNegativa.length > 0
        ? {
            status: operacaoStatus,
            descricao:
              operacaoStatus === '❌'
                ? 'Caótica (entregas, gestão de estoque)'
                : operacaoStatus === '⚠️'
                ? 'Necessita atenção'
                : 'Adequada',
          }
        : undefined,
  };
  
  // #region agent log
  // Limpa undefined values antes de retornar (para evitar Object.entries incluir undefined)
  const aspectosLimpos = Object.fromEntries(
    Object.entries(aspectos).filter(([_, value]) => value !== undefined)
  ) as AspectoLoja;
  fetch('http://127.0.0.1:7243/ingest/a7ad799c-5aa9-4168-8bc7-3a82c3fd7a9d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lojaAnalysisService.ts:260',message:'Aspectos antes e depois de limpar undefined',data:{aspectosKeys:Object.keys(aspectos), aspectosLimposKeys:Object.keys(aspectosLimpos), hadUndefined:Object.values(aspectos).some(v=>v===undefined)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  return {
    loja,
    notaMedia: Number(notaMedia.toFixed(2)),
    totalAvaliacoes: avaliacoesLoja.length,
    aspectos: aspectosLimpos,
    padrao: operacaoStatus === '❌' && atendimentoStatus === '❌' ? 'Burocracia que afasta clientes' : undefined,
    quotesReveladores,
    conclusao,
  };
}

