/**
 * API Route para gerar análises qualitativas com IA
 */

import { NextRequest, NextResponse } from 'next/server';
import { gerarAnaliseQualitativa } from '@/services/aiAnalysisService';
import { filtrarAvaliacoesPorEscopo } from '@/services/analyticsService';
import { lojas, getLojas } from '@/data/lojas';
import type { Avaliacao } from '@/types';

// Cache simples em memória (em produção, use Redis ou similar)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hora

/**
 * GET /api/analise-qualitativa
 * Gera análise qualitativa para um escopo específico
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lojaId = searchParams.get('lojaId');
    const regiao = searchParams.get('regiao');
    const estado = searchParams.get('estado');
    const regional = searchParams.get('regional');

    // Determina escopo (prioriza loja > regional > estado > região)
    const escopo: {
      lojaId?: string;
      regiao?: string;
      estado?: string;
      regional?: string;
    } = {};

    if (lojaId) {
      escopo.lojaId = lojaId;
    } else if (regional) {
      // Para regional, filtramos por regional mas ainda usamos análise macro baseada em estado/região
      // Se tiver estado, usa estado; senão, usa região; senão, usa rede
      escopo.regional = regional;
      if (estado) escopo.estado = estado;
      else if (regiao) escopo.regiao = regiao;
    } else if (estado) {
      escopo.estado = estado;
    } else if (regiao) {
      escopo.regiao = regiao;
    }

    // Gera chave de cache
    const cacheKey = JSON.stringify(escopo);
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Busca avaliações (em produção, buscar do banco de dados)
    // Por enquanto, buscamos via API de avaliações
    const params = new URLSearchParams();
    if (lojaId) params.append('lojaId', lojaId);
    if (regiao) params.append('regiao', regiao);
    if (estado) params.append('estado', estado);
    if (regional) params.append('regional', regional);
    
    const avaliacoesResponse = await fetch(
      `${request.nextUrl.origin}/api/avaliacoes?${params.toString()}`
    );
    const { avaliacoes: avaliacoesJson } = await avaliacoesResponse.json();

    // Converte datas
    const avaliacoes: Avaliacao[] = avaliacoesJson.map((av: any) => ({
      ...av,
      data: new Date(av.data),
      data_avaliacao_maps: av.data_avaliacao_maps
        ? new Date(av.data_avaliacao_maps)
        : undefined,
    }));

    // Filtra avaliações por escopo
    const avaliacoesFiltradas = filtrarAvaliacoesPorEscopo(
      avaliacoes,
      lojas,
      escopo
    );

    // Gera análise
    const analise = await gerarAnaliseQualitativa(
      avaliacoesFiltradas,
      getLojas(escopo),
      escopo
    );

    // Serializa para JSON
    const analiseSerializada = {
      ...analise,
      geradoEm: analise.geradoEm.toISOString(),
    };

    // Salva no cache
    cache.set(cacheKey, {
      data: analiseSerializada,
      timestamp: Date.now(),
    });

    return NextResponse.json(analiseSerializada);
  } catch (error) {
    console.error('Erro ao gerar análise qualitativa:', error);
    return NextResponse.json(
      {
        error: 'Erro ao gerar análise qualitativa',
        details: String(error),
      },
      { status: 500 }
    );
  }
}

