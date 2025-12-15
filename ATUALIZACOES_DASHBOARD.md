# 📊 Atualizações do Dashboard

## ✅ Mudanças Implementadas

### 1. **Período Padrão: 01/01/2025 até hoje**
- O dashboard agora inicia com a data inicial padrão de **01 de janeiro de 2025**
- Data final padrão é a **data atual**
- O usuário pode alterar essas datas nos filtros

### 2. **Filtro de Datas Funcional**
- As datas são aplicadas automaticamente quando o usuário as altera
- As avaliações são filtradas pelo período selecionado
- Filtro funciona em tempo real - não precisa recarregar a página

### 3. **Todas as Lojas Centauro Adicionadas**
Foram adicionadas **20 lojas** cobrindo todos os estados principais:

#### Sudeste (11 lojas):
- **São Paulo (7 lojas)**:
  - Shopping Iguatemi
  - Shopping Center Norte
  - MorumbiTown
  - Shopping Center Leste
  - Shopping Eldorado
  - Shopping Center Sul
  - Shopping Villa Lobos
- **Rio de Janeiro (3 lojas)**:
  - Shopping RioMar Kennedy
  - Shopping Tijuca
  - Shopping Barra
- **Belo Horizonte (1 loja)**:
  - Shopping BH

#### Nordeste (3 lojas):
- **Fortaleza (1 loja)**: RioMar Fortaleza
- **Recife (1 loja)**: Shopping Recife
- **Salvador (1 loja)**: Shopping Salvador

#### Sul (2 lojas):
- **Porto Alegre (1 loja)**: Shopping Praia de Belas
- **Curitiba (1 loja)**: Shopping Curitiba

#### Centro-Oeste (2 lojas):
- **Brasília (1 loja)**: Shopping Brasília
- **Goiânia (1 loja)**: Shopping Goiânia

#### Norte (2 lojas):
- **Belém (1 loja)**: Shopping Belém
- **Manaus (1 loja)**: Shopping Manaus

### 4. **Melhorias no Dashboard**
- Informação do período selecionado exibida no dashboard
- Contador de avaliações no período
- Mensagem explicativa sobre o filtro de datas
- Validação de datas (não permite datas futuras)

## 🎯 Como Funciona

### Filtro de Datas
1. **Padrão**: Inicia com 01/01/2025 até hoje
2. **Alteração**: Usuário pode alterar qualquer data nos campos de filtro
3. **Aplicação**: As avaliações são filtradas automaticamente quando as datas mudam
4. **Visualização**: Todos os gráficos e métricas são atualizados instantaneamente

### Busca de Avaliações
- A busca traz todas as avaliações disponíveis da API (até 5 por loja)
- O filtro de datas é aplicado após buscar os dados
- Se uma avaliação estiver fora do período, ela não aparece nos gráficos

### Limitações
- A Google Places API retorna apenas **5 reviews** por loja
- Não é possível filtrar por data diretamente na API
- O filtro é aplicado após buscar todos os dados

## 📝 Notas Importantes

1. **Cache**: As avaliações são cacheadas por 1 hora. Para ver dados atualizados, clique em "🔄 Atualizar Dados do Maps"

2. **Datas**: O filtro funciona comparando a data da avaliação com o período selecionado. Avaliações fora do período não aparecem nos resultados.

3. **Performance**: Com 20 lojas, pode levar alguns segundos para buscar todas as avaliações na primeira vez.

## 🚀 Próximos Passos Sugeridos

- [ ] Adicionar mais lojas Centauro se necessário
- [ ] Implementar histórico de avaliações (armazenar em banco de dados)
- [ ] Adicionar exportação de relatórios por período
- [ ] Implementar gráficos comparativos entre períodos

