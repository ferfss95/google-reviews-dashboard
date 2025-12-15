/**
 * Script para buscar lojas Centauro em todas as principais cidades do Brasil
 */

const { Client } = require('@googlemaps/google-maps-services-js');

const apiKey = process.argv[2] || process.env.GOOGLE_MAPS_API_KEY;

if (!apiKey) {
  console.error('❌ API Key não fornecida');
  process.exit(1);
}

const client = new Client({});

// Principais lojas Centauro em grandes cidades
const buscas = [
  // São Paulo
  { nome: 'Centauro Shopping Iguatemi', cidade: 'São Paulo', estado: 'SP', regiao: 'Sudeste' },
  { nome: 'Centauro Shopping Center Norte', cidade: 'São Paulo', estado: 'SP', regiao: 'Sudeste' },
  { nome: 'Centauro MorumbiTown', cidade: 'São Paulo', estado: 'SP', regiao: 'Sudeste' },
  { nome: 'Centauro Shopping Center Leste', cidade: 'São Paulo', estado: 'SP', regiao: 'Sudeste' },
  { nome: 'Centauro Shopping Eldorado', cidade: 'São Paulo', estado: 'SP', regiao: 'Sudeste' },
  { nome: 'Centauro Shopping Center Sul', cidade: 'São Paulo', estado: 'SP', regiao: 'Sudeste' },
  { nome: 'Centauro Shopping Villa-Lobos', cidade: 'São Paulo', estado: 'SP', regiao: 'Sudeste' },
  
  // Rio de Janeiro
  { nome: 'Centauro Shopping RioMar Kennedy', cidade: 'Rio de Janeiro', estado: 'RJ', regiao: 'Sudeste' },
  { nome: 'Centauro Shopping Tijuca', cidade: 'Rio de Janeiro', estado: 'RJ', regiao: 'Sudeste' },
  { nome: 'Centauro Shopping Barra', cidade: 'Rio de Janeiro', estado: 'RJ', regiao: 'Sudeste' },
  
  // Belo Horizonte
  { nome: 'Centauro Shopping BH', cidade: 'Belo Horizonte', estado: 'MG', regiao: 'Sudeste' },
  
  // Fortaleza
  { nome: 'Centauro RioMar Fortaleza', cidade: 'Fortaleza', estado: 'CE', regiao: 'Nordeste' },
  
  // Recife
  { nome: 'Centauro Shopping Recife', cidade: 'Recife', estado: 'PE', regiao: 'Nordeste' },
  
  // Salvador
  { nome: 'Centauro Shopping Salvador', cidade: 'Salvador', estado: 'BA', regiao: 'Nordeste' },
  
  // Porto Alegre
  { nome: 'Centauro Shopping Praia de Belas', cidade: 'Porto Alegre', estado: 'RS', regiao: 'Sul' },
  
  // Curitiba
  { nome: 'Centauro Shopping Curitiba', cidade: 'Curitiba', estado: 'PR', regiao: 'Sul' },
  
  // Brasília
  { nome: 'Centauro Shopping Brasília', cidade: 'Brasília', estado: 'DF', regiao: 'Centro-Oeste' },
  
  // Goiânia
  { nome: 'Centauro Shopping Goiânia', cidade: 'Goiânia', estado: 'GO', regiao: 'Centro-Oeste' },
  
  // Belém
  { nome: 'Centauro Shopping Belém', cidade: 'Belém', estado: 'PA', regiao: 'Norte' },
  
  // Manaus
  { nome: 'Centauro Shopping Manaus', cidade: 'Manaus', estado: 'AM', regiao: 'Norte' },
];

async function buscarPlaceId(busca) {
  try {
    const query = `Centauro ${busca.nome} ${busca.cidade}`;
    
    const response = await client.findPlaceFromText({
      params: {
        input: query,
        inputtype: 'textquery',
        fields: ['place_id', 'name', 'formatted_address'],
        key: apiKey,
        language: 'pt-BR',
      },
    });

    if (response.data.candidates && response.data.candidates.length > 0) {
      const resultado = response.data.candidates[0];
      return {
        nome: resultado.name || busca.nome,
        place_id: resultado.place_id,
        endereco: resultado.formatted_address,
        cidade: busca.cidade,
        estado: busca.estado,
        regiao: busca.regiao,
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Erro ao buscar ${busca.nome}:`, error.message);
    return null;
  }
}

async function buscarTodasLojas() {
  console.log('🔍 Buscando lojas Centauro...\n');
  
  const resultados = [];
  
  for (const busca of buscas) {
    process.stdout.write(`Buscando ${busca.nome}... `);
    const resultado = await buscarPlaceId(busca);
    
    if (resultado) {
      console.log('✅');
      resultados.push(resultado);
    } else {
      console.log('❌');
    }
    
    // Pequeno delay para não exceder rate limits
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`\n✅ Encontradas ${resultados.length} lojas\n`);
  
  // Gera código TypeScript
  console.log('// Cole o código abaixo em data/lojas.ts\n');
  console.log('export const lojas: Loja[] = [');
  
  resultados.forEach((loja, index) => {
    const id = `loja-${String(index + 1).padStart(3, '0')}`;
    console.log(`  {`);
    console.log(`    id: '${id}',`);
    console.log(`    nome: '${loja.nome}',`);
    console.log(`    place_id: '${loja.place_id}',`);
    console.log(`    estado: '${loja.estado}',`);
    console.log(`    regiao: '${loja.regiao}',`);
    if (loja.endereco) {
      console.log(`    endereco: '${loja.endereco}',`);
    }
    if (loja.cidade) {
      console.log(`    cidade: '${loja.cidade}',`);
    }
    console.log(`  },`);
  });
  
  console.log('];');
}

buscarTodasLojas();

