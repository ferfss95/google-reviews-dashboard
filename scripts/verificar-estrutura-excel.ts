/**
 * Script auxiliar para verificar a estrutura do arquivo Excel
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const excelPath = path.join(process.cwd(), 'Base lojas.xlsx');

if (!fs.existsSync(excelPath)) {
  console.error(`❌ Arquivo não encontrado: ${excelPath}`);
  process.exit(1);
}

console.log(`📖 Lendo arquivo: ${excelPath}`);
const workbook = XLSX.readFile(excelPath);

console.log(`\n📋 Planilhas encontradas: ${workbook.SheetNames.join(', ')}`);

const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Converte para JSON
const dados = XLSX.utils.sheet_to_json(worksheet);

console.log(`\n📊 Total de linhas: ${dados.length}`);

if (dados.length > 0) {
  console.log(`\n📝 Colunas encontradas:`);
  const primeiraLinha = dados[0] as any;
  Object.keys(primeiraLinha).forEach((coluna) => {
    console.log(`   - ${coluna}`);
  });

  console.log(`\n📄 Primeiras 3 linhas de exemplo:`);
  dados.slice(0, 3).forEach((linha: any, index) => {
    console.log(`\n   Linha ${index + 1}:`);
    Object.entries(linha).forEach(([key, value]) => {
      console.log(`     ${key}: ${value}`);
    });
  });
}

