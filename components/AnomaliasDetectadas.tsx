'use client';

import type { Anomalia } from '@/services/advancedAnalyticsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatarNomeLoja } from '@/lib/lojaUtils';

interface AnomaliasDetectadasProps {
  anomalias: Anomalia[];
  titulo?: string;
}

export default function AnomaliasDetectadasComponent({
  anomalias,
  titulo = 'Lojas que Destoam da Análise',
}: AnomaliasDetectadasProps) {
  const getSeveridadeColor = (severidade: string) => {
    if (severidade.includes('💀')) return 'bg-red-600 border-red-800';
    if (severidade.includes('ALTA')) return 'bg-orange-600 border-orange-800';
    return 'bg-yellow-600 border-yellow-800';
  };

  if (anomalias.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{titulo}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-lg mb-2">✅</p>
            <p>Nenhuma anomalia detectada.</p>
            <p className="text-sm mt-2">Todas as lojas estão dentro dos padrões esperados.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>

      <div className="space-y-6">
        {anomalias.map((anomalia, index) => (
          <div
            key={anomalia.loja.id}
            className="border-2 border-red-200 rounded-lg p-5 bg-red-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-lg font-bold text-foreground">{formatarNomeLoja(anomalia.loja)}</h4>
                <p className="text-sm text-muted-foreground">{anomalia.loja.cidade}, {anomalia.loja.estado}</p>
              </div>
              <Badge className={cn('text-sm font-bold text-white border-2', getSeveridadeColor(anomalia.severidade))} variant="destructive">
                {anomalia.severidade}
              </Badge>
            </div>

            {/* Notas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-red-100 rounded-lg p-2">
                <p className="text-xs text-muted-foreground mb-1">Nota da Loja</p>
                <p className="text-xl font-bold text-red-700">
                  {anomalia.notaMedia.toFixed(1)} ⭐
                </p>
              </div>
              <div className="bg-blue-100 rounded-lg p-2">
                <p className="text-xs text-muted-foreground mb-1">Média Geral</p>
                <p className="text-xl font-bold text-blue-700">
                  {anomalia.mediaGeral.toFixed(1)} ⭐
                </p>
              </div>
              <div className="bg-orange-100 rounded-lg p-2">
                <p className="text-xs text-muted-foreground mb-1">Gap</p>
                <p className="text-xl font-bold text-orange-700">
                  -{anomalia.gap.toFixed(2)} ⭐
                </p>
              </div>
              <div className="bg-purple-100 rounded-lg p-2">
                <p className="text-xs text-muted-foreground mb-1">Total de Avaliações</p>
                <p className="text-xl font-bold text-purple-700">
                  {anomalia.totalAvaliacoes}
                </p>
              </div>
            </div>

            {/* Por que destoa */}
            <div className="mb-4">
              <h5 className="font-semibold text-foreground mb-2">Por que destoa:</h5>
              <ul className="space-y-1">
                {anomalia.motivos.map((motivo, idx) => (
                  <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                    <span>•</span>
                    <span>{motivo}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Análise Profunda */}
            {anomalia.aspectos && Object.keys(anomalia.aspectos).length > 0 && (
              <div className="mb-4">
                <h5 className="font-semibold text-foreground mb-2">Análise Profunda:</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(anomalia.aspectos)
                    .filter(([_, dados]) => dados && typeof dados === 'object' && dados.status !== undefined)
                    .map(([aspecto, dados]: [string, any]) => {
                      return (
                        <div key={aspecto} className="bg-card rounded p-2 border">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{dados.status}</span>
                            <span className="text-sm font-medium text-foreground capitalize">
                              {aspecto}:
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{dados.descricao}</p>
                          {dados.porcentagemNegativa !== undefined && (
                            <p className="text-xs text-red-600 mt-1">
                              {dados.porcentagemNegativa}% das avaliações negativas
                            </p>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Padrão (se disponível) */}
            {anomalia.padrao && (
              <div className="mb-4 bg-orange-100 rounded p-3 border border-orange-200">
                <p className="text-sm text-foreground">
                  <strong>📊 Padrão:</strong> {anomalia.padrao}
                </p>
              </div>
            )}

            {/* Conclusão */}
            <div className="bg-red-100 rounded-lg p-3 border border-red-300">
              <p className="text-sm font-semibold text-red-800 mb-1">Conclusão:</p>
              <p className="text-sm text-foreground">{anomalia.conclusao}</p>
            </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

