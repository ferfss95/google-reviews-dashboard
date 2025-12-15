# 📝 Documentação dos Prompts de IA

Este documento detalha os prompts utilizados para análise qualitativa das avaliações.

## 🎯 Visão Geral

O sistema utiliza a API da OpenAI (GPT-4) para analisar comentários textuais das avaliações do Google Maps e gerar insights acionáveis em diferentes níveis (macro e micro).

## 📊 Análise Macro

**Escopo**: Rede inteira, região ou estado

**Arquivo**: `services/aiAnalysisService.ts` - Método `criarPromptMacro()`

**Prompt**:
```
Você é um analista especializado em avaliar o desempenho de lojas físicas de varejo esportivo.

Analise os seguintes comentários de clientes sobre lojas da Centauro [ESCOPO].

Comentários dos clientes:
[LISTA DE COMENTÁRIOS NUMERADOS]

Gere uma análise estruturada com os seguintes elementos:

1. **Pontos Fortes** (até 5 itens): Principais aspectos positivos mencionados pelos clientes
2. **Pontos Fracos** (até 5 itens): Principais problemas ou reclamações recorrentes
3. **Tendências** (até 3 itens): Padrões de satisfação/insatisfação identificados
4. **Oportunidades** (até 4 itens): Sugestões práticas de melhorias

Responda APENAS em formato JSON válido, sem markdown, seguindo este formato exato:
{
  "pontosFortes": ["item1", "item2", ...],
  "pontosFracos": ["item1", "item2", ...],
  "tendencias": ["item1", "item2", ...],
  "oportunidades": ["item1", "item2", ...]
}
```

**Variáveis**:
- `[ESCOPO]`: Substituído por "em toda a rede", "na região X" ou "no estado Y"
- `[LISTA DE COMENTÁRIOS]`: Lista numerada dos comentários (limitada a 500)

**Resposta Esperada**:
```json
{
  "pontosFortes": [
    "Atendimento rápido e eficiente",
    "Boa variedade de produtos esportivos",
    "Ambiente organizado e limpo"
  ],
  "pontosFracos": [
    "Falta de estoque em alguns tamanhos",
    "Fila de caixa em horários de pico",
    "Preços podem ser mais competitivos"
  ],
  "tendencias": [
    "Clientes valorizam atendimento personalizado",
    "Insatisfação relacionada a disponibilidade de produtos"
  ],
  "oportunidades": [
    "Implementar sistema de reserva online",
    "Expandir horário de atendimento",
    "Programa de fidelidade mais visível"
  ]
}
```

## 🏪 Análise Micro

**Escopo**: Loja individual

**Arquivo**: `services/aiAnalysisService.ts` - Método `criarPromptMicro()`

**Prompt**:
```
Você é um consultor especializado em análise de experiência do cliente em lojas físicas.

Analise os comentários de clientes sobre a loja "[NOME_LOJA]" ([CIDADE], [ESTADO]).

Comentários dos clientes:
[LISTA DE COMENTÁRIOS NUMERADOS]

Gere uma análise detalhada e acionável com os seguintes elementos:

1. **Resumo** (1 parágrafo): Visão geral da percepção dos clientes sobre esta loja
2. **Pontos Fortes** (até 5 itens): Destaques positivos específicos desta loja
3. **Pontos Fracos** (até 5 itens): Problemas específicos mencionados
4. **Reclamações Frequentes** (até 5 itens): Reclamações que aparecem múltiplas vezes
5. **Destaques Positivos** (até 3 itens): Aspectos únicos que os clientes valorizam
6. **Planos de Ação** (até 4 itens): Ações práticas e específicas para melhorar

Responda APENAS em formato JSON válido, sem markdown, seguindo este formato exato:
{
  "resumo": "texto do resumo",
  "pontosFortes": ["item1", "item2", ...],
  "pontosFracos": ["item1", "item2", ...],
  "reclamacoesFrequentes": ["item1", "item2", ...],
  "destaquesPositivos": ["item1", "item2", ...],
  "planosAcao": ["item1", "item2", ...]
}
```

**Variáveis**:
- `[NOME_LOJA]`: Nome da loja
- `[CIDADE]`: Cidade da loja
- `[ESTADO]`: Estado (UF) da loja
- `[LISTA DE COMENTÁRIOS]`: Lista numerada dos comentários (limitada a 500)

**Resposta Esperada**:
```json
{
  "resumo": "A loja apresenta avaliações positivas em geral, com destaque para o atendimento cordial dos funcionários e a organização do espaço. No entanto, há reclamações recorrentes sobre falta de estoque em modelos populares e preços elevados em relação à concorrência.",
  "pontosFortes": [
    "Funcionários atenciosos e bem treinados",
    "Ambiente limpo e organizado",
    "Boa localização com fácil acesso"
  ],
  "pontosFracos": [
    "Falta frequente de produtos em estoque",
    "Preços acima da média do mercado",
    "Fila de espera em horários de pico"
  ],
  "reclamacoesFrequentes": [
    "Produto anunciado não disponível na loja",
    "Preços mais altos que outras lojas",
    "Demora no atendimento em finais de semana"
  ],
  "destaquesPositivos": [
    "Conhecimento técnico dos vendedores sobre produtos",
    "Política de troca facilitada",
    "Estacionamento amplo e gratuito"
  ],
  "planosAcao": [
    "Implementar sistema de consulta de estoque online em tempo real",
    "Revisar estratégia de precificação para melhorar competitividade",
    "Aumentar efetivo de funcionários nos horários de maior movimento",
    "Criar programa de reserva de produtos via aplicativo"
  ]
}
```

## ⚙️ Configurações da API

**Modelo**: `gpt-4-turbo-preview` (configurável via variável de ambiente)

**Temperatura**: `0.7` (balanceia criatividade e consistência)

**Formato de Resposta**: `JSON Object` (garante resposta estruturada)

**System Message**: 
```
Você é um analista especializado em experiência do cliente e análise de avaliações de lojas físicas. Sempre responda em formato JSON válido.
```

## 🔧 Customização

Para ajustar os prompts:

1. **Edite os métodos** `criarPromptMacro()` e `criarPromptMicro()` em `services/aiAnalysisService.ts`
2. **Ajuste a temperatura** no construtor da classe `AIAnalysisService`
3. **Altere o modelo** via variável de ambiente ou configuração

## 📈 Limitações e Otimizações

### Limites Atuais
- **Máximo de comentários**: 500 por análise (para evitar exceder limites de tokens)
- **Cache**: Análises são cacheadas por 1 hora para reduzir custos

### Otimizações Futuras
- Agrupamento inteligente de comentários similares antes da análise
- Análise incremental (apenas novos comentários)
- Batch processing para múltiplas análises
- Suporte a outros modelos de IA (Claude, Gemini, etc.)

## 💡 Exemplos de Uso

### Exemplo 1: Análise da Rede Inteira
```typescript
const analise = await gerarAnaliseQualitativa(
  todasAvaliacoes,
  todasLojas,
  {} // Sem filtros = rede inteira
);
```

### Exemplo 2: Análise por Região
```typescript
const analise = await gerarAnaliseQualitativa(
  avaliacoes,
  lojas,
  { regiao: 'Sudeste' }
);
```

### Exemplo 3: Análise de Loja Individual
```typescript
const analise = await gerarAnaliseQualitativa(
  avaliacoes,
  lojas,
  { lojaId: 'loja-001' }
);
```

## 🔍 Validação e Qualidade

O sistema inclui:
- **Validação de JSON**: Parsing seguro com tratamento de erros
- **Valores padrão**: Retorna arrays vazios se campos ausentes
- **Fallback**: Retorna análise mockada se API falhar (modo desenvolvimento)

## 📝 Notas Importantes

1. **Custos**: Cada análise consome tokens da API OpenAI. O cache reduz chamadas repetidas.
2. **Qualidade**: O modelo GPT-4 produz análises de alta qualidade, mas revisão humana é recomendada para decisões críticas.
3. **Idioma**: Os prompts são em português brasileiro para análises mais precisas.
4. **Privacidade**: Comentários são enviados para a API da OpenAI. Revise políticas de privacidade antes de produção.

