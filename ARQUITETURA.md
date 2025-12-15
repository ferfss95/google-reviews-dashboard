# 🏗️ Arquitetura do Sistema

Este documento descreve a arquitetura do Dashboard de Avaliações da Centauro.

## 📐 Visão Geral

O sistema é uma aplicação Next.js full-stack que coleta, processa e analisa avaliações do Google Maps para gerar insights sobre o desempenho das lojas físicas.

```
┌─────────────────────────────────────────────────────────────┐
│                        Cliente Web                          │
│                    (Next.js Frontend)                       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTP/REST API
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    Next.js API Routes                       │
│  ┌──────────────────┐  ┌──────────────────────────────┐    │
│  │ /api/avaliacoes  │  │ /api/analise-qualitativa     │    │
│  └────────┬─────────┘  └────────────┬─────────────────┘    │
└───────────┼──────────────────────────┼───────────────────────┘
            │                          │
            │                          │
┌───────────▼──────────┐  ┌───────────▼──────────────────────┐
│  Maps MCPService     │  │  AI Analysis Service             │
│  (Google Maps MCP)   │  │  (OpenAI GPT-4)                  │
└───────────┬──────────┘  └──────────────────────────────────┘
            │
            │
┌───────────▼─────────────────────────────────────────────────┐
│              Analytics Service                              │
│  • Filtros                                                 │
│  • Cálculos de métricas                                    │
│  • Geração de rankings                                     │
│  • Distribuições                                           │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Fluxo de Dados

### 1. Coleta de Avaliações

```
Cliente → API Route → MapsMCPService → Google Maps MCP → Dados
                     ↓
                Cache (1h)
                     ↓
            Normalização
                     ↓
            Armazenamento (memória/DB)
```

**Passos detalhados**:

1. Cliente solicita avaliações via `/api/avaliacoes`
2. API Route chama `mapsMcpService.getAvaliacoesFromLojas()`
3. Serviço verifica cache
4. Se não houver cache, busca dados via MCP do Maps
5. Dados são normalizados para formato interno (`Avaliacao`)
6. Resposta serializada (JSON) retornada ao cliente

### 2. Análise Quantitativa

```
Avaliações → AnalyticsService → Métricas
    ↓
Filtros (Dashboard)
    ↓
Cálculos:
  • Nota média
  • Distribuição
  • Evolução temporal
  • Rankings
```

**Componentes envolvidos**:

- `analyticsService.ts`: Lógica de cálculo
- Componentes React: Visualização (gráficos, tabelas, KPIs)

### 3. Análise Qualitativa com IA

```
Avaliações (comentários) → AIAnalysisService → OpenAI API
                                ↓
                        Análise Estruturada
                                ↓
                        Cache (1h)
                                ↓
                        Resposta JSON
```

**Processo**:

1. Cliente solicita análise via `/api/analise-qualitativa`
2. Sistema filtra avaliações com comentários textuais
3. Limita a 500 comentários (para evitar exceder tokens)
4. Gera prompt específico (macro ou micro)
5. Chama OpenAI API (GPT-4)
6. Parseia resposta JSON
7. Cacheia resultado
8. Retorna ao cliente

## 📦 Componentes Principais

### Frontend (React/Next.js)

#### Páginas
- `app/page.tsx`: Dashboard principal com visão consolidada

#### Componentes Reutilizáveis
- `FiltrosDashboard.tsx`: Filtros globais (data, região, estado, loja)
- `KPICard.tsx`: Cards de métricas principais
- `GraficoEvolucao.tsx`: Gráfico de linha (evolução temporal)
- `GraficoDistribuicao.tsx`: Gráfico de barras (distribuição de notas)
- `TabelaRanking.tsx`: Tabela de rankings de lojas
- `AnaliseQualitativa.tsx`: Exibição de análise qualitativa com IA

### Backend (Next.js API Routes)

#### APIs
- `app/api/avaliacoes/route.ts`: Endpoint para buscar avaliações
- `app/api/analise-qualitativa/route.ts`: Endpoint para gerar análises com IA

### Serviços

#### `mapsMcpService.ts`
**Responsabilidade**: Integração com MCP do Google Maps

**Métodos principais**:
- `getPlaceDetails(placeId)`: Busca detalhes de um lugar
- `getAvaliacoesFromPlace(placeId, lojaId)`: Extrai e normaliza avaliações
- `getAvaliacoesFromLojas(lojas)`: Busca avaliações de múltiplas lojas
- `clearCache()`: Limpa cache

**Interface**:
```typescript
interface MapsMCPClient {
  getPlaceDetails(placeId: string): Promise<MapsPlaceDetails>;
}
```

**Cache**: 1 hora por `place_id`

#### `analyticsService.ts`
**Responsabilidade**: Análise quantitativa

**Funções principais**:
- `filtrarAvaliacoes()`: Aplica filtros do dashboard
- `calcularMetricas()`: Calcula métricas completas
- `gerarRanking()`: Gera rankings de lojas
- `calcularNotaMedia()`: Calcula nota média
- `calcularDistribuicao()`: Calcula distribuição de notas

#### `aiAnalysisService.ts`
**Responsabilidade**: Análise qualitativa com IA

**Métodos principais**:
- `analisarMacro()`: Análise para rede/região/estado
- `analisarMicro()`: Análise para loja individual
- `chamarIA()`: Comunicação com OpenAI API

**Configuração**:
- Modelo: GPT-4 Turbo (configurável)
- Temperatura: 0.7
- Formato: JSON Object

### Dados

#### `data/lojas.ts`
**Responsabilidade**: Banco de dados de lojas

**Estrutura**:
```typescript
interface Loja {
  id: string;
  nome: string;
  place_id: string;
  estado: EstadoUF;
  regiao: Regiao;
  endereco?: string;
  cidade?: string;
}
```

**Funções**:
- `getLojas(filtros)`: Busca lojas com filtros
- `getLojaById(id)`: Busca loja por ID
- `getEstados()`: Lista estados únicos
- `getRegioes()`: Lista regiões únicas

### Tipos

#### `types/index.ts`
Define todos os tipos TypeScript usados no sistema:
- `Loja`, `Avaliacao`, `AnaliseQualitativa`
- `MetricasQuantitativas`, `RankingLoja`
- `FiltrosDashboard`, `DistribuicaoNotas`
- `Regiao`, `EstadoUF`

## 🔌 Integração com MCP do Maps

### Estado Atual

O sistema está preparado para integração com o MCP padrão do Maps, mas atualmente usa um cliente mock para desenvolvimento.

### Como Integrar o MCP Real

1. **Configure o MCP no Cursor** (seguindo documentação oficial)

2. **Adapte o `mapsMcpService.ts`**:

```typescript
// Exemplo de integração (adaptar conforme API real do MCP)
import { initializeMapsMCP } from '@/services/mapsMcpService';

// Quando o MCP estiver disponível:
const mapsMCP = await getMapsMCPClient(); // Função do MCP

const client: MapsMCPClient = {
  async getPlaceDetails(placeId: string) {
    // Adaptar conforme API real
    const result = await mapsMCP.getPlaceDetails({ placeId });
    return {
      place_id: result.place_id,
      name: result.name,
      rating: result.rating,
      user_ratings_total: result.user_ratings_total,
      reviews: result.reviews.map(r => ({
        author_name: r.author_name,
        author_url: r.author_url,
        language: r.language,
        rating: r.rating,
        text: r.text,
        time: r.time,
        relative_time_description: r.relative_time_description,
      })),
    };
  },
};

initializeMapsMCP(client);
```

3. **Remova o cliente mock** após integração bem-sucedida

### Estrutura de Dados Esperada

O MCP deve retornar dados no formato `MapsPlaceDetails`:

```typescript
interface MapsPlaceDetails {
  place_id: string;
  name?: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  reviews?: MapsReview[];
}

interface MapsReview {
  author_name: string;
  author_url?: string;
  language: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number; // Unix timestamp
}
```

## 💾 Cache e Performance

### Estratégias de Cache

1. **Cache de Avaliações** (MapsMCPService)
   - TTL: 1 hora
   - Chave: `place:${placeId}`
   - Armazenamento: Memória (Map)

2. **Cache de Análises Qualitativas** (API Route)
   - TTL: 1 hora
   - Chave: JSON do escopo (`{lojaId, regiao, estado}`)
   - Armazenamento: Memória (Map)

### Otimizações

- **Lazy Loading**: Componentes pesados carregados sob demanda
- **Memoização**: `useMemo` para cálculos pesados no frontend
- **Batch Requests**: Busca avaliações de múltiplas lojas em paralelo
- **Limite de Dados**: Limita a 500 comentários por análise de IA

### Escalabilidade

Para produção em escala:

1. **Substituir cache em memória** por Redis
2. **Banco de dados** para persistência de avaliações
3. **Queue system** para processamento assíncrono de análises
4. **CDN** para assets estáticos
5. **Rate limiting** nas APIs

## 🔐 Segurança

### Boas Práticas Implementadas

- Variáveis de ambiente para chaves de API
- `.env` no `.gitignore`
- Validação de tipos (TypeScript)
- Sanitização de inputs (via Next.js)
- HTTPS em produção (via plataforma de deploy)

### Recomendações Adicionais

- Rate limiting nas APIs
- Autenticação/autorização para acesso ao dashboard
- Logs de auditoria
- Monitoramento de uso da API OpenAI

## 📊 Níveis de Análise

### Macro (Rede)
- Visão consolidada de todas as lojas
- Análise de tendências gerais
- Oportunidades estratégicas

### Intermediário (Região/Estado)
- Comparação entre regiões/estados
- Identificação de padrões regionais
- Ações regionais específicas

### Micro (Loja Individual)
- Análise detalhada de uma loja
- Planos de ação específicos
- Acompanhamento de melhorias

## 🚀 Próximos Passos Sugeridos

1. **Integração Real do MCP**: Configurar MCP do Maps real
2. **Banco de Dados**: Migrar de dados em memória para PostgreSQL/MongoDB
3. **Autenticação**: Implementar login/autorização
4. **Exportação**: Permitir exportar relatórios (PDF, Excel)
5. **Alertas**: Sistema de notificações para mudanças significativas
6. **Histórico**: Armazenar histórico de análises
7. **Comparações Temporais**: Comparar períodos diferentes
8. **Benchmarking**: Comparar com concorrência (se dados disponíveis)

## 📝 Notas de Implementação

- O sistema foi projetado para ser facilmente extensível
- Código modular permite substituição de componentes
- Tipos TypeScript garantem segurança de tipos
- Cache reduz custos de API e melhora performance
- Mock services permitem desenvolvimento sem dependências externas

