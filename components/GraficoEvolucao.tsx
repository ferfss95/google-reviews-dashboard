'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DadoEvolucao {
  data: string;
  notaMedia: number;
  total: number;
}

interface GraficoEvolucaoProps {
  dados: DadoEvolucao[];
  titulo?: string;
}

export default function GraficoEvolucao({
  dados,
  titulo = 'Evolução da Nota Média',
}: GraficoEvolucaoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
        <LineChart data={dados}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="data"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            domain={[0, 5]}
            tick={{ fontSize: 12 }}
            label={{ value: 'Nota Média', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            formatter={(value: number) => value.toFixed(2)}
            labelFormatter={(label) => `Período: ${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="notaMedia"
            stroke="#dc2626"
            strokeWidth={2}
            name="Nota Média"
            dot={{ r: 4, fill: '#dc2626' }}
            activeDot={{ r: 6, fill: '#b91c1c' }}
          />
        </LineChart>
        </ResponsiveContainer>
        {dados.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            Nenhum dado disponível para o período selecionado
          </div>
        )}
      </CardContent>
    </Card>
  );
}

