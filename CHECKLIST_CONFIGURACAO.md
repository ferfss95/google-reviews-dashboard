# ✅ Checklist de Configuração - Google Maps API

## 🔍 O que verificar após adicionar a API Key

### 1. ✅ Chave no arquivo .env
- [x] Chave configurada: `GOOGLE_MAPS_API_KEY=AIza...`
- Status: ✅ **CONFIGURADO**

### 2. ⚠️ Place IDs das Lojas
- [ ] Verificar se as lojas têm `place_id` válidos (não "ChIJ...")
- **PROBLEMA ENCONTRADO**: As lojas ainda têm place_ids placeholder
- **SOLUÇÃO**: Precisa adicionar place_ids reais das lojas Centauro

### 3. ⚠️ Reiniciar Servidor
- [ ] Servidor foi reiniciado após adicionar a chave?
- **IMPORTANTE**: Next.js só carrega variáveis de ambiente na inicialização

### 4. ⚠️ Verificar Console do Servidor
- [ ] Procurar mensagem: "✅ Usando Google Places API (dados reais)"
- [ ] Ou: "⚠️ GOOGLE_MAPS_API_KEY não configurada. Usando dados mock."

---

## 🚨 Problemas Identificados

### Problema 1: Place IDs Inválidos
As lojas em `data/lojas.ts` ainda têm place_ids placeholder (`ChIJ...`):

```typescript
place_id: 'ChIJ...', // ❌ Placeholder - precisa ser real
```

**Solução**: 
1. Buscar place_ids reais usando o script helper:
```bash
node scripts/buscar-place-id.js "Centauro Shopping Iguatemi" AIzaSyDbWnLJLYm8XNuet1ijnQSVCAEABhtg68o
```

2. Ou buscar manualmente no Google Maps e atualizar `data/lojas.ts`

### Problema 2: Servidor Pode Não Ter Recarregado
Next.js carrega variáveis de ambiente apenas na inicialização.

**Solução**: Reiniciar o servidor:
```bash
# Parar o servidor (Ctrl+C)
# Iniciar novamente
npm run dev
```

---

## ✅ Próximos Passos

1. **Reiniciar o servidor** (se ainda não fez)
2. **Verificar no console** se aparece "✅ Usando Google Places API"
3. **Buscar place_ids reais** das lojas
4. **Atualizar data/lojas.ts** com place_ids válidos
5. **Testar no dashboard** clicando em "🔄 Atualizar Dados do Maps"

