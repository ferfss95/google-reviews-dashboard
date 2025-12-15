/**
 * API Route para gerar análise de sentimentos
 */

import { NextRequest, NextResponse } from 'next/server';
import { gerarAnaliseSentimentos } from '@/services/sentimentAnalysisService';
import { getLojas } from '@/data/lojas';
import type { Avaliacao } from '@/types';

// Cache simples em memória
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hora

/**
 * GET /api/analise-sentimentos
 * Gera análise de sentimentos para um escopo específico
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lojaId = searchParams.get('lojaId');
    const regiao = searchParams.get('regiao');
    const estado = searchParams.get('estado');
    const regional = searchParams.get('regional');

    // Gera chave de cache baseada nos filtros
    const cacheKey = JSON.stringify({ lojaId, regiao, estado, regional });
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Busca avaliações via API interna
    const params = new URLSearchParams();
    if (lojaId) params.append('lojaId', lojaId);
    if (regiao) params.append('regiao', regiao);
    if (estado) params.append('estado', estado);
    if (regional) params.append('regional', regional);

    const avaliacoesResponse = await fetch(
      `${request.nextUrl.origin}/api/avaliacoes?${params.toString()}`
    );

    if (!avaliacoesResponse.ok) {
      throw new Error('Erro ao buscar avaliações');
    }

    const avaliacoesData = await avaliacoesResponse.json();
    const avaliacoes: Avaliacao[] = (avaliacoesData.avaliacoes || []).map((av: any) => ({
      ...av,
      data: new Date(av.data),
      data_avaliacao_maps: av.data_avaliacao_maps ? new Date(av.data_avaliacao_maps) : undefined,
    }));

    if (avaliacoes.length === 0) {
      return NextResponse.json({
        distribuicaoSentimentos: {
          positivo: 0,
          neutro: 0,
          negativo: 0,
          total: 0,
        },
        distribuicaoCategorias: {},
        principaisElogios: [],
        principaisReclamacoes: [],
        geradoEm: new Date().toISOString(),
      });
    }

    // Gera análise de sentimentos
    const analise = await gerarAnaliseSentimentos(avaliacoes);

    // Serializa datas para JSON
    const response = {
      ...analise,
      geradoEm: analise.geradoEm.toISOString(),
    };

    // Salva no cache
    cache.set(cacheKey, {
      data: response,
      timestamp: Date.now(),
    });

    // Limpa cache antigo (mantém apenas últimas 10 entradas)
    if (cache.size > 10) {
      const entries = Array.from(cache.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      cache.clear();
      entries.slice(0, 10).forEach(([key, value]) => {
        cache.set(key, value);
      });
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Erro ao gerar análise de sentimentos:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar análise de sentimentos', details: String(error) },
      { status: 500 }
    );
  }
}
