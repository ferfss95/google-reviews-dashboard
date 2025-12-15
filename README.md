# 📊 Dashboard de Avaliações - Centauro Store Analytics

Dashboard completo para análise de desempenho das lojas físicas da Centauro, utilizando avaliações coletadas do Google Maps através do MCP (Model Context Protocol) padrão disponível no Cursor.

## 🎯 Funcionalidades

### Análise Quantitativa
- **KPIs principais**: Nota média geral, total de avaliações, lojas analisadas
- **Evolução temporal**: Gráfico de linha mostrando a evolução da nota média ao longo do tempo
- **Distribuição de avaliações**: Visualização da distribuição por estrelas (1 a 5)
- **Rankings**: Tabelas comparativas das melhores e piores lojas

### Análise Qualitativa com IA
- **Nível Macro**: Análise da rede inteira, região ou estado
  - Principais pontos fortes
  - Principais pontos fracos
  - Tendências de satisfação/insatisfação
  - Oportunidades de melhoria

- **Nível Micro**: Análise individual por loja
  - Resumo executivo
  - Destaques positivos específicos
  - Reclamações frequentes
  - Planos de ação sugeridos

### Filtros Interativos
- Período (data inicial e final)
- Região (Norte, Nordeste, Centro-Oeste, Sudeste, Sul)
- Estado (UF)
- Loja específica

### Navegação Multi-nível
- **Macro**: Visão geral da rede
- **Intermediário**: Análise por região ou estado
- **Micro**: Análise detalhada por loja

## 🛠️ Tecnologias

- **Frontend**: Next.js 14 (App Router) + React 18
- **Estilização**: Tailwind CSS
- **Gráficos**: Recharts
- **Tipagem**: TypeScript
- **IA**: OpenAI API (GPT-4) para análise qualitativa
- **Integração**: MCP padrão do Google Maps (Cursor)

## 📋 Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn
- Conta OpenAI (para análise qualitativa)
- Cursor IDE com MCP do Maps configurado

## 🚀 Instalação

1. **Clone o repositório** (ou extraia os arquivos)

2. **Instale as dependências**:
```bash
npm install
# ou
yarn install
```

3. **Configure as variáveis de ambiente**:
```bash
cp .env.example .env
```

Edite o arquivo `.env` e adicione sua chave da OpenAI:
```
OPENAI_API_KEY=sk-your-api-key-here
```

4. **Configure as lojas**:
Edite o arquivo `data/lojas.ts` e adicione as lojas da Centauro com seus respectivos `place_id` do Google Maps.

Para obter o `place_id`:
- Acesse o Google Maps
- Busque pela loja
- Abra os detalhes do lugar
- O `place_id` pode ser encontrado na URL ou via API/MCP

5. **Inicie o servidor de desenvolvimento**:
```bash
npm run dev
# ou
yarn dev
```

6. **Acesse o dashboard**:
Abra [http://localhost:3000](http://localhost:3000) no navegador.

## 📁 Estrutura do Projeto

```
.
├── app/
│   ├── api/
│   │   ├── avaliacoes/
│   │   │   └── route.ts          # API para buscar avaliações via MCP
│   │   └── analise-qualitativa/
│   │       └── route.ts          # API para gerar análises com IA
│   ├── globals.css               # Estilos globais
│   ├── layout.tsx                # Layout raiz
│   └── page.tsx                  # Página principal do dashboard
├── components/
│   ├── AnaliseQualitativa.tsx   # Componente de análise qualitativa
│   ├── FiltrosDashboard.tsx     # Filtros globais
│   ├── GraficoDistribuicao.tsx  # Gráfico de distribuição
│   ├── GraficoEvolucao.tsx      # Gráfico de evolução temporal
│   ├── KPICard.tsx              # Cards de KPIs
│   └── TabelaRanking.tsx        # Tabela de rankings
├── data/
│   └── lojas.ts                  # Banco de dados de lojas
├── services/
│   ├── aiAnalysisService.ts     # Serviço de análise qualitativa com IA
│   ├── analyticsService.ts      # Serviço de análise quantitativa
│   └── mapsMcpService.ts        # Serviço de integração com MCP do Maps
├── types/
│   └── index.ts                 # Tipos TypeScript
├── .env.example                 # Exemplo de variáveis de ambiente
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

## 🔧 Configuração do Google Maps API

O projeto utiliza a **Google Places API** oficial para buscar avaliações reais do Google Maps.

### ⚡ Configuração Rápida

1. **Obtenha uma chave da API do Google Maps**:
   - Acesse [Google Cloud Console](https://console.cloud.google.com/)
   - Crie um projeto e habilite a **Places API**
   - Gere uma chave de API

2. **Adicione a chave no arquivo `.env`**:
   ```
   GOOGLE_MAPS_API_KEY=AIzaSuaChaveAqui
   ```

3. **Reinicie o servidor**:
   ```bash
   npm run dev
   ```

📖 **Para instruções detalhadas, consulte**: [`CONFIGURACAO_MAPS.md`](./CONFIGURACAO_MAPS.md)

### 🔍 Buscar Place IDs das Lojas

Use o script helper para encontrar place_ids:

```bash
node scripts/buscar-place-id.js "Centauro Shopping Iguatemi" SUA_CHAVE_API
```

Ou encontre manualmente:
1. Abra o Google Maps
2. Busque pela loja
3. Clique na loja → Compartilhar
4. O place_id aparece na URL ou nos detalhes

## 📝 Cadastrando Novas Lojas

Para adicionar uma nova loja ao sistema:

1. Abra o arquivo `data/lojas.ts`
2. Adicione um novo objeto no array `lojas`:

```typescript
{
  id: 'loja-XXX',              // ID único
  nome: 'Centauro Nome da Loja',
  place_id: 'ChIJ...',         // Place ID do Google Maps
  estado: 'SP',                // UF do estado
  regiao: 'Sudeste',           // Região do Brasil
  endereco: 'Endereço completo', // Opcional
  cidade: 'Nome da cidade',    // Opcional
}
```

3. O sistema automaticamente buscará avaliações para a nova loja na próxima atualização

## 🎨 Exemplos de Análises Geradas

### Análise Macro (Rede)
- **Pontos Fortes**: Atendimento rápido, variedade de produtos, ambiente organizado
- **Pontos Fracos**: Falta de estoque, filas em horários de pico
- **Tendências**: Clientes valorizam atendimento personalizado
- **Oportunidades**: Sistema de reserva online, expansão de horários

### Análise Micro (Loja Individual)
- **Resumo**: "A loja apresenta boa avaliação geral com destaque para atendimento..."
- **Destaques Positivos**: Funcionários atenciosos, localização privilegiada
- **Reclamações Frequentes**: Falta de produtos em estoque, preços elevados
- **Planos de Ação**: Revisar política de reposição, analisar estratégia de precificação

## 🔒 Segurança

- **Nunca commite** o arquivo `.env` no repositório
- Mantenha suas chaves de API seguras
- Use variáveis de ambiente para todas as configurações sensíveis
- O cache de avaliações reduz chamadas ao MCP, mas não armazena dados sensíveis

## 🚀 Deploy

### Vercel (Recomendado)

1. Faça push do código para um repositório Git
2. Conecte o repositório na Vercel
3. Configure as variáveis de ambiente:
   - `OPENAI_API_KEY`
4. Deploy automático!

### Outras Plataformas

O projeto é compatível com qualquer plataforma que suporte Next.js:
- Netlify
- Railway
- AWS Amplify
- Outras plataformas Node.js

## 🔄 Atualização de Dados

- **Cache**: As avaliações são cacheadas por 1 hora para evitar chamadas excessivas ao MCP
- **Atualização Manual**: Use o botão "🔄 Atualizar Dados do Maps" no dashboard
- **Atualização Automática**: Em produção, configure um cron job ou webhook para atualizações periódicas

## 📊 Performance

- Cache de avaliações (1 hora)
- Cache de análises qualitativas (1 hora)
- Lazy loading de componentes pesados
- Otimizações do Next.js (SSR, ISR)

## 🐛 Troubleshooting

### Erro: "OPENAI_API_KEY não configurada"
- Verifique se o arquivo `.env` existe e contém a chave
- Reinicie o servidor após adicionar a chave

### Erro: "Nenhuma loja encontrada"
- Verifique se há lojas cadastradas em `data/lojas.ts`
- Confirme que os `place_id` estão corretos

### Erro: "Falha ao buscar dados do Maps"
- Verifique se o MCP do Maps está configurado no Cursor
- Confirme que os `place_id` são válidos
- Verifique a conexão com a internet

### Análise qualitativa não aparece
- Verifique se há avaliações com comentários textuais
- Confirme que a chave da OpenAI está configurada
- Verifique os logs do console para erros

## 📚 Documentação Adicional

### Prompts de IA Utilizados

Os prompts para análise qualitativa estão documentados em:
- `services/aiAnalysisService.ts` - Métodos `criarPromptMacro()` e `criarPromptMicro()`

### Customização

Para personalizar o dashboard:
- **Cores**: Edite `tailwind.config.js`
- **KPIs**: Modifique `components/KPICard.tsx`
- **Gráficos**: Ajuste `components/Grafico*.tsx`
- **Análise IA**: Edite os prompts em `services/aiAnalysisService.ts`

## 🤝 Contribuindo

1. Faça fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é de uso interno da Centauro.

## 👥 Suporte

Para dúvidas ou problemas:
1. Verifique a seção Troubleshooting acima
2. Consulte os logs do console e do servidor
3. Entre em contato com a equipe de desenvolvimento

---

**Desenvolvido com ❤️ para análise de desempenho das lojas Centauro**

