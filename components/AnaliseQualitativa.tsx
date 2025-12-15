'use client';

import type { AnaliseQualitativa } from '@/types';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AnaliseQualitativaProps {
  analise: AnaliseQualitativa;
  titulo?: string;
}

export default function AnaliseQualitativaComponent({
  analise,
  titulo,
}: AnaliseQualitativaProps) {
  const hasData =
    (analise.pontosFortes?.length || 0) > 0 ||
    (analise.pontosFracos?.length || 0) > 0 ||
    (analise.tendencias?.length || 0) > 0 ||
    (analise.oportunidades?.length || 0) > 0;

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {titulo || 'Análise Qualitativa'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Não há dados suficientes para análise qualitativa
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg text-primary flex items-center gap-2">
            <span>⚡</span>
            {titulo || 'Análise Qualitativa com IA'}
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            Gerado em {format(analise.geradoEm, 'dd/MM/yyyy HH:mm')}
          </span>
        </div>
      </CardHeader>
      <CardContent>

        {/* Resumo (apenas para micro) */}
        {analise.resumo && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <h4 className="font-semibold text-blue-900 mb-2">Resumo Executivo</h4>
            <p className="text-blue-800">{analise.resumo}</p>
          </div>
        )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pontos Fortes */}
        {(analise.pontosFortes?.length || 0) > 0 && (
          <div>
            <h4 className="font-semibold text-green-700 mb-3 flex items-center">
              <span className="mr-2">✅</span>
              Pontos Fortes
            </h4>
            <ul className="space-y-2">
              {(analise.pontosFortes || []).map((ponto, index) => (
                <li
                  key={index}
                  className="text-foreground pl-4 border-l-2 border-green-300"
                >
                  {ponto}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pontos Fracos */}
        {(analise.pontosFracos?.length || 0) > 0 && (
          <div>
            <h4 className="font-semibold text-red-700 mb-3 flex items-center">
              <span className="mr-2">⚠️</span>
              Pontos Fracos
            </h4>
            <ul className="space-y-2">
              {(analise.pontosFracos || []).map((ponto, index) => (
                <li
                  key={index}
                  className="text-foreground pl-4 border-l-2 border-red-300"
                >
                  {ponto}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Destaques Positivos (micro) */}
        {analise.destaquesPositivos && analise.destaquesPositivos.length > 0 && (
          <div>
            <h4 className="font-semibold text-blue-700 mb-3 flex items-center">
              <span className="mr-2">⭐</span>
              Destaques Positivos
            </h4>
            <ul className="space-y-2">
              {analise.destaquesPositivos.map((destaque, index) => (
                <li
                  key={index}
                  className="text-foreground pl-4 border-l-2 border-blue-300"
                >
                  {destaque}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Reclamações Frequentes (micro) */}
        {analise.reclamacoesFrequentes &&
          analise.reclamacoesFrequentes.length > 0 && (
            <div>
              <h4 className="font-semibold text-orange-700 mb-3 flex items-center">
                <span className="mr-2">🔴</span>
                Reclamações Frequentes
              </h4>
              <ul className="space-y-2">
                {analise.reclamacoesFrequentes.map((reclamacao, index) => (
                  <li
                    key={index}
                    className="text-foreground pl-4 border-l-2 border-orange-300"
                  >
                    {reclamacao}
                  </li>
                ))}
              </ul>
            </div>
          )}

        {/* Tendências (macro) */}
        {(analise.tendencias?.length || 0) > 0 && (
          <div>
            <h4 className="font-semibold text-purple-700 mb-3 flex items-center">
              <span className="mr-2">📈</span>
              Tendências
            </h4>
            <ul className="space-y-2">
              {(analise.tendencias || []).map((tendencia, index) => (
                <li
                  key={index}
                  className="text-foreground pl-4 border-l-2 border-purple-300"
                >
                  {tendencia}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Oportunidades */}
        {(analise.oportunidades?.length || 0) > 0 && (
          <div>
            <h4 className="font-semibold text-indigo-700 mb-3 flex items-center">
              <span className="mr-2">💡</span>
              Oportunidades de Melhoria
            </h4>
            <ul className="space-y-2">
              {(analise.oportunidades || []).map((oportunidade, index) => (
                <li
                  key={index}
                  className="text-foreground pl-4 border-l-2 border-indigo-300"
                >
                  {oportunidade}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Planos de Ação (micro) */}
        {analise.planosAcao && analise.planosAcao.length > 0 && (
          <div className="md:col-span-2">
            <h4 className="font-semibold text-teal-700 mb-3 flex items-center">
              <span className="mr-2">🎯</span>
              Planos de Ação Sugeridos
            </h4>
            <ul className="space-y-2">
              {analise.planosAcao.map((acao, index) => (
                <li
                  key={index}
                  className="text-foreground pl-4 border-l-2 border-teal-300 bg-teal-50 p-2 rounded"
                >
                  {acao}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      </CardContent>
    </Card>
  );
}

