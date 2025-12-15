'use client';

import type { RankingLoja } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { formatarNomeLojaComCodigo } from '@/lib/lojaUtils';

interface TabelaRankingProps {
  rankings: RankingLoja[];
  tipo: 'melhores' | 'piores';
  titulo?: string;
}

export default function TabelaRanking({
  rankings,
  tipo,
  titulo,
}: TabelaRankingProps) {
  const getPosicaoBadge = (posicao: number) => {
    if (posicao === 1) return '🥇';
    if (posicao === 2) return '🥈';
    if (posicao === 3) return '🥉';
    return `#${posicao}`;
  };

  const getNotaColor = (nota: number) => {
    if (nota >= 4.5) return 'text-green-600 font-bold';
    if (nota >= 4.0) return 'text-green-500';
    if (nota >= 3.5) return 'text-yellow-600';
    if (nota >= 3.0) return 'text-orange-500';
    return 'text-destructive';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {titulo || `Ranking das ${tipo === 'melhores' ? 'Melhores' : 'Piores'} Lojas`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rankings.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Nenhum dado disponível
          </div>
        ) : (
          <div>
            <Table>
              <TableHeader>
                <TableRow className="bg-primary">
                  <TableHead className="text-primary-foreground w-20">Posição</TableHead>
                  <TableHead className="text-primary-foreground">Loja</TableHead>
                  <TableHead className="text-primary-foreground w-20">Estado</TableHead>
                  <TableHead className="text-primary-foreground w-32">Região</TableHead>
                  <TableHead className="text-primary-foreground w-28">Nota Média</TableHead>
                  <TableHead className="text-primary-foreground w-32">Total Avaliações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankings.map((ranking) => (
                  <TableRow key={ranking.loja_id}>
                    <TableCell className="font-medium">
                      {getPosicaoBadge(ranking.posicao)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatarNomeLojaComCodigo(ranking.nome, ranking.codigo)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{ranking.estado}</TableCell>
                    <TableCell className="text-muted-foreground">{ranking.regiao}</TableCell>
                    <TableCell className={cn('text-sm', getNotaColor(ranking.notaMedia))}>
                      {ranking.notaMedia.toFixed(2)} ⭐
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ranking.totalAvaliacoes}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

