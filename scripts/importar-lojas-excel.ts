/**
 * Script para importar lojas do arquivo Excel
 * Busca cada loja no Google Places API e importa apenas as que têm avaliações
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { Client } from '@googlemaps/google-maps-services-js';
import * as dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

interface LojaExcel {
  nome?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  regiao?: string;
  [key: string]: any; // Para outras colunas
}

interface LojaEncontrada {
  nome: string;
  place_id: string;
  estado: string;
  regiao: string;
  endereco?: string;
  cidade?: string;
  time?: string;
  rating?: number;
  totalAvaliacoes?: number;
}

// Mapeamento de estados para regiões
const ESTADO_PARA_REGIAO: { [key: string]: string } = {
  AC: 'Norte',
  AL: 'Nordeste',
  AP: 'Norte',
  AM: 'Norte',
  BA: 'Nordeste',
  CE: 'Nordeste',
  DF: 'Centro-Oeste',
  ES: 'Sudeste',
  GO: 'Centro-Oeste',
  MA: 'Nordeste',
  MT: 'Centro-Oeste',
  MS: 'Centro-Oeste',
  MG: 'Sudeste',
  PA: 'Norte',
  PB: 'Nordeste',
  PR: 'Sul',
  PE: 'Nordeste',
  PI: 'Nordeste',
  RJ: 'Sudeste',
  RN: 'Nordeste',
  RS: 'Sul',
  RO: 'Norte',
  RR: 'Norte',
  SC: 'Sul',
  SP: 'Sudeste',
  SE: 'Nordeste',
  TO: 'Norte',
};

function mapearRegiao(estado: string): string {
  return ESTADO_PARA_REGIAO[estado.toUpperCase()] || 'Sudeste';
}

async function buscarLojaNoGoogleMaps(
  client: Client,
  nome: string,
  endereco?: string,
  cidade?: string,
  estado?: string,
  time?: string
): Promise<LojaEncontrada | null> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('❌ GOOGLE_MAPS_API_KEY não configurada');
      return null;
    }

    // Monta query de busca
    let query = nome;
    if (cidade && estado) {
      query += `, ${cidade}, ${estado}, Brasil`;
    } else if (endereco) {
      query += `, ${endereco}`;
    }

    console.log(`🔍 Buscando: ${query}`);

    // Busca no Google Places API
    const response = await client.findPlaceFromText({
      params: {
        input: query,
        inputtype: 'textquery' as any,
        fields: ['place_id', 'name', 'formatted_address', 'geometry'],
        key: apiKey,
      },
    });

    if (response.data.candidates && response.data.candidates.length > 0) {
      const candidate = response.data.candidates[0];
      const placeId = candidate.place_id!;

      // Busca detalhes completos incluindo reviews
      const detailsResponse = await client.placeDetails({
        params: {
          place_id: placeId,
          fields: [
            'place_id',
            'name',
            'formatted_address',
            'rating',
            'user_ratings_total',
            'reviews',
            'address_components',
          ],
          key: apiKey,
        },
      });

      const details = detailsResponse.data.result;

      // Verifica se tem avaliações
      if (!details.rating || !details.user_ratings_total || details.user_ratings_total === 0) {
        console.log(`   ⚠️ Sem avaliações, ignorando...`);
        return null;
      }

      // Extrai estado dos componentes de endereço
      let estadoEncontrado = estado || 'SP';
      if (details.address_components) {
        const estadoComponent = details.address_components.find(
          (comp: any) => comp.types.includes('administrative_area_level_1')
        );
        if (estadoComponent) {
          // Tenta encontrar a sigla do estado
          const estadoSigla = estadoComponent.short_name;
          if (estadoSigla && estadoSigla.length === 2) {
            estadoEncontrado = estadoSigla;
          }
        }
      }

      const regiao = mapearRegiao(estadoEncontrado);

      console.log(
        `   ✅ Encontrada: ${details.name} (${details.rating}⭐, ${details.user_ratings_total} avaliações)`
      );

      return {
        nome: details.name || nome,
        place_id: placeId,
        estado: estadoEncontrado,
        regiao,
        endereco: details.formatted_address,
        cidade: cidade || '',
        time: time,
        rating: details.rating,
        totalAvaliacoes: details.user_ratings_total,
      };
    }

    console.log(`   ❌ Não encontrada`);
    return null;
  } catch (error: any) {
    console.error(`   ❌ Erro ao buscar: ${error.message}`);
    return null;
  }
}

async function processarExcel() {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('❌ GOOGLE_MAPS_API_KEY não configurada no .env');
      console.error('   Configure a chave antes de executar este script.');
      process.exit(1);
    }

    const client = new Client({});

    // Lê o arquivo Excel
    const excelPath = path.join(process.cwd(), 'Base lojas.xlsx');
    if (!fs.existsSync(excelPath)) {
      console.error(`❌ Arquivo não encontrado: ${excelPath}`);
      process.exit(1);
    }

    console.log(`📖 Lendo arquivo: ${excelPath}`);
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Converte para JSON
    const lojasExcel: LojaExcel[] = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📊 Total de lojas no Excel: ${lojasExcel.length}\n`);

    const lojasEncontradas: LojaEncontrada[] = [];
    let contador = 0;

    // Processa cada loja
    for (const lojaExcel of lojasExcel) {
      contador++;
      const nome =
        (lojaExcel as any)[' NOME DA LOJA'] ||
        (lojaExcel as any)['Shopping'] ||
        (lojaExcel as any)['Loja'] ||
        '';
      const endereco = (lojaExcel as any)['Endereço'] || (lojaExcel as any)['Endereço'] || '';
      const cidade = (lojaExcel as any)['Cidade'] || '';
      const estado = (lojaExcel as any)['Estado'] || '';
      let regiaoExcel = (lojaExcel as any)['Região'] || '';
      const time = (lojaExcel as any)['TIME'] || '';

      // Normaliza região
      if (regiaoExcel === 'Centro Oeste') regiaoExcel = 'Centro-Oeste';

      if (!nome) {
        console.log(`⚠️ Linha ${contador}: Nome não encontrado, pulando...`);
        continue;
      }

      console.log(`\n[${contador}/${lojasExcel.length}] Processando: ${nome}`);

      const lojaEncontrada = await buscarLojaNoGoogleMaps(
        client,
        nome,
        endereco,
        cidade,
        estado,
        time
      );

      if (lojaEncontrada) {
        // Usa a região do Excel se disponível, senão usa a mapeada
        if (regiaoExcel && ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'].includes(regiaoExcel)) {
          lojaEncontrada.regiao = regiaoExcel;
        }
        lojasEncontradas.push(lojaEncontrada);
      }

      // Delay para evitar rate limiting (2 requisições por segundo)
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(`\n\n📊 RESUMO:`);
    console.log(`   Total processado: ${lojasExcel.length}`);
    console.log(`   Lojas encontradas com avaliações: ${lojasEncontradas.length}`);
    console.log(`   Lojas ignoradas (sem avaliações): ${lojasExcel.length - lojasEncontradas.length}`);

    if (lojasEncontradas.length === 0) {
      console.log('\n⚠️ Nenhuma loja com avaliações foi encontrada.');
      return;
    }

    // Gera código TypeScript para adicionar ao arquivo lojas.ts
    const codigoLojas = lojasEncontradas
      .map((loja, index) => {
        const id = `loja-${String(index + 1).padStart(3, '0')}`;
        return `  {
    id: '${id}',
    nome: '${loja.nome.replace(/'/g, "\\'")}',
    place_id: '${loja.place_id}',
    estado: '${loja.estado}',
    regiao: '${loja.regiao}',
    endereco: '${(loja.endereco || '').replace(/'/g, "\\'")}',
    cidade: '${(loja.cidade || '').replace(/'/g, "\\'")}',
    time: '${(loja.time || '').replace(/'/g, "\\'")}',
  },`;
      })
      .join('\n');

    // Salva resultado em arquivo
    const outputPath = path.join(process.cwd(), 'lojas-importadas.ts');
    const outputContent = `/**
 * Lojas importadas do Excel "Base lojas.xlsx"
 * Apenas lojas com avaliações do Google Maps foram incluídas
 * 
 * Gerado em: ${new Date().toISOString()}
 * Total de lojas: ${lojasEncontradas.length}
 */

import type { Loja } from '@/types';

export const lojasImportadas: Loja[] = [
${codigoLojas}
];

`;

    fs.writeFileSync(outputPath, outputContent, 'utf-8');
    console.log(`\n✅ Arquivo gerado: ${outputPath}`);
    console.log(`\n📝 PRÓXIMOS PASSOS:`);
    console.log(`   1. Revise o arquivo ${outputPath}`);
    console.log(`   2. Copie as lojas para data/lojas.ts ou substitua o array`);
    console.log(`   3. Reinicie o servidor para aplicar as mudanças`);
  } catch (error: any) {
    console.error('❌ Erro ao processar:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Executa o script
processarExcel();

