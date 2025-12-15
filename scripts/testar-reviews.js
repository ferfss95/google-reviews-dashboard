/**
 * Script para testar se a API consegue buscar reviews (avaliações)
 */

const { Client } = require('@googlemaps/google-maps-services-js');

async function testarReviews(apiKey) {
  const client = new Client({});
  const placeIdTeste = 'ChIJEd8Vu39XzpQR1JucAkWfsS8'; // Centauro Shopping Iguatemi

  console.log('🔍 Testando busca de reviews (avaliações)...\n');

  try {
    const response = await client.placeDetails({
      params: {
        place_id: placeIdTeste,
        fields: ['place_id', 'name', 'rating', 'user_ratings_total', 'reviews'],
        key: apiKey,
        language: 'pt-BR',
      },
    });

    const place = response.data.result;
    
    console.log('✅ Reviews podem ser buscados!\n');
    console.log(`📊 Loja: ${place.name}`);
    console.log(`⭐ Rating: ${place.rating}`);
    console.log(`📝 Total de avaliações: ${place.user_ratings_total}`);
    console.log(`\n📋 Reviews retornados: ${place.reviews?.length || 0}\n`);

    if (place.reviews && place.reviews.length > 0) {
      console.log('Exemplos de reviews:\n');
      place.reviews.slice(0, 3).forEach((review, index) => {
        console.log(`${index + 1}. ${review.author_name} (⭐ ${review.rating})`);
        console.log(`   "${review.text.substring(0, 80)}${review.text.length > 80 ? '...' : ''}"`);
        console.log(`   ${review.relative_time_description}\n`);
      });
    } else {
      console.log('⚠️  Nenhum review retornado (pode ser normal se a loja não tiver reviews públicos)');
    }

    console.log('\n✅ Tudo funcionando! O sistema pode buscar avaliações do Google Maps.\n');

  } catch (error) {
    console.error('\n❌ Erro ao buscar reviews:\n');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Erro: ${error.response.data.error?.message || JSON.stringify(error.response.data)}`);
    } else {
      console.error('Erro:', error.message);
    }
  }
}

const apiKey = process.argv[2] || process.env.GOOGLE_MAPS_API_KEY;

if (!apiKey) {
  console.error('❌ API Key não fornecida');
  process.exit(1);
}

testarReviews(apiKey);

