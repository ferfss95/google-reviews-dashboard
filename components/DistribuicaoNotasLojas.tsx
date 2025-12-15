'use client';

import type { DistribuicaoNotasLojas } from '@/services/advancedAnalyticsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DistribuicaoNotasLojasProps {
  distribuicao: DistribuicaoNotasLojas;
  titulo?: string;
}

export default function DistribuicaoNotasLojasComponent({
  distribuicao,
  titulo = 'Distribuição de Notas por Loja',
}: DistribuicaoNotasLojasProps) {
  // Ordena por nota média (maior primeiro)
  const itens = Object.values(distribuicao).sort((a, b) => b.notaMedia - a.notaMedia);

  const totalLojas = itens.reduce((acc, item) => acc + item.quantidade, 0);

  const getBarWidth = (quantidade: number) => {
    const max = Math.max(...itens.map((i) => i.quantidade));
    return max > 0 ? (quantidade / max) * 100 : 0;
  };

  const getNotaColor = (nota: number) => {
    if (nota >= 4.5) return 'bg-green-500';
    if (nota >= 4.0) return 'bg-blue-500';
    if (nota >= 3.5) return 'bg-yellow-500';
    if (nota >= 3.0) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        {totalLojas === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Nenhum dado disponível
          </div>
        ) : (
        <div className="space-y-3">
          {itens.map((item) => (
            <div key={item.notaMedia} className="flex items-center gap-4">
              {/* Nota */}
              <div className="w-16 text-right">
                <span className="text-lg font-bold text-foreground">
                  {item.notaMedia.toFixed(1)} ⭐
                </span>
              </div>

              {/* Barra */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-8 overflow-hidden">
                    <div
                      className={`${getNotaColor(item.notaMedia)} h-full flex items-center justify-end pr-2 transition-all duration-500`}
                      style={{ width: `${getBarWidth(item.quantidade)}%` }}
                    >
                      <span className="text-white text-xs font-medium">
                        {item.quantidade}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Porcentagem */}
              <div className="w-20 text-right">
                <span className="text-sm text-muted-foreground">
                  {item.porcentagem.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}

          {/* Resumo */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Total:</strong> {totalLojas} lojas analisadas
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Mostrando quantas lojas têm cada nota média
            </p>
          </div>
        </div>
        )}
      </CardContent>
    </Card>
  );
}

