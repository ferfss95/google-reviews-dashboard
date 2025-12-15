/**
 * Script para atualizar data/lojas.ts com as lojas importadas
 */

import * as fs from 'fs';
import * as path from 'path';

const lojasImportadasPath = path.join(process.cwd(), 'lojas-importadas.ts');
const lojasTsPath = path.join(process.cwd(), 'data', 'lojas.ts');

if (!fs.existsSync(lojasImportadasPath)) {
  console.error('❌ Arquivo lojas-importadas.ts não encontrado!');
  console.error('   Execute primeiro: npm run importar-lojas');
  process.exit(1);
}

// Lê o arquivo de lojas importadas
const lojasImportadasContent = fs.readFileSync(lojasImportadasPath, 'utf-8');

// Extrai apenas o array (remove comentários e imports)
const arrayMatch = lojasImportadasContent.match(/export const lojasImportadas: Loja\[\] = \[([\s\S]*)\];/);
if (!arrayMatch) {
  console.error('❌ Não foi possível extrair o array de lojas');
  process.exit(1);
}

const arrayContent = arrayMatch[1].trim();

// Lê o arquivo lojas.ts atual para preservar as funções
const lojasTsContent = fs.readFileSync(lojasTsPath, 'utf-8');

// Encontra onde começa e termina o array atual
const arrayStartMatch = lojasTsContent.match(/(export const lojas: Loja\[\] = \[)/);
const arrayEndMatch = lojasTsContent.match(/(\];\s*\n\s*\/\*\*)/);

if (!arrayStartMatch || !arrayEndMatch) {
  console.error('❌ Não foi possível encontrar o array no arquivo lojas.ts');
  process.exit(1);
}

// Constrói novo conteúdo
const newContent = `/**
 * Banco de dados de lojas físicas da Centauro
 * 
 * IMPORTADO DO EXCEL "Base lojas.xlsx"
 * Gerado em: ${new Date().toISOString()}
 * Total de lojas: 157 (apenas lojas com avaliações do Google Maps)
 * 
 * Para adicionar novas lojas, inclua:
 * - nome: nome da loja
 * - place_id: ID do lugar no Google Maps
 * - estado: UF do estado
 * - regiao: região do Brasil
 * - endereco (opcional): endereço completo
 * - cidade (opcional): cidade
 * 
 * Para obter o place_id:
 * 1. Acesse o Google Maps
 * 2. Busque a loja
 * 3. Abra os detalhes do lugar
 * 4. O place_id está na URL ou pode ser obtido via API/MCP
 */

import type { Loja } from '@/types';

export const lojas: Loja[] = [
${arrayContent}
];

/**
 * Obtém loja por ID
 */
export function getLojaById(id: string): Loja | undefined {
  return lojas.find((loja) => loja.id === id);
}

/**
 * Filtra lojas por critérios
 */
export function getLojas(filtros?: {
  regiao?: string;
  estado?: string;
  lojaId?: string;
}): Loja[] {
  if (!filtros) return lojas;

  return lojas.filter((loja) => {
    if (filtros.lojaId && loja.id !== filtros.lojaId) return false;
    if (filtros.regiao && loja.regiao !== filtros.regiao) return false;
    if (filtros.estado && loja.estado !== filtros.estado) return false;
    return true;
  });
}

/**
 * Obtém lista de estados únicos
 */
export function getEstados(): string[] {
  return Array.from(new Set(lojas.map((loja) => loja.estado))).sort();
}

/**
 * Obtém lista de regiões únicas
 */
export function getRegioes(): string[] {
  return Array.from(new Set(lojas.map((loja) => loja.regiao))).sort();
}
`;

// Faz backup do arquivo atual
const backupPath = path.join(process.cwd(), 'data', `lojas.backup.${Date.now()}.ts`);
fs.writeFileSync(backupPath, lojasTsContent, 'utf-8');
console.log(`📦 Backup criado: ${backupPath}`);

// Escreve o novo arquivo
fs.writeFileSync(lojasTsPath, newContent, 'utf-8');
console.log(`✅ Arquivo data/lojas.ts atualizado com ${arrayContent.split('id:').length - 1} lojas`);
console.log(`\n📝 PRÓXIMOS PASSOS:`);
console.log(`   1. Revise o arquivo data/lojas.ts`);
console.log(`   2. Reinicie o servidor: npm run dev`);
console.log(`   3. Teste o dashboard para verificar as novas lojas`);

