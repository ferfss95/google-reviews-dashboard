'use client';

import { useState, useMemo } from 'react';
import type { Avaliacao } from '@/types';
import { enriquecerAvaliacoes } from '@/services/avaliacaoDetailService';
import type { AvaliacaoEnriquecida } from '@/services/avaliacaoDetailService';
import type { CategoriaComentario, Sentimento } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AvaliacoesDetalhadasProps {
  avaliacoes: Avaliacao[];
  lojas: Array<{ id: string; nome: string; codigo?: string }>;
}

const CORES_SENTIMENTO = {
  positivo: 'bg-green-100 text-green-800 border-green-200',
  neutro: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  negativo: 'bg-destructive/10 text-destructive border-destructive/20',
};

const CORES_CATEGORIA = {
  Atendimento: 'bg-muted text-foreground',
  Ambiente: 'bg-muted text-foreground',
  'Tempo de Espera': 'bg-muted text-foreground',
  Produtos: 'bg-muted text-foreground',
  Preços: 'bg-muted text-foreground',
  Outros: 'bg-muted text-foreground',
};

const ITENS_POR_PAGINA = 10;

export default function AvaliacoesDetalhadasComponent({
  avaliacoes,
  lojas,
}: AvaliacoesDetalhadasProps) {
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaComentario | 'Todas'>('Todas');
  const [filtroSentimento, setFiltroSentimento] = useState<Sentimento | 'Todos'>('Todos');
  const [comentariosExpandidos, setComentariosExpandidos] = useState<Set<string>>(new Set());

  // Enriquece avaliações com categoria e sentimento
  const avaliacoesEnriquecidas = useMemo(() => {
    return enriquecerAvaliacoes(avaliacoes, lojas);
  }, [avaliacoes, lojas]);

  // Filtra avaliações
  const avaliacoesFiltradas = useMemo(() => {
    let filtradas = avaliacoesEnriquecidas;

    if (filtroCategoria !== 'Todas') {
      filtradas = filtradas.filter((av) => av.categoria === filtroCategoria);
    }

    if (filtroSentimento !== 'Todos') {
      filtradas = filtradas.filter((av) => av.sentimento === filtroSentimento);
    }

    // Ordena por data mais recente primeiro
    filtradas.sort((a, b) => {
      const dataA = a.data_avaliacao_maps || a.data;
      const dataB = b.data_avaliacao_maps || b.data;
      return dataB.getTime() - dataA.getTime();
    });

    return filtradas;
  }, [avaliacoesEnriquecidas, filtroCategoria, filtroSentimento]);

  // Paginação
  const totalPaginas = Math.ceil(avaliacoesFiltradas.length / ITENS_POR_PAGINA);
  const indiceInicial = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const indiceFinal = indiceInicial + ITENS_POR_PAGINA;
  const avaliacoesPagina = avaliacoesFiltradas.slice(indiceInicial, indiceFinal);

  // Atualiza página quando filtros mudam
  useMemo(() => {
    setPaginaAtual(1);
  }, [filtroCategoria, filtroSentimento]);

  const toggleComentario = (avaliacaoId: string) => {
    const novosExpandidos = new Set(comentariosExpandidos);
    if (novosExpandidos.has(avaliacaoId)) {
      novosExpandidos.delete(avaliacaoId);
    } else {
      novosExpandidos.add(avaliacaoId);
    }
    setComentariosExpandidos(novosExpandidos);
  };

  const renderEstrelas = (nota: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((estrela) => (
          <span
            key={estrela}
            className={`text-lg ${
              estrela <= nota ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const categoriasDisponiveis: CategoriaComentario[] = [
    'Atendimento',
    'Ambiente',
    'Tempo de Espera',
    'Produtos',
    'Preços',
    'Outros',
  ];

  const sentimentosDisponiveis: Sentimento[] = ['positivo', 'neutro', 'negativo'];

  if (avaliacoes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Avaliações Detalhadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Não há avaliações disponíveis
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl">Avaliações Detalhadas</CardTitle>
          <div className="flex items-center gap-3">
            {/* Filtro de Categoria */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-foreground">Filtros:</label>
              <Select
                value={filtroCategoria}
                onValueChange={(value) => setFiltroCategoria(value as CategoriaComentario | 'Todas')}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todas as Categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas as Categorias</SelectItem>
                  {categoriasDisponiveis.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Sentimento */}
            <div className="flex items-center gap-2">
              <Select
                value={filtroSentimento}
                onValueChange={(value) => setFiltroSentimento(value as Sentimento | 'Todos')}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos os Sentimentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos os Sentimentos</SelectItem>
                  <SelectItem value="positivo">Positivo</SelectItem>
                  <SelectItem value="neutro">Neutro</SelectItem>
                  <SelectItem value="negativo">Negativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Subtítulo */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">Avaliações Recentes</p>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary">
                <TableHead className="text-primary-foreground">Data</TableHead>
                <TableHead className="text-primary-foreground">Loja</TableHead>
                <TableHead className="text-primary-foreground">Nota</TableHead>
                <TableHead className="text-primary-foreground">Comentário</TableHead>
                <TableHead className="text-primary-foreground">Categoria</TableHead>
                <TableHead className="text-primary-foreground">Sentimento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {avaliacoesPagina.map((avaliacao) => {
              const data = avaliacao.data_avaliacao_maps || avaliacao.data;
              const estaExpandido = comentariosExpandidos.has(avaliacao.id);
              const comentarioCompleto = avaliacao.comentario || '';
              const comentarioResumido =
                comentarioCompleto.length > 100
                  ? comentarioCompleto.substring(0, 100) + '...'
                  : comentarioCompleto;

                return (
                  <TableRow key={avaliacao.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {(() => {
                        const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
                        const dia = String(data.getDate()).padStart(2, '0');
                        const mes = meses[data.getMonth()];
                        const ano = data.getFullYear();
                        return `${dia} ${mes} ${ano}`;
                      })()}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {avaliacao.nomeLoja || 'Loja não identificada'}
                    </TableCell>
                    <TableCell>{renderEstrelas(avaliacao.nota)}</TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-start gap-2">
                        {comentarioCompleto.length > 100 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleComentario(avaliacao.id)}
                            className="h-auto p-0 mt-0.5 flex-shrink-0"
                          >
                            {estaExpandido ? '▲' : '▼'}
                          </Button>
                        )}
                        <span className="flex-1">
                          {estaExpandido ? comentarioCompleto : comentarioResumido}
                          {!comentarioCompleto && (
                            <span className="text-muted-foreground italic">Sem comentário</span>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn(CORES_CATEGORIA[avaliacao.categoria] || CORES_CATEGORIA.Outros)}>
                        {avaliacao.categoria}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(CORES_SENTIMENTO[avaliacao.sentimento])}>
                        {avaliacao.sentimento.charAt(0).toUpperCase() +
                          avaliacao.sentimento.slice(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {indiceInicial + 1}-{Math.min(indiceFinal, avaliacoesFiltradas.length)} de{' '}
            {avaliacoesFiltradas.length} avaliações
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
              disabled={paginaAtual === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {paginaAtual} de {totalPaginas}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaAtual === totalPaginas}
            >
              Próxima
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
