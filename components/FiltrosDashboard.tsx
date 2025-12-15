'use client';

import { useState, useMemo } from 'react';
import type { FiltrosDashboard, Regiao, EstadoUF } from '@/types';
import { getEstados, getRegioes, getEstadosPorRegiao, getRegionais, getLojasDisponiveis } from '@/data/lojas';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatarNomeLoja, ordenarLojasPorCodigo } from '@/lib/lojaUtils';

interface FiltrosDashboardProps {
  filtros: FiltrosDashboard;
  onFiltrosChange: (filtros: FiltrosDashboard) => void;
}

export default function FiltrosDashboardComponent({
  filtros,
  onFiltrosChange,
}: FiltrosDashboardProps) {
  const [regioes] = useState<Regiao[]>(getRegioes() as Regiao[]);

  // Estados disponíveis: todos se não houver região, ou filtrados por região
  const estadosDisponiveis = useMemo(() => {
    if (filtros.regiao) {
      return getEstadosPorRegiao(filtros.regiao) as EstadoUF[];
    }
    // Se não há região selecionada, mostra todos os estados
    return getEstados() as EstadoUF[];
  }, [filtros.regiao]);

  // Regionais disponíveis baseados na região e/ou estado selecionados
  const regionaisDisponiveis = useMemo(() => {
    return getRegionais({
      regiao: filtros.regiao,
      estado: filtros.estado,
    });
  }, [filtros.regiao, filtros.estado]);

  // Lojas disponíveis baseadas nos filtros de região, estado e regional, ordenadas por código
  const lojasDisponiveis = useMemo(() => {
    const lojas = getLojasDisponiveis({
      regiao: filtros.regiao,
      estado: filtros.estado,
      regional: filtros.regional,
    });
    return ordenarLojasPorCodigo(lojas);
  }, [filtros.regiao, filtros.estado, filtros.regional]);

  const handleChange = (
    campo: keyof FiltrosDashboard,
    valor: string | Date | undefined
  ) => {
    // Converte valores sentinelas para undefined (representa "todos")
    const valorFinal = valor === '__all__' || valor === '' ? undefined : valor;
    
    const novosFiltros: FiltrosDashboard = {
      ...filtros,
      [campo]: valorFinal,
    };

    // Implementa cascata opcional: quando um filtro "pai" muda, limpa os filtros "filhos"
    // Mas permite filtros independentes para maior flexibilidade
    if (campo === 'regiao') {
      // Ao mudar região, limpa estado, regional e loja (mas permite usar apenas região)
      if (valorFinal) {
        novosFiltros.estado = undefined;
        novosFiltros.regional = undefined;
        novosFiltros.lojaId = undefined;
      }
    } else if (campo === 'estado') {
      // Ao mudar estado, limpa regional e loja (mas mantém região se houver)
      if (valorFinal) {
        novosFiltros.regional = undefined;
        novosFiltros.lojaId = undefined;
      }
    } else if (campo === 'regional') {
      // Ao mudar regional, limpa loja (mas mantém região e estado se houverem)
      if (valorFinal) {
        novosFiltros.lojaId = undefined;
      }
    }
    // Ao mudar loja ou limpar qualquer filtro, não limpa outros

    onFiltrosChange(novosFiltros);
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Região */}
          <Select
            value={filtros.regiao || '__all__'}
            onValueChange={(value) => handleChange('regiao', value)}
          >
            <SelectTrigger className={cn(
              'w-[180px]',
              filtros.regiao && 'bg-primary text-primary-foreground border-primary'
            )}>
              <SelectValue placeholder="🌍 Todo Brasil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">🌍 Todo Brasil</SelectItem>
              {regioes.map((regiao) => (
                <SelectItem key={regiao} value={regiao}>
                  {regiao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Estado */}
          <Select
            value={filtros.estado || '__all__'}
            onValueChange={(value) => handleChange('estado', value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="📍 Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">📍 Todos</SelectItem>
              {estadosDisponiveis.map((estado) => (
                <SelectItem key={estado} value={estado}>
                  {estado}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Regional (Time) */}
          <Select
            value={filtros.regional || '__all__'}
            onValueChange={(value) => handleChange('regional', value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="🏢 Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">🏢 Todas</SelectItem>
              {regionaisDisponiveis.map((regional) => (
                <SelectItem key={regional} value={regional}>
                  {regional}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Loja */}
          <Select
            value={filtros.lojaId || '__all__'}
            onValueChange={(value) => handleChange('lojaId', value)}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="🏪 Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">🏪 Todas</SelectItem>
              {lojasDisponiveis.map((loja) => (
                <SelectItem key={loja.id} value={loja.id}>
                  {formatarNomeLoja(loja)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

