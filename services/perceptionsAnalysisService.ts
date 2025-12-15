/**
 * Serviço de análise de percepções (positivas e negativas) recorrentes
 * Categoriza feedback dos clientes em temas recorrentes
 */

import type { Avaliacao, Loja } from '@/types';

export interface PercepcaoPositiva {
  categoria: string;
  porcentagem: number;
  lojasDestacadas: string[];
  exemplos: string[];
  descricao: string;
}

export interface PercepcaoNegativa {
  categoria: string;
  porcentagem: number;
  lojasProblematicas: string[];
  exemplos: string[];
  descricao: string;
  casosGraves?: Array<{
    loja: string;
    descricao: string;
    valor?: number;
  }>;
}

export interface AnalisePercepcoes {
  positivas: PercepcaoPositiva[];
  negativas: PercepcaoNegativa[];
}

/**
 * Categorias de percepções positivas conhecidas
 */
const CATEGORIAS_POSITIVAS = [
  {
    nome: 'Variedade de Marcas',
    keywords: [
      'nike',
      'adidas',
      'puma',
      'under armour',
      'variedade',
      'marcas',
      'seleção',
      'opções',
      'produtos',
      'departamentos',
    ],
  },
  {
    nome: 'Qualidade dos Produtos',
    keywords: [
      'qualidade',
      'bom produto',
      'durabilidade',
      'material',
      'fabricação',
      'resistente',
      'excelente qualidade',
      'alta qualidade',
    ],
  },
  {
    nome: 'Estrutura/Organização',
    keywords: [
      'organizado',
      'limpo',
      'estrutura',
      'moderno',
      'amplo',
      'espaçoso',
      'bem organizado',
      'arrumado',
      'ambiente',
    ],
  },
  {
    nome: 'Atendimento Prestativo',
    keywords: [
      'atendimento',
      'atendente',
      'vendedor',
      'prestativo',
      'educado',
      'simpático',
      'atencioso',
      'ajudou',
      'atendeu bem',
      'caloroso',
      'gentil',
    ],
  },
  {
    nome: 'Facilidade de Trocas',
    keywords: [
      'troca',
      'trocas',
      'devolução',
      'política',
      'fácil trocar',
      'aceita troca',
      'trocou',
      'online',
    ],
  },
];

/**
 * Categorias de percepções negativas conhecidas
 */
const CATEGORIAS_NEGATIVAS = [
  {
    nome: 'Preços Altos',
    keywords: [
      'caro',
      'preço alto',
      'muito caro',
      'caríssimo',
      'caro demais',
      'preço',
      'barato',
      'metade do preço',
      'mais barato',
      'online',
    ],
  },
  {
    nome: 'Atendimento Lento/Desinteressado',
    keywords: [
      'atendimento ruim',
      'atendimento péssimo',
      'lento',
      'desinteressado',
      'má vontade',
      'ignorou',
      'não atendeu',
      'deixou esperando',
      'conversando',
      'funcionários',
      'vendedores',
      'deplorável',
      'terrível',
    ],
  },
  {
    nome: 'Erros Operacionais',
    keywords: [
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
      'protocolo',
    ],
  },
];

/**
 * Analisa percepções positivas e negativas dos comentários
 */
export function analisarPercepcoes(
  avaliacoes: Avaliacao[],
  lojas: Loja[]
): AnalisePercepcoes {
  const comentarios = avaliacoes
    .filter((av) => av.comentario && av.comentario.trim().length > 10)
    .map((av) => ({
      comentario: av.comentario!.toLowerCase(),
      loja_id: av.loja_id,
      nota: av.nota,
    }));

  const totalComentarios = comentarios.length;
  if (totalComentarios === 0) {
    return { positivas: [], negativas: [] };
  }

  // Analisa percepções positivas (notas 4 e 5)
  const comentariosPositivos = comentarios.filter((c) => c.nota >= 4);
  const positivas: PercepcaoPositiva[] = [];

  CATEGORIAS_POSITIVAS.forEach((categoria) => {
    const matches = comentariosPositivos.filter((c) =>
      categoria.keywords.some((kw) => c.comentario.includes(kw))
    );

    if (matches.length > 0) {
      const porcentagem = Number(
        ((matches.length / comentariosPositivos.length) * 100).toFixed(0)
      );

      // Identifica lojas destacadas (mais mencionadas nesta categoria)
      const lojasPorFrequencia = new Map<string, number>();
      matches.forEach((m) => {
        lojasPorFrequencia.set(m.loja_id, (lojasPorFrequencia.get(m.loja_id) || 0) + 1);
      });

      const lojasDestacadas = Array.from(lojasPorFrequencia.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([lojaId]) => {
          const loja = lojas.find((l) => l.id === lojaId);
          return loja?.nome || lojaId;
        });

      // Extrai exemplos (primeiras menções)
      const exemplos = matches.slice(0, 3).map((m) => {
        const palavras = m.comentario.split(' ');
        const idx = palavras.findIndex((p) =>
          categoria.keywords.some((kw) => p.includes(kw))
        );
        if (idx >= 0) {
          const inicio = Math.max(0, idx - 5);
          const fim = Math.min(palavras.length, idx + 15);
          return palavras.slice(inicio, fim).join(' ').substring(0, 100) + '...';
        }
        return m.comentario.substring(0, 100) + '...';
      });

      positivas.push({
        categoria: categoria.nome,
        porcentagem,
        lojasDestacadas,
        exemplos,
        descricao: generateDescricaoPositiva(categoria.nome, porcentagem, lojasDestacadas),
      });
    }
  });

  // Ordena por porcentagem (maior primeiro)
  positivas.sort((a, b) => b.porcentagem - a.porcentagem);

  // Analisa percepções negativas (notas 1, 2 e 3)
  const comentariosNegativos = comentarios.filter((c) => c.nota <= 3);
  const negativas: PercepcaoNegativa[] = [];

  CATEGORIAS_NEGATIVAS.forEach((categoria) => {
    const matches = comentariosNegativos.filter((c) =>
      categoria.keywords.some((kw) => c.comentario.includes(kw))
    );

    if (matches.length > 0) {
      const porcentagem = Number(
        ((matches.length / comentariosNegativos.length) * 100).toFixed(0)
      );

      // Identifica lojas problemáticas
      const lojasPorFrequencia = new Map<string, number>();
      matches.forEach((m) => {
        lojasPorFrequencia.set(m.loja_id, (lojasPorFrequencia.get(m.loja_id) || 0) + 1);
      });

      const lojasProblematicas = Array.from(lojasPorFrequencia.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([lojaId]) => {
          const loja = lojas.find((l) => l.id === lojaId);
          return loja?.nome || lojaId;
        });

      // Extrai exemplos
      const exemplos = matches.slice(0, 3).map((m) => {
        const palavras = m.comentario.split(' ');
        const idx = palavras.findIndex((p) =>
          categoria.keywords.some((kw) => p.includes(kw))
        );
        if (idx >= 0) {
          const inicio = Math.max(0, idx - 5);
          const fim = Math.min(palavras.length, idx + 15);
          return palavras.slice(inicio, fim).join(' ').substring(0, 100) + '...';
        }
        return m.comentario.substring(0, 100) + '...';
      });

      // Identifica casos graves (para erros operacionais)
      const casosGraves: PercepcaoNegativa['casosGraves'] = [];
      if (categoria.nome === 'Erros Operacionais') {
        const casosGravesText = matches.filter((m) =>
          ['não entregou', 'nunca entregou', 'não entregue', 'protocolo'].some((kw) =>
            m.comentario.includes(kw)
          )
        );
        casosGravesText.slice(0, 2).forEach((m) => {
          const loja = lojas.find((l) => l.id === m.loja_id);
          casosGraves.push({
            loja: loja?.nome || m.loja_id,
            descricao: m.comentario.substring(0, 150),
          });
        });
      }

      negativas.push({
        categoria: categoria.nome,
        porcentagem,
        lojasProblematicas,
        exemplos,
        descricao: generateDescricaoNegativa(categoria.nome, porcentagem, lojasProblematicas),
        casosGraves: casosGraves.length > 0 ? casosGraves : undefined,
      });
    }
  });

  // Ordena por porcentagem (maior primeiro)
  negativas.sort((a, b) => b.porcentagem - a.porcentagem);

  return { positivas, negativas };
}

function generateDescricaoPositiva(
  categoria: string,
  porcentagem: number,
  lojas: string[]
): string {
  const lojasText = lojas.length > 0 ? `Lojas destacadas: ${lojas.join(', ')}.` : '';
  return `Mencionada em ${porcentagem}% das avaliações positivas. ${lojasText}`;
}

function generateDescricaoNegativa(
  categoria: string,
  porcentagem: number,
  lojas: string[]
): string {
  const lojasText = lojas.length > 0 ? `Lojas mais problemáticas: ${lojas.join(', ')}.` : '';
  return `Mencionada em ${porcentagem}% das críticas. ${lojasText}`;
}

