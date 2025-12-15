'use client';

import type { AnaliseRegiao } from '@/services/advancedAnalyticsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatarNomeLoja } from '@/lib/lojaUtils';

interface AnaliseRegiaoProps {
  analise: AnaliseRegiao;
  tipo?: 'regiao' | 'estado' | 'regional';
}

export default function AnaliseRegiaoComponent({ analise, tipo = 'regiao' }: AnaliseRegiaoProps) {
  const getStatusColor = (status: string) => {
    if (status.includes('🏆')) return 'bg-green-100 border-green-500 text-green-800';
    if (status.includes('✅')) return 'bg-blue-100 border-blue-500 text-blue-800';
    if (status.includes('⚠️')) return 'bg-yellow-100 border-yellow-500 text-yellow-800';
    return 'bg-destructive/10 border-destructive text-destructive';
  };

  const getPadraoColor = (padrao: string) => {
    if (padrao === 'POSITIVO') return 'text-green-700 bg-green-50 border-green-200';
    if (padrao === 'NEGATIVO') return 'text-destructive bg-destructive/10 border-destructive/20';
    return 'text-muted-foreground bg-muted border-border';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{analise.regiao}</CardTitle>
          <Badge className={cn('text-sm font-semibold', getStatusColor(analise.status))} variant="outline">
            {analise.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Métricas Principais */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <p className="text-xs text-muted-foreground mb-1">Média Geral</p>
            <p className="text-2xl font-bold text-blue-700">
              {analise.mediaGeral.toFixed(2)} ⭐
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <p className="text-xs text-muted-foreground mb-1">Total de Lojas</p>
            <p className="text-2xl font-bold text-purple-700">{analise.totalLojas}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <p className="text-xs text-muted-foreground mb-1">Lojas Acima Média</p>
            <p className="text-2xl font-bold text-green-700">
              {analise.topLojas.length}
            </p>
          </div>
        </div>

        {/* Padrão */}
        {analise.padraoDescricao && (
          <div className={cn('p-4 rounded-lg border-2', getPadraoColor(analise.padrao))}>
            <div className="flex items-start gap-2">
              <span className="text-xl">
                {analise.padrao === 'POSITIVO' ? '✅' : analise.padrao === 'NEGATIVO' ? '❌' : '⚠️'}
              </span>
              <div>
                <p className="font-semibold mb-1">
                  {analise.padrao === 'POSITIVO'
                    ? 'PADRÃO POSITIVO'
                    : analise.padrao === 'NEGATIVO'
                    ? 'PADRÃO NEGATIVO'
                    : 'PADRÃO MISTO'}
                </p>
                <p className="text-sm">{analise.padraoDescricao}</p>
              </div>
            </div>
          </div>
        )}

        {/* Lojas Nota Destaque */}
        {analise.topLojas.length > 0 && (
          <div>
            <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
              <span>⭐</span> Lojas Nota Destaque
            </h4>
            <div className="space-y-2">
              {analise.topLojas.map((topLoja, index) => (
                <div
                  key={topLoja.loja.id}
                  className="bg-green-50 border border-green-200 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground">
                      {index === 0 && analise.topLojas[0].notaMedia === topLoja.notaMedia
                        ? '🥇'
                        : index === 1 && analise.topLojas[1]?.notaMedia === topLoja.notaMedia
                        ? '🥈'
                        : index === 2 && analise.topLojas[2]?.notaMedia === topLoja.notaMedia
                        ? '🥉'
                        : ''}{' '}
                      {formatarNomeLoja(topLoja.loja)}
                    </span>
                    <span className="text-lg font-bold text-green-700">
                      {topLoja.notaMedia.toFixed(1)} ⭐
                    </span>
                  </div>
                  {topLoja.destaques.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {topLoja.destaques.join(' • ')}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {topLoja.totalAvaliacoes} avaliações
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pior Loja - com ênfase especial */}
        {analise.piorLoja && (
          <div>
            <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2">
              <span>🔴</span> Pior{' '}
              {tipo === 'estado'
                ? 'do Estado'
                : tipo === 'regional'
                ? 'da Regional'
                : 'da Região'}{' '}
              - Atenção Urgente
            </h4>
            <div className="bg-destructive/10 border-2 border-destructive rounded-lg p-4 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-lg text-foreground">
                  {analise.piorLoja.loja.nome}
                </span>
                <span className="text-2xl font-bold text-destructive">
                  {analise.piorLoja.notaMedia.toFixed(1)} ⭐
                </span>
              </div>
              {analise.piorLoja.problemas.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-destructive mb-1">Principais problemas:</p>
                  <ul className="text-sm text-foreground space-y-1">
                    {analise.piorLoja.problemas.map((problema, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="text-destructive">•</span>
                        <span>{problema}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lojas com Oportunidades de Melhoria */}
        {analise.lojasOportunidades && analise.lojasOportunidades.length > 0 && (
          <div>
            <h4 className="font-semibold text-orange-700 mb-2 flex items-center gap-2">
              <span>📈</span> Lojas com Oportunidades de Melhoria
            </h4>
            <div className="space-y-2">
              {analise.lojasOportunidades.map((lojaOportunidade) => (
                <div
                  key={lojaOportunidade.loja.id}
                  className="bg-orange-50 border border-orange-200 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground">
                      {formatarNomeLoja(lojaOportunidade.loja)}
                    </span>
                    <span className="text-lg font-bold text-orange-700">
                      {lojaOportunidade.notaMedia.toFixed(1)} ⭐
                    </span>
                  </div>
                  {lojaOportunidade.problemas && lojaOportunidade.problemas.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {lojaOportunidade.problemas.join(' • ')}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {lojaOportunidade.totalAvaliacoes} avaliações
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Motivo (se disponível) */}
      {analise.motivo && (
        <div className="p-3 bg-muted rounded-lg border">
          <p className="text-sm text-foreground">
            <strong>Motivo:</strong> {analise.motivo}
          </p>
        </div>
      )}
      </CardContent>
    </Card>
  );
}

