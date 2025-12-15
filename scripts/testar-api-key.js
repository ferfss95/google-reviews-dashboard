/**
 * Script para testar se a API key do Google Maps está habilitada e funcionando
 */

const { Client } = require('@googlemaps/google-maps-services-js');

async function testarAPIKey(apiKey) {
  if (!apiKey) {
    console.error('❌ API Key não fornecida');
    process.exit(1);
  }

  const client = new Client({});
  const placeIdTeste = 'ChIJEd8Vu39XzpQR1JucAkWfsS8'; // Centauro Shopping Iguatemi

  console.log('🔍 Testando API Key do Google Maps...\n');
  console.log(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}\n`);

  try {
    console.log('📡 Fazendo requisição à Places API...');
    
    const response = await client.placeDetails({
      params: {
        place_id: placeIdTeste,
        fields: ['place_id', 'name', 'rating', 'user_ratings_total'],
        key: apiKey,
        language: 'pt-BR',
      },
    });

    const place = response.data.result;
    
    console.log('\n✅ API Key está FUNCIONANDO!\n');
    console.log('📊 Resultado do teste:');
    console.log(`   Nome: ${place.name || 'N/A'}`);
    console.log(`   Place ID: ${place.place_id || 'N/A'}`);
    console.log(`   Rating: ${place.rating || 'N/A'}`);
    console.log(`   Total de avaliações: ${place.user_ratings_total || 'N/A'}`);
    console.log('\n✅ A Places API está habilitada e funcionando corretamente!\n');

  } catch (error) {
    console.error('\n❌ ERRO ao testar API Key:\n');
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      console.error(`Status HTTP: ${status}`);
      console.error(`Mensagem: ${data.error?.message || JSON.stringify(data)}`);
      
      if (status === 403) {
        console.error('\n⚠️  Erro 403 - Possíveis causas:');
        console.error('   1. Places API não está habilitada no Google Cloud Console');
        console.error('   2. API Key não tem permissão para Places API');
        console.error('   3. Restrições de API estão bloqueando');
        console.error('   4. Conta de cobrança não configurada');
        console.error('\n📝 Solução:');
        console.error('   1. Acesse: https://console.cloud.google.com/apis/library');
        console.error('   2. Procure por "Places API"');
        console.error('   3. Clique em "Habilitar"');
        console.error('   4. Verifique se a API Key tem acesso à Places API');
      } else if (status === 400) {
        console.error('\n⚠️  Erro 400 - API Key inválida ou malformada');
      } else if (status === 401) {
        console.error('\n⚠️  Erro 401 - API Key inválida ou expirada');
      }
    } else {
      console.error('Erro:', error.message);
    }
    
    process.exit(1);
  }
}

// Lê a API key do argumento ou do arquivo .env
const apiKey = process.argv[2] || process.env.GOOGLE_MAPS_API_KEY;

if (!apiKey) {
  console.error('❌ Uso: node scripts/testar-api-key.js SUA_API_KEY');
  console.error('   Ou configure GOOGLE_MAPS_API_KEY no .env');
  process.exit(1);
}

testarAPIKey(apiKey);

