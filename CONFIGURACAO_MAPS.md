# 🔧 Configuração do Google Maps API

Este guia explica como configurar a integração com o Google Maps Places API para buscar avaliações reais das lojas.

## 📋 Pré-requisitos

1. Conta Google (Gmail)
2. Acesso ao [Google Cloud Console](https://console.cloud.google.com/)

## 🚀 Passo a Passo

### 1. Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Clique em "Selecionar um projeto" → "Novo Projeto"
3. Dê um nome ao projeto (ex: "Centauro Store Analytics")
4. Clique em "Criar"

### 2. Habilitar a Places API

1. No menu lateral, vá em **APIs e Serviços** → **Biblioteca**
2. Procure por **"Places API"**
3. Clique em **Places API** e depois em **"Habilitar"**

### 3. Criar Chave de API

1. Vá em **APIs e Serviços** → **Credenciais**
2. Clique em **"+ CRIAR CREDENCIAIS"** → **"Chave de API"**
3. Copie a chave gerada (formato: `AIza...`)

### 4. Configurar Restrições (Recomendado)

Para maior segurança, configure restrições na chave:

1. Clique na chave criada para editá-la
2. Em **"Restrições de aplicativo"**:
   - Selecione **"Referenciadores de sites HTTP"**
   - Adicione: `http://localhost:3000/*` (para desenvolvimento)
   - Adicione seu domínio de produção quando deployar
3. Em **"Restrições de API"**:
   - Selecione **"Restringir chave"**
   - Marque apenas **"Places API"**
4. Salve as alterações

### 5. Configurar no Projeto

1. Abra o arquivo `.env` na raiz do projeto
2. Adicione a chave:

```
GOOGLE_MAPS_API_KEY=AIzaSuaChaveAqui
```

3. Salve o arquivo

### 6. Reiniciar o Servidor

Após adicionar a chave, reinicie o servidor:

```bash
npm run dev
```

## ✅ Verificação

Quando o servidor iniciar, você verá no console:

- ✅ **"Usando Google Places API (dados reais)"** - se a chave estiver configurada
- ⚠️ **"GOOGLE_MAPS_API_KEY não configurada. Usando dados mock."** - se não estiver configurada

## 📝 Obter Place IDs das Lojas

Para adicionar lojas ao sistema, você precisa do `place_id` de cada loja. Há duas formas:

### Método 1: Via Google Maps (Mais Fácil)

1. Abra o Google Maps
2. Busque pela loja (ex: "Centauro Shopping Iguatemi")
3. Clique na loja nos resultados
4. Role a página até o final
5. O `place_id` aparece em "ID do lugar" ou na URL quando você clica em "Compartilhar"

### Método 2: Via Places API

Você pode usar a API para buscar o place_id:

```javascript
const { Client } = require('@googlemaps/google-maps-services-js');
const client = new Client({});

const response = await client.findPlaceFromText({
  params: {
    input: 'Centauro Shopping Iguatemi São Paulo',
    inputtype: 'textquery',
    fields: ['place_id', 'name'],
    key: 'SUA_CHAVE_AQUI',
  },
});

console.log(response.data.candidates[0].place_id);
```

## 🔒 Segurança

- **Nunca** commite o arquivo `.env` no Git
- Use restrições de API no Google Cloud Console
- Monitore o uso da API no console
- Configure orçamentos para evitar custos inesperados

## 💰 Custos

A Google Places API tem um modelo de preços:

- **Primeiros $200/mês**: Gratuitos (créditos mensais)
- **Place Details**: $17 por 1000 requisições
- **Place Search**: $32 por 1000 requisições

Com o cache de 1 hora implementado, o sistema minimiza chamadas à API.

## ⚠️ Limitações

- A API retorna **máximo de 5 reviews** por lugar
- Não há forma oficial de obter mais reviews via API
- Reviews são limitadas aos disponíveis publicamente no Google Maps

## 🐛 Troubleshooting

### Erro: "API key not valid"
- Verifique se a chave está correta no `.env`
- Confirme que a Places API está habilitada
- Verifique se as restrições de API não estão bloqueando

### Erro: "This API project is not authorized"
- Verifique se a Places API está habilitada no projeto
- Confirme que está usando o projeto correto no Cloud Console

### Erro: "Request denied"
- Verifique as restrições de aplicativo na chave
- Confirme que `localhost:3000` está nas referências permitidas

### Não está buscando dados reais
- Verifique se o `.env` tem `GOOGLE_MAPS_API_KEY`
- Reinicie o servidor após adicionar a chave
- Confira os logs do console ao iniciar

## 📚 Recursos

- [Documentação Google Places API](https://developers.google.com/maps/documentation/places/web-service/overview)
- [Biblioteca Node.js](https://github.com/googlemaps/google-maps-services-js)
- [Painel de Controle](https://console.cloud.google.com/)

