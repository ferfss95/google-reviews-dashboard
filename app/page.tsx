'use client';

import { useState, useEffect, useMemo } from 'react';
import type { FiltrosDashboard, Avaliacao } from '@/types';
import { filtrarAvaliacoes, calcularMetricas, gerarRanking } from '@/services/analyticsService';
import {
  calcularDistribuicaoNotasLojas,
  analisarTodasRegioes,
  analisarTodosEstados,
  analisarTodosRegionais,
  analisarRegiao,
  analisarEstado,
  analisarRegional,
  detectarAnomalias,
  type AnaliseRegiao,
} from '@/services/advancedAnalyticsService';
import { analisarPercepcoes } from '@/services/perceptionsAnalysisService';
import { analisarLojaProfundamente } from '@/services/lojaAnalysisService';
import { lojas, getLojas } from '@/data/lojas';
import FiltrosDashboardComponent from '@/components/FiltrosDashboard';
import KPICard from '@/components/KPICard';
import GraficoEvolucao from '@/components/GraficoEvolucao';
import GraficoDistribuicao from '@/components/GraficoDistribuicao';
import TabelaRanking from '@/components/TabelaRanking';
import AnaliseQualitativaComponent from '@/components/AnaliseQualitativa';
import DistribuicaoNotasLojasComponent from '@/components/DistribuicaoNotasLojas';
import AnaliseRegiaoComponent from '@/components/AnaliseRegiao';
import PercepcoesRecorrentesComponent from '@/components/PercepcoesRecorrentes';
import AnomaliasDetectadasComponent from '@/components/AnomaliasDetectadas';
import AnaliseSentimentosComponent from '@/components/AnaliseSentimentos';
import AvaliacoesDetalhadasComponent from '@/components/AvaliacoesDetalhadas';
import type { AnaliseQualitativa, AnaliseSentimentos } from '@/types';
import { enriquecerAvaliacoes, type AvaliacaoEnriquecida } from '@/services/avaliacaoDetailService';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function DashboardPage() {
  const [filtros, setFiltros] = useState<FiltrosDashboard>({});
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [analiseQualitativa, setAnaliseQualitativa] = useState<AnaliseQualitativa | null>(null);
  const [analiseSentimentos, setAnaliseSentimentos] = useState<AnaliseSentimentos | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAnalise, setLoadingAnalise] = useState(false);
  const [loadingSentimentos, setLoadingSentimentos] = useState(false);

  // Busca avaliações quando os filtros mudam
  useEffect(() => {
    buscarAvaliacoes(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.regiao, filtros.estado, filtros.regional, filtros.lojaId]);

  // Busca análise qualitativa quando filtros mudam (exceto datas, que só afetam visualização)
  useEffect(() => {
    if (avaliacoes.length > 0) {
      buscarAnaliseQualitativa();
      buscarAnaliseSentimentos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.regiao, filtros.estado, filtros.regional, filtros.lojaId, avaliacoes.length]);

  const buscarAvaliacoes = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // Monta URL com parâmetros
      const url = new URL('/api/avaliacoes', window.location.origin);
      
      // Adiciona todos os filtros à URL
      if (filtros.lojaId) {
        url.searchParams.set('lojaId', filtros.lojaId);
      }
      if (filtros.regiao) {
        url.searchParams.set('regiao', filtros.regiao);
      }
      if (filtros.estado) {
        url.searchParams.set('estado', filtros.estado);
      }
      if (filtros.regional) {
        url.searchParams.set('regional', filtros.regional);
      }
      
      if (forceRefresh) {
        url.searchParams.set('refresh', 'true');
      }
      
      // Timeout de 90 segundos para a requisição
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);
      
      try {
        const response = await fetch(url.toString(), {
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // Se for erro 400 com mensagem amigável, mostra de forma melhor
          if (response.status === 400 && errorData.message) {
            throw new Error(errorData.message);
          }
          
          throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Converte datas
        const avaliacoesConvertidas: Avaliacao[] = (data.avaliacoes || []).map((av: any) => ({
          ...av,
          data: new Date(av.data),
          data_avaliacao_maps: av.data_avaliacao_maps ? new Date(av.data_avaliacao_maps) : undefined,
        }));

        setAvaliacoes(avaliacoesConvertidas);
        
        // Mostra mensagem de sucesso no console
        if (data.tempoProcessamento) {
          console.log(`✅ ${avaliacoesConvertidas.length} avaliações carregadas de ${data.lojasProcessadas || 'N'} lojas em ${data.tempoProcessamento}s`);
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('A requisição demorou muito. Tente filtrar por região ou estado para reduzir o tempo.');
        }
        throw fetchError;
      }
    } catch (error: any) {
      console.error('Erro ao buscar avaliações:', error);
      
      // Se for erro de muitas lojas, não mostra alert, apenas log
      if (error.message?.includes('Muitas lojas')) {
        console.warn('⚠️ Use filtros para buscar avaliações');
        // Não define array vazio, deixa as avaliações existentes
        return;
      }
      
      // Mostra mensagem de erro apenas se não for erro esperado
      if (!error.message?.includes('Muitas lojas')) {
        alert(
          `Erro ao buscar avaliações:\n${error.message}\n\nSugestão: Use os filtros de Região, Estado ou Loja para buscar avaliações.`
        );
      }
      
      // Define array vazio apenas se não houver avaliações
      if (avaliacoes.length === 0) {
        setAvaliacoes([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const buscarAnaliseQualitativa = async () => {
    try {
      setLoadingAnalise(true);
      
      const params = new URLSearchParams();
      if (filtros.lojaId) params.append('lojaId', filtros.lojaId);
      else if (filtros.regional) params.append('regional', filtros.regional);
      else if (filtros.estado) params.append('estado', filtros.estado);
      else if (filtros.regiao) params.append('regiao', filtros.regiao);

      const response = await fetch(`/api/analise-qualitativa?${params.toString()}`);
      const data = await response.json();
      
      setAnaliseQualitativa({
        ...data,
        geradoEm: new Date(data.geradoEm),
      });
    } catch (error) {
      console.error('Erro ao buscar análise qualitativa:', error);
    } finally {
      setLoadingAnalise(false);
    }
  };

  const buscarAnaliseSentimentos = async () => {
    try {
      setLoadingSentimentos(true);
      
      const params = new URLSearchParams();
      if (filtros.lojaId) params.append('lojaId', filtros.lojaId);
      if (filtros.regiao) params.append('regiao', filtros.regiao);
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.regional) params.append('regional', filtros.regional);

      const response = await fetch(`/api/analise-sentimentos?${params.toString()}`);
      const data = await response.json();
      
      setAnaliseSentimentos({
        ...data,
        geradoEm: new Date(data.geradoEm),
      });
    } catch (error) {
      console.error('Erro ao buscar análise de sentimentos:', error);
    } finally {
      setLoadingSentimentos(false);
    }
  };

  // Filtra avaliações conforme filtros
  const avaliacoesFiltradas = useMemo(() => {
    return filtrarAvaliacoes(avaliacoes, filtros);
  }, [avaliacoes, filtros]);

  // Filtra lojas conforme filtros
  const lojasFiltradas = useMemo(() => {
    return getLojas({
      regiao: filtros.regiao,
      estado: filtros.estado,
      regional: filtros.regional,
      lojaId: filtros.lojaId,
    });
  }, [filtros]);

  // Enriquece avaliações com categoria e sentimento
  const avaliacoesEnriquecidas = useMemo(() => {
    return enriquecerAvaliacoes(avaliacoesFiltradas, lojasFiltradas);
  }, [avaliacoesFiltradas, lojasFiltradas]);

  // Calcula métricas
  const metricas = useMemo(() => {
    return calcularMetricas(avaliacoesFiltradas, 'dia');
  }, [avaliacoesFiltradas]);

  // Gera rankings
  const melhoresLojas = useMemo(() => {
    return gerarRanking(avaliacoesFiltradas, lojasFiltradas, 'melhores', 10);
  }, [avaliacoesFiltradas, lojasFiltradas]);

  const pioresLojas = useMemo(() => {
    return gerarRanking(avaliacoesFiltradas, lojasFiltradas, 'piores', 10);
  }, [avaliacoesFiltradas, lojasFiltradas]);

  // Análises avançadas
  const distribuicaoNotasLojas = useMemo(() => {
    return calcularDistribuicaoNotasLojas(avaliacoesFiltradas, lojasFiltradas);
  }, [avaliacoesFiltradas, lojasFiltradas]);

  // Estado para controlar o tipo de análise (região, estado, regional)
  const [tipoAnaliseRegional, setTipoAnaliseRegional] = useState<'regiao' | 'estado' | 'regional'>('regiao');

  const analisesRegiao = useMemo(() => {
    try {
      // Usa a função apropriada baseada no tipo selecionado E nos filtros aplicados
      let analises: AnaliseRegiao[];
      
      if (tipoAnaliseRegional === 'regiao') {
        // Se há filtro de região específica, mostra apenas essa região
        if (filtros.regiao) {
          analises = [analisarRegiao(avaliacoesFiltradas, lojasFiltradas, filtros.regiao)];
        } else {
          // Caso contrário, mostra todas as regiões disponíveis nas lojas filtradas
          analises = analisarTodasRegioes(avaliacoesFiltradas, lojasFiltradas);
        }
      } else if (tipoAnaliseRegional === 'estado') {
        // Se há filtro de estado específico, mostra apenas esse estado
        if (filtros.estado) {
          analises = [analisarEstado(avaliacoesFiltradas, lojasFiltradas, filtros.estado)];
        } else {
          // Caso contrário, mostra todos os estados disponíveis nas lojas filtradas
          analises = analisarTodosEstados(avaliacoesFiltradas, lojasFiltradas);
        }
      } else if (tipoAnaliseRegional === 'regional') {
        // Se há filtro de regional específica, mostra apenas essa regional
        if (filtros.regional) {
          analises = [analisarRegional(avaliacoesFiltradas, lojasFiltradas, filtros.regional)];
        } else {
          // Caso contrário, mostra todas as regionais disponíveis nas lojas filtradas
          analises = analisarTodosRegionais(avaliacoesFiltradas, lojasFiltradas);
        }
      } else {
        // Fallback: análise por região
        if (filtros.regiao) {
          analises = [analisarRegiao(avaliacoesFiltradas, lojasFiltradas, filtros.regiao)];
        } else {
          analises = analisarTodasRegioes(avaliacoesFiltradas, lojasFiltradas);
        }
      }
      // Enriquece com destaques e problemas
      return analises.map((analise) => {
        // Enriquece top lojas
        const topLojasEnriquecidas = analise.topLojas.map((topLoja) => {
          const avaliacoesLoja = avaliacoesFiltradas.filter((av) => av.loja_id === topLoja.loja.id);
          const comentarios = avaliacoesLoja
            .filter((av) => av.comentario && av.nota >= 4)
            .map((av) => av.comentario!.toLowerCase());

          const destaques: string[] = [];
          if (comentarios.some((c) => c.includes('atendimento') && (c.includes('bom') || c.includes('excelente')))) {
            destaques.push('Atendimento destacado');
          }
          if (comentarios.some((c) => c.includes('variedade') || c.includes('opções'))) {
            destaques.push('Boa variedade');
          }
          if (comentarios.some((c) => c.includes('preço') && (c.includes('competitivo') || c.includes('bom')))) {
            destaques.push('Preços competitivos');
          }
          if (comentarios.some((c) => c.includes('organizado') || c.includes('limpo'))) {
            destaques.push('Ambiente organizado');
          }
          if (comentarios.some((c) => c.includes('troca') && (c.includes('fácil') || c.includes('aceita')))) {
            destaques.push('Facilidade de trocas');
          }

          if (destaques.length === 0 && topLoja.notaMedia >= 4.3) {
            destaques.push('Avaliações muito positivas');
          }

          return { ...topLoja, destaques };
        });

        // Enriquece lojas com oportunidades
        const lojasOportunidadesEnriquecidas = analise.lojasOportunidades.map((lojaOportunidade) => {
          const avaliacoesLoja = avaliacoesFiltradas.filter((av) => av.loja_id === lojaOportunidade.loja.id);
          const comentarios = avaliacoesLoja
            .filter((av) => av.comentario && av.nota <= 3)
            .map((av) => av.comentario!.toLowerCase());

          const problemas: string[] = [];
          if (comentarios.some((c) => c.includes('atendimento') && (c.includes('ruim') || c.includes('péssimo')))) {
            problemas.push('Atendimento problemático');
          }
          if (comentarios.some((c) => c.includes('preço') && c.includes('caro'))) {
            problemas.push('Preços elevados');
          }
          if (comentarios.some((c) => c.includes('estoque') && c.includes('falta'))) {
            problemas.push('Falta de estoque');
          }
          if (comentarios.some((c) => c.includes('erro') || c.includes('não entregou'))) {
            problemas.push('Erros operacionais');
          }

          if (problemas.length === 0) {
            const textoMedia =
              tipoAnaliseRegional === 'estado'
                ? 'Abaixo da média do estado'
                : tipoAnaliseRegional === 'regional'
                ? 'Abaixo da média da regional'
                : 'Abaixo da média da região';
            problemas.push(textoMedia);
          }

          return { ...lojaOportunidade, problemas };
        });

        // Enriquece pior loja
        let piorLojaEnriquecida = analise.piorLoja;
        if (piorLojaEnriquecida) {
          const avaliacoesPior = avaliacoesFiltradas.filter(
            (av) => av.loja_id === piorLojaEnriquecida!.loja.id
          );
          const comentarios = avaliacoesPior
            .filter((av) => av.comentario && av.nota <= 3)
            .map((av) => av.comentario!.toLowerCase());

          const problemas: string[] = [];
          if (comentarios.some((c) => c.includes('atendimento') && (c.includes('ruim') || c.includes('péssimo')))) {
            problemas.push('Atendimento problemático');
          }
          if (comentarios.some((c) => c.includes('preço') && c.includes('caro'))) {
            problemas.push('Preços elevados');
          }
          if (comentarios.some((c) => c.includes('estoque') && c.includes('falta'))) {
            problemas.push('Falta de estoque');
          }
          if (comentarios.some((c) => c.includes('erro') || c.includes('não entregou'))) {
            problemas.push('Erros operacionais');
          }

          if (problemas.length === 0) {
            problemas.push('Necessita melhorias urgentes');
          }

          piorLojaEnriquecida = { ...piorLojaEnriquecida, problemas };
        }

        return {
          ...analise,
          topLojas: topLojasEnriquecidas,
          lojasOportunidades: lojasOportunidadesEnriquecidas,
          piorLoja: piorLojaEnriquecida,
        };
      });
    } catch (error) {
      console.error('Erro ao analisar regiões:', error);
      return [];
    }
  }, [avaliacoesFiltradas, lojasFiltradas, tipoAnaliseRegional, filtros.regiao, filtros.estado, filtros.regional]);

  const anomalias = useMemo(() => {
    const anomaliasDetectadas = detectarAnomalias(avaliacoesFiltradas, lojasFiltradas, 3.5);
    
    // Enriquece com análise profunda
    return anomaliasDetectadas.map((anomalia) => {
      const analiseProfunda = analisarLojaProfundamente(
        avaliacoesFiltradas.filter((av) => av.loja_id === anomalia.loja.id),
        anomalia.loja
      );

      return {
        ...anomalia,
        aspectos: analiseProfunda.aspectos,
        padrao: analiseProfunda.padrao,
        conclusao: analiseProfunda.conclusao,
      };
    });
  }, [avaliacoesFiltradas, lojasFiltradas]);

  const percepcoes = useMemo(() => {
    return analisarPercepcoes(avaliacoesFiltradas, lojasFiltradas);
  }, [avaliacoesFiltradas, lojasFiltradas]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto mb-4"></div>
          <p className="text-foreground font-medium mb-2">Carregando avaliações...</p>
          <p className="text-sm text-muted-foreground">
            Buscando avaliações das lojas. Isso pode levar alguns segundos.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            💡 Processando em lotes para evitar timeout
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">G</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Dashboard de Avaliações - Centauro
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Análise de desempenho das lojas físicas baseada em avaliações do Google Maps
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <FiltrosDashboardComponent
          filtros={filtros}
          onFiltrosChange={setFiltros}
        />

        {/* Visão Geral */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-4">Visão Geral</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <KPICard
            title="Nota Média Geral"
            value={metricas.notaMedia.toFixed(2)}
            subtitle={`Baseado em ${metricas.totalAvaliacoes} avaliações`}
            icon="⭐"
            className="bg-red-700"
          />
          <KPICard
            title="Total de Avaliações"
            value={metricas.totalAvaliacoes}
            subtitle={`${lojasFiltradas.length} lojas`}
            icon="📝"
          />
          </div>
        </div>

        {/* Análise de Métricas */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-4">Análise de Métricas</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GraficoDistribuicao distribuicao={metricas.distribuicao} titulo="Distribuição por Nota" />
            <GraficoEvolucao dados={metricas.notaMediaPorPeriodo} titulo="Evolução da Nota Média" />
          </div>
        </div>

        {/* Análise de Sentimentos */}
        <div className="mb-6">
          {loadingSentimentos ? (
            <div className="bg-card rounded-lg shadow-md p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Gerando análise de sentimentos com IA...</p>
            </div>
          ) : (
            analiseSentimentos && (
              <AnaliseSentimentosComponent
                analise={analiseSentimentos}
                avaliacoes={avaliacoesEnriquecidas}
              />
            )
          )}
        </div>

        {/* Distribuição de Notas por Loja */}
        <div className="mb-6">
          <DistribuicaoNotasLojasComponent distribuicao={distribuicaoNotasLojas} />
        </div>

        {/* Rankings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <TabelaRanking rankings={melhoresLojas} tipo="melhores" />
          <TabelaRanking rankings={pioresLojas} tipo="piores" />
        </div>

        {/* Análise por Região */}
        {analisesRegiao.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-foreground">
                📊 Análise por{' '}
                {tipoAnaliseRegional === 'estado'
                  ? 'Estado'
                  : tipoAnaliseRegional === 'regional'
                  ? 'Regional'
                  : 'Região'}
              </h2>
              <Select
                value={tipoAnaliseRegional}
                onValueChange={(value) => setTipoAnaliseRegional(value as 'regiao' | 'estado' | 'regional')}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regiao">Por Região</SelectItem>
                  <SelectItem value="estado">Por Estado</SelectItem>
                  <SelectItem value="regional">Por Regional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {analisesRegiao.map((analise) => (
                <AnaliseRegiaoComponent
                  key={analise.regiao}
                  analise={analise}
                  tipo={tipoAnaliseRegional}
                />
              ))}
            </div>
          </div>
        )}

        {/* Percepções Recorrentes */}
        {(percepcoes.positivas.length > 0 || percepcoes.negativas.length > 0) && (
          <div className="mb-6">
            <PercepcoesRecorrentesComponent percepcoes={percepcoes} />
          </div>
        )}

        {/* Anomalias Detectadas */}
        {anomalias.length > 0 && (
          <div className="mb-6">
            <AnomaliasDetectadasComponent anomalias={anomalias} />
          </div>
        )}

        {/* Avaliações Detalhadas */}
        {avaliacoesFiltradas.length > 0 && (
          <AvaliacoesDetalhadasComponent
            avaliacoes={avaliacoesFiltradas}
            lojas={lojasFiltradas.map((l) => ({ id: l.id, nome: l.nome, codigo: l.codigo }))}
          />
        )}

        {/* Análise Qualitativa */}
        {loadingAnalise ? (
          <div className="bg-card rounded-lg shadow-md p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Gerando análise qualitativa com IA...</p>
          </div>
        ) : (
          analiseQualitativa && (
            <AnaliseQualitativaComponent analise={analiseQualitativa} />
          )
        )}

        {/* Informações sobre as avaliações */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Total de avaliações:</strong> {avaliacoesFiltradas.length} avaliações
          </p>
          <p className="text-xs text-blue-600 mt-1">
            📋 <strong>Nota importante:</strong> A análise é baseada nas <strong>5 últimas avaliações</strong> retornadas pela API do Google Maps para cada loja. 
            Esta é uma limitação da Google Places API, que retorna no máximo 5 avaliações por estabelecimento.
          </p>
        </div>

        {/* Botão para atualizar dados */}
        <div className="mt-4 text-center space-y-2">
          <Button
            onClick={() => buscarAvaliacoes(false)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={loading}
          >
            🔄 Buscar Avaliações {filtros.regiao || filtros.estado || filtros.regional || filtros.lojaId ? '(Filtradas)' : '(Todas as Lojas)'}
          </Button>
        </div>
      </main>
    </div>
  );
}

