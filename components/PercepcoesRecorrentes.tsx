'use client';

import type { AnalisePercepcoes } from '@/services/perceptionsAnalysisService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PercepcoesRecorrentesProps {
  percepcoes: AnalisePercepcoes;
  titulo?: string;
}

export default function PercepcoesRecorrentesComponent({
  percepcoes,
  titulo = 'Percepções Recorrentes',
}: PercepcoesRecorrentesProps) {
  const getBarWidth = (porcentagem: number) => {
    return porcentagem;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>

      {/* Percepções Positivas */}
      <div className="mb-8">
        <h4 className="text-md font-semibold text-green-700 mb-4 flex items-center gap-2">
          <span>✅</span> Percepções Positivas Recorrentes
        </h4>
        {percepcoes.positivas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma percepção positiva identificada</p>
        ) : (
          <div className="space-y-4">
            {percepcoes.positivas.map((positiva, index) => (
              <div key={index} className="border border-green-200 rounded-lg p-4 bg-green-50">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-semibold text-foreground">{positiva.categoria}</h5>
                  <span className="text-lg font-bold text-green-700">
                    {positiva.porcentagem}%
                  </span>
                </div>

                {/* Barra de porcentagem */}
                <div className="mb-3">
                  <div className="bg-green-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-green-500 h-full transition-all duration-500"
                      style={{ width: `${getBarWidth(positiva.porcentagem)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Lojas destacadas */}
                {positiva.lojasDestacadas.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-muted-foreground mb-1">
                      <strong>Lojas destacadas:</strong>
                    </p>
                    <p className="text-xs text-orange-600 font-medium">
                      {positiva.lojasDestacadas.join(', ')}
                    </p>
                  </div>
                )}

                {/* Descrição */}
                <p className="text-sm text-foreground mt-2">{positiva.descricao}</p>

                {/* Exemplos (se disponíveis) */}
                {positiva.exemplos.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Exemplos:</p>
                    <div className="space-y-1">
                      {positiva.exemplos.slice(0, 2).map((exemplo, idx) => (
                        <p key={idx} className="text-xs text-muted-foreground italic">
                          "{exemplo}"
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Percepções Negativas */}
      <div>
        <h4 className="text-md font-semibold text-red-700 mb-4 flex items-center gap-2">
          <span>❌</span> Percepções Negativas Recorrentes
        </h4>
        {percepcoes.negativas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma percepção negativa identificada</p>
        ) : (
          <div className="space-y-4">
            {percepcoes.negativas.map((negativa, index) => (
              <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-semibold text-foreground">{negativa.categoria}</h5>
                  <span className="text-lg font-bold text-red-700">
                    {negativa.porcentagem}%
                  </span>
                </div>

                {/* Barra de porcentagem */}
                <div className="mb-3">
                  <div className="bg-red-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-red-500 h-full transition-all duration-500"
                      style={{ width: `${getBarWidth(negativa.porcentagem)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Lojas problemáticas */}
                {negativa.lojasProblematicas.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-muted-foreground mb-1">
                      <strong>Lojas mais problemáticas:</strong>
                    </p>
                    <p className="text-xs text-orange-600 font-medium">
                      {negativa.lojasProblematicas.join(', ')}
                    </p>
                  </div>
                )}

                {/* Descrição */}
                <p className="text-sm text-foreground mt-2">{negativa.descricao}</p>

                {/* Casos graves */}
                {negativa.casosGraves && negativa.casosGraves.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-red-300">
                    <p className="text-xs font-semibold text-red-700 mb-2">
                      ⚠️ Casos Graves:
                    </p>
                    <div className="space-y-2">
                      {negativa.casosGraves.map((caso, idx) => (
                        <div key={idx} className="bg-red-100 rounded p-2">
                          <p className="text-xs font-medium text-red-800">{caso.loja}</p>
                          {caso.valor && (
                            <p className="text-xs text-red-700 font-semibold">
                              Valor: R$ {caso.valor.toFixed(2)}
                            </p>
                          )}
                          <p className="text-xs text-foreground mt-1">{caso.descricao}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Exemplos */}
                {negativa.exemplos.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Exemplos:</p>
                    <div className="space-y-1">
                      {negativa.exemplos.slice(0, 2).map((exemplo, idx) => (
                        <p key={idx} className="text-xs text-muted-foreground italic">
                          "{exemplo}"
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      </CardContent>
    </Card>
  );
}

