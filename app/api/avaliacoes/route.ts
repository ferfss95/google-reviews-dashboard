/**
 * API Route para buscar e gerenciar avaliações
 */

import { NextRequest, NextResponse } from 'next/server';
import { mapsMcpService } from '@/services/mapsMcpService';
import { lojas, getLojas } from '@/data/lojas';
import type { Avaliacao } from '@/types';

// Cache em memória para avaliações (TTL de 1 hora)
const avaliacoesCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hora

/**
 * GET /api/avaliacoes
 * Busca avaliações das lojas configuradas via MCP do Maps
 * 
 * Otimizações:
 * - Cache de 1 hora para evitar requisições repetidas
 * - Timeout de 60 segundos para a requisição completa
 * - Processamento em lotes no serviço
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    const searchParams = request.nextUrl.searchParams;
    const lojaId = searchParams.get('lojaId');
    const regiao = searchParams.get('regiao');
    const estado = searchParams.get('estado');
    const regional = searchParams.get('regional');
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Filtra lojas usando a função getLojas que suporta todos os filtros
    let lojasParaBuscar = getLojas({
      lojaId: lojaId || undefined,
      regiao: regiao || undefined,
      estado: estado || undefined,
      regional: regional || undefined,
    });

    // Define limites baseados no tipo de filtro
    // Se houver filtros (região, estado, regional), permite mais lojas
    // Se não houver filtros, limita para evitar timeout
    const temFiltro = !!(lojaId || regiao || estado || regional);
    const limiteMaximo = temFiltro ? 100 : 30; // Permite mais lojas quando há filtros
    
    if (lojasParaBuscar.length > limiteMaximo && !forceRefresh) {
      // Se não tem filtro nenhum e há muitas lojas, limita para melhor performance
      console.warn(`⚠️ Limiting to first ${limiteMaximo} lojas of ${lojasParaBuscar.length} for better performance`);
      lojasParaBuscar = lojasParaBuscar.slice(0, limiteMaximo);
    }
    
    // Se forçado refresh e muitas lojas, limita a 100 para evitar timeout extremo
    if (forceRefresh && lojasParaBuscar.length > 100) {
      console.warn(`⚠️ Limiting to first 100 lojas of ${lojasParaBuscar.length} to avoid timeout`);
      lojasParaBuscar = lojasParaBuscar.slice(0, 100);
    }

    if (lojasParaBuscar.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma loja encontrada' },
        { status: 404 }
      );
    }

    // Gera chave de cache baseada nas lojas
    const cacheKey = `avaliacoes:${lojasParaBuscar.map((l) => l.id).sort().join(',')}`;
    
    // Verifica cache (a menos que force refresh)
    if (!forceRefresh) {
      const cached = avaliacoesCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`📦 Retornando avaliações do cache (${lojasParaBuscar.length} lojas)`);
        return NextResponse.json(cached.data);
      }
    }

    console.log(`🔄 Buscando avaliações de ${lojasParaBuscar.length} lojas...`);

    // Timeout geral de 60 segundos
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout: requisição demorou mais de 60 segundos')), 60000)
    );

    const buscarPromise = mapsMcpService.getAvaliacoesFromLojas(lojasParaBuscar);

    // Busca avaliações via MCP com timeout
    const avaliacoes = await Promise.race([buscarPromise, timeoutPromise]);

    // Converte datas para strings para serialização JSON
    const avaliacoesSerializadas = avaliacoes.map((av) => ({
      ...av,
      data: av.data.toISOString(),
      data_avaliacao_maps: av.data_avaliacao_maps?.toISOString(),
    }));

    const response = {
      avaliacoes: avaliacoesSerializadas,
      total: avaliacoesSerializadas.length,
      lojasProcessadas: lojasParaBuscar.length,
      tempoProcessamento: Math.round((Date.now() - startTime) / 1000),
    };

    // Salva no cache
    avaliacoesCache.set(cacheKey, {
      data: response,
      timestamp: Date.now(),
    });

    // Limpa cache antigo (mantém apenas últimas 10 entradas)
    if (avaliacoesCache.size > 10) {
      const entries = Array.from(avaliacoesCache.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      avaliacoesCache.clear();
      entries.slice(0, 10).forEach(([key, value]) => {
        avaliacoesCache.set(key, value);
      });
    }

    console.log(`✅ Avaliações buscadas: ${avaliacoesSerializadas.length} avaliações em ${response.tempoProcessamento}s`);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Erro ao buscar avaliações:', error);
    
    // Se for timeout, retorna erro específico
    if (error.message?.includes('Timeout')) {
      return NextResponse.json(
        {
          error: 'Timeout ao buscar avaliações',
          details: 'A busca está demorando muito. Tente novamente ou busque menos lojas por vez.',
          suggestion: 'Use o filtro de loja específica ou região para reduzir o número de requisições.',
        },
        { status: 504 } // Gateway Timeout
      );
    }
    
    return NextResponse.json(
      { error: 'Erro ao buscar avaliações', details: String(error) },
      { status: 500 }
    );
  }
}

