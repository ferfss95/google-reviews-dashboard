'use client';

import { useMemo } from 'react';
import type { AnaliseSentimentos } from '@/types';
import type { AvaliacaoEnriquecida } from '@/services/avaliacaoDetailService';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AnaliseSentimentosProps {
  analise: AnaliseSentimentos;
  avaliacoes?: AvaliacaoEnriquecida[];
}

const CORES_SENTIMENTOS = {
  positivo: '#22c55e', // green-500
  neutro: '#f97316', // orange-500
  negativo: '#ef4444', // red-500
};

const CORES_CATEGORIAS = {
  'Atendimento': '#dc2626', // red-700
  'Ambiente': '#ea580c', // orange-600
  'Tempo de Espera': '#f97316', // orange-500
  'Produtos': '#4b5563', // gray-600
  'Preços': '#6b7280', // gray-500
  'Outros': '#9ca3af', // gray-400
};

export default function AnaliseSentimentosComponent({
  analise,
  avaliacoes = [],
}: AnaliseSentimentosProps) {
  // Calcula distribuição de categorias para avaliações positivas (elogios)
  const categoriasElogios = useMemo(() => {
    const positivas = avaliacoes.filter((av) => av.sentimento === 'positivo');
    const distribuicao: Record<string, number> = {};

    positivas.forEach((av) => {
      const cat = av.categoria || 'Outros';
      distribuicao[cat] = (distribuicao[cat] || 0) + 1;
    });

    return Object.entries(distribuicao).map(([categoria, quantidade]) => ({
      name: categoria,
      value: quantidade,
      fill: CORES_CATEGORIAS[categoria as keyof typeof CORES_CATEGORIAS] || '#9ca3af',
    }));
  }, [avaliacoes]);

  // Calcula distribuição de categorias para avaliações negativas (reclamações)
  const categoriasReclamacoes = useMemo(() => {
    const negativas = avaliacoes.filter((av) => av.sentimento === 'negativo');
    const distribuicao: Record<string, number> = {};

    negativas.forEach((av) => {
      const cat = av.categoria || 'Outros';
      distribuicao[cat] = (distribuicao[cat] || 0) + 1;
    });

    return Object.entries(distribuicao).map(([categoria, quantidade]) => ({
      name: categoria,
      value: quantidade,
      fill: CORES_CATEGORIAS[categoria as keyof typeof CORES_CATEGORIAS] || '#9ca3af',
    }));
  }, [avaliacoes]);
  // Dados para gráfico de sentimentos (donut)
  const dadosSentimentos = [
    {
      name: 'Positivo',
      value: analise.distribuicaoSentimentos.positivo,
      porcentagem: analise.distribuicaoSentimentos.total > 0
        ? ((analise.distribuicaoSentimentos.positivo / analise.distribuicaoSentimentos.total) * 100).toFixed(1)
        : '0',
    },
    {
      name: 'Neutro',
      value: analise.distribuicaoSentimentos.neutro,
      porcentagem: analise.distribuicaoSentimentos.total > 0
        ? ((analise.distribuicaoSentimentos.neutro / analise.distribuicaoSentimentos.total) * 100).toFixed(1)
        : '0',
    },
    {
      name: 'Negativo',
      value: analise.distribuicaoSentimentos.negativo,
      porcentagem: analise.distribuicaoSentimentos.total > 0
        ? ((analise.distribuicaoSentimentos.negativo / analise.distribuicaoSentimentos.total) * 100).toFixed(1)
        : '0',
    },
  ];

  // Dados para gráfico de categorias (donut)
  const dadosCategorias = Object.entries(analise.distribuicaoCategorias || {}).map(([categoria, quantidade]) => ({
    name: categoria,
    value: quantidade,
    fill: CORES_CATEGORIAS[categoria as keyof typeof CORES_CATEGORIAS] || '#9ca3af',
  }));


  if (analise.distribuicaoSentimentos.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Análise de Sentimentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Não há dados suficientes para análise de sentimentos
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Análise de Sentimentos</h2>

      {/* Primeira linha: Sentimento Geral e Categorias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sentimento Geral */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sentimento Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center">
            <div className="relative mb-4">
              <ResponsiveContainer width={250} height={250}>
                <PieChart>
                  <Pie
                    data={dadosSentimentos}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {dadosSentimentos.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.name === 'Positivo'
                            ? CORES_SENTIMENTOS.positivo
                            : entry.name === 'Neutro'
                            ? CORES_SENTIMENTOS.neutro
                            : CORES_SENTIMENTOS.negativo
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string, props: any) => [
                      `${value} (${props.payload.porcentagem}%)`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {analise.distribuicaoSentimentos.total}
                  </div>
                  <div className="text-sm text-muted-foreground">total</div>
                </div>
              </div>
            </div>
          <div className="mt-4 space-y-2">
            {dadosSentimentos.map((sentimento) => (
              <div key={sentimento.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {sentimento.name === 'Positivo' ? '👍' : sentimento.name === 'Neutro' ? '➖' : '👎'}
                  </span>
                  <span className="text-sm font-medium text-foreground">{sentimento.name}:</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-24 rounded"
                    style={{
                      backgroundColor:
                        sentimento.name === 'Positivo'
                          ? CORES_SENTIMENTOS.positivo
                          : sentimento.name === 'Neutro'
                          ? CORES_SENTIMENTOS.neutro
                          : CORES_SENTIMENTOS.negativo,
                    }}
                  />
                  <span className="text-sm font-semibold text-foreground">
                    {sentimento.porcentagem}%
                  </span>
                </div>
              </div>
            ))}
          </div>
            </div>
          </CardContent>
        </Card>

        {/* Categorias de Comentários */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Categorias de Comentários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={dadosCategorias}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {dadosCategorias.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value} menções`} />
                  <Legend
                    wrapperStyle={{ fontSize: '12px' }}
                    formatter={(value) => value}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segunda linha: Principais Elogios e Principais Reclamações lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Principais Elogios */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span>👍</span>
              Principais Elogios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Gráfico de rosca - Categorias dos Elogios */}
              {categoriasElogios.length > 0 ? (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-foreground mb-3 text-center">
                    Distribuição por Categoria
                  </h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={categoriasElogios}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {categoriasElogios.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => `${value} avaliações`}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '11px' }}
                        formatter={(value) => value}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : null}

              {/* Lista de Elogios */}
              <div className="space-y-3">
                {analise.principaisElogios && analise.principaisElogios.length > 0 ? (
                  analise.principaisElogios.map((elogio, index) => {
                    const maxMencoes = Math.max(
                      ...analise.principaisElogios.map((e) => e.mencoes),
                      1
                    );
                    const porcentagem = (elogio.mencoes / maxMencoes) * 100;

                    return (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-foreground">{elogio.texto}</span>
                          <span className="text-sm font-semibold text-foreground">
                            {elogio.mencoes}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${porcentagem}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum elogio identificado
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Principais Reclamações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span>👎</span>
              Principais Reclamações
            </CardTitle>
          </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Gráfico de rosca - Categorias das Reclamações */}
            {categoriasReclamacoes.length > 0 ? (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-foreground mb-3 text-center">
                  Distribuição por Categoria
                </h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={categoriasReclamacoes}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoriasReclamacoes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => `${value} avaliações`}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px' }}
                      formatter={(value) => value}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : null}

            {/* Lista de Reclamações */}
            <div className="space-y-3">
              {analise.principaisReclamacoes && analise.principaisReclamacoes.length > 0 ? (
                analise.principaisReclamacoes.map((reclamacao, index) => {
                  const maxMencoes = Math.max(
                    ...analise.principaisReclamacoes.map((r) => r.mencoes),
                    1
                  );
                  const porcentagem = (reclamacao.mencoes / maxMencoes) * 100;

                  return (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-foreground">{reclamacao.texto}</span>
                        <span className="text-sm font-semibold text-foreground">
                          {reclamacao.mencoes}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-destructive h-2 rounded-full transition-all"
                          style={{ width: `${porcentagem}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma reclamação identificada
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
