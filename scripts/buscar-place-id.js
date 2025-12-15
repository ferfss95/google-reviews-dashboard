/**
 * Script helper para buscar place_id de lojas no Google Maps
 * 
 * Uso:
 * node scripts/buscar-place-id.js "Centauro Shopping Iguatemi São Paulo" SUA_CHAVE_API
 */

const { Client } = require('@googlemaps/google-maps-services-js');

async function buscarPlaceId(nomeLoja, apiKey) {
  if (!apiKey || !nomeLoja) {
    console.error('❌ Uso: node scripts/buscar-place-id.js "Nome da Loja" SUA_CHAVE_API');
    process.exit(1);
  }

  const client = new Client({});

  try {
    console.log(`🔍 Buscando place_id para: "${nomeLoja}"\n`);

    const response = await client.findPlaceFromText({
      params: {
        input: nomeLoja,
        inputtype: 'textquery',
        fields: ['place_id', 'name', 'formatted_address'],
        key: apiKey,
        language: 'pt-BR',
      },
    });

    if (response.data.candidates && response.data.candidates.length > 0) {
      const resultado = response.data.candidates[0];
      
      console.log('✅ Resultado encontrado:\n');
      console.log(`Nome: ${resultado.name || 'N/A'}`);
      console.log(`Endereço: ${resultado.formatted_address || 'N/A'}`);
      console.log(`\n📍 Place ID: ${resultado.place_id}\n`);
      console.log('Copie o Place ID acima e adicione ao arquivo data/lojas.ts\n');
    } else {
      console.log('❌ Nenhum resultado encontrado. Tente ser mais específico no nome da loja.');
    }
  } catch (error) {
    console.error('❌ Erro ao buscar:', error.message);
    if (error.response) {
      console.error('Detalhes:', error.response.data);
    }
  }
}

// Executa o script
const nomeLoja = process.argv[2];
const apiKey = process.argv[3];

buscarPlaceId(nomeLoja, apiKey);

