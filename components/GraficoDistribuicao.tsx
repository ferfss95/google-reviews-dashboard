'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Distribuicao {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

interface GraficoDistribuicaoProps {
  distribuicao: Distribuicao;
  titulo?: string;
}

export default function GraficoDistribuicao({
  distribuicao,
  titulo = 'Distribuição de Avaliações',
}: GraficoDistribuicaoProps) {
  const dados = [
    { nota: '1 ⭐', quantidade: distribuicao[1], porcentagem: 0 },
    { nota: '2 ⭐⭐', quantidade: distribuicao[2], porcentagem: 0 },
    { nota: '3 ⭐⭐⭐', quantidade: distribuicao[3], porcentagem: 0 },
    { nota: '4 ⭐⭐⭐⭐', quantidade: distribuicao[4], porcentagem: 0 },
    { nota: '5 ⭐⭐⭐⭐⭐', quantidade: distribuicao[5], porcentagem: 0 },
  ];

  const total = Object.values(distribuicao).reduce((acc, val) => acc + val, 0);

  const dadosComPorcentagem = dados.map((item) => ({
    ...item,
    porcentagem: total > 0 ? ((item.quantidade / total) * 100).toFixed(1) : 0,
  }));

  const cores = {
    1: '#ef4444', // red
    2: '#f97316', // orange
    3: '#f97316', // orange (3 estrelas também laranja)
    4: '#22c55e', // green
    5: '#22c55e', // green
  };

  // Ordena do maior para o menor (5 estrelas primeiro)
  const dadosOrdenados = [...dadosComPorcentagem].reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
        <BarChart 
          data={dadosOrdenados}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis 
            type="category" 
            dataKey="nota" 
            tick={{ fontSize: 12 }} 
            width={80}
          />
          <Tooltip
            formatter={(value: number, name: string, props: any) => [
              `${value} (${props.payload.porcentagem}%)`,
              'Quantidade',
            ]}
          />
          <Bar
            dataKey="quantidade"
            name="Quantidade de Avaliações"
            radius={[0, 8, 8, 0]}
          >
            {dadosOrdenados.map((entry, index) => {
              const nota = parseInt(entry.nota.split(' ')[0]);
              return (
                <Cell 
                  key={`cell-${index}`} 
                  fill={cores[nota as keyof typeof cores]}
                />
              );
            })}
          </Bar>
        </BarChart>
        </ResponsiveContainer>
        {total === 0 && (
          <div className="text-center text-muted-foreground py-8">
            Nenhuma avaliação disponível
          </div>
        )}
      </CardContent>
    </Card>
  );
}

