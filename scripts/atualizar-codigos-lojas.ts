/**
 * Script para atualizar os códigos das lojas a partir do arquivo Excel
 * Extrai os códigos da coluna "Loja" (formato "CEXX") e atualiza data/lojas.ts
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

interface LojaExcel {
  'Loja'?: string; // Código da loja (ex: "CE01")
  ' NOME DA LOJA'?: string;
  'Nome da Loja'?: string;
  'Shopping'?: string;
  'Endereço'?: string;
  'Cidade'?: string;
  'Estado'?: string;
  [key: string]: any;
}

function atualizarCodigosLojas() {
  try {
    // Caminho do arquivo Excel
    const excelPath = path.join(process.cwd(), 'Base lojas.xlsx');
    if (!fs.existsSync(excelPath)) {
      console.error(`❌ Arquivo não encontrado: ${excelPath}`);
      process.exit(1);
    }

    console.log(`📖 Lendo arquivo Excel: ${excelPath}`);
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Converte para JSON
    const lojasExcel: LojaExcel[] = XLSX.utils.sheet_to_json(worksheet);
    console.log(`📊 Total de lojas no Excel: ${lojasExcel.length}`);

    // Mostra as colunas disponíveis
    if (lojasExcel.length > 0) {
      console.log(`\n📝 Colunas disponíveis no Excel:`);
      Object.keys(lojasExcel[0]).forEach((coluna) => {
        console.log(`   - ${coluna}`);
      });
    }

    // Cria um mapa de nome -> código
    // Tenta múltiplas formas de obter o código e o nome
    const mapaCodigos = new Map<string, string>();
    
    lojasExcel.forEach((lojaExcel, index) => {
      // Coluna "Loja" contém o código (ex: "CE20", "CE23")
      const codigo = lojaExcel['Loja'] || '';
      
      // Coluna "Shopping" contém o nome da loja
      const nome = lojaExcel['Shopping'] || '';

      if (codigo && nome) {
        const codigoLimpo = codigo.trim();
        const nomeLimpo = nome.trim();
        
        // Armazena múltiplas variações para busca flexível
        const nomeSemShopping = nomeLimpo
          .replace(/Shopping\s+/gi, '')
          .replace(/\s+Shopping/gi, '')
          .replace(/Super\s+/gi, '')
          .trim();
        
        const nomeNormalizado = nomeLimpo.toLowerCase()
          .replace(/\s+/g, ' ')
          .replace(/shopping\s*/gi, '')
          .replace(/centro\s*/gi, '')
          .trim();
        
        const nomeSemShoppingNormalizado = nomeSemShopping.toLowerCase()
          .replace(/\s+/g, ' ')
          .trim();
        
        // Armazena com nome original exato
        mapaCodigos.set(nomeLimpo, codigoLimpo);
        mapaCodigos.set(nomeSemShopping, codigoLimpo);
        
        // Armazena com nome normalizado (lowercase)
        mapaCodigos.set(nomeLimpo.toLowerCase(), codigoLimpo);
        mapaCodigos.set(nomeSemShoppingNormalizado, codigoLimpo);
        
        // Armazena com nome sem palavras comuns (para correspondência parcial)
        mapaCodigos.set(nomeNormalizado, codigoLimpo);
        mapaCodigos.set(nomeSemShoppingNormalizado, codigoLimpo);
        
        // Também armazena variações com "Shopping" no início vs fim
        if (!nomeLimpo.toLowerCase().startsWith('shopping')) {
          mapaCodigos.set(`Shopping ${nomeSemShopping}`, codigoLimpo);
          mapaCodigos.set(`shopping ${nomeSemShoppingNormalizado}`, codigoLimpo);
        }
        
        console.log(`   📋 ${codigoLimpo} -> ${nomeLimpo}`);
      } else if (!codigo && nome) {
        console.log(`   ⚠️ Linha ${index + 1}: Nome encontrado mas código não: "${nome}"`);
      } else if (codigo && !nome) {
        console.log(`   ⚠️ Linha ${index + 1}: Código encontrado mas nome não: "${codigo}"`);
      }
    });

    console.log(`\n📝 Total de códigos únicos mapeados: ${new Set(mapaCodigos.values()).size}`);
    console.log(`📝 Total de entradas no mapa (múltiplas variações): ${mapaCodigos.size}`);
    
    // Lê o arquivo lojas.ts
    const lojasTsPath = path.join(process.cwd(), 'data', 'lojas.ts');
    if (!fs.existsSync(lojasTsPath)) {
      console.error(`❌ Arquivo não encontrado: ${lojasTsPath}`);
      process.exit(1);
    }

    console.log(`\n📖 Lendo arquivo: ${lojasTsPath}`);
    let lojasTsContent = fs.readFileSync(lojasTsPath, 'utf-8');

    // Conta quantos códigos foram adicionados/atualizados
    let codigosAdicionados = 0;
    let codigosAtualizados = 0;
    let naoEncontrados: string[] = [];

    // Regex mais robusto para encontrar objetos de loja
    // Busca por: { id: '...', nome: '...', ... (pode ter codigo ou não) ... }
    const linhas = lojasTsContent.split('\n');
    const novoConteudo: string[] = [];
    let dentroDeObjetoLoja = false;
    let objetoLojaLinhas: string[] = [];
    let nomeLojaAtual = '';
    let temCodigo = false;
    let indiceCodigo = -1;

    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];
      const linhaTrim = linha.trim();

      // Detecta início de objeto loja
      if (linhaTrim.match(/^\{\s*$/)) {
        dentroDeObjetoLoja = true;
        objetoLojaLinhas = [linha];
        nomeLojaAtual = '';
        temCodigo = false;
        indiceCodigo = -1;
        continue;
      }

      if (dentroDeObjetoLoja) {
        objetoLojaLinhas.push(linha);

        // Detecta nome da loja
        const matchNome = linha.match(/nome:\s*['"]([^'"]+)['"]/);
        if (matchNome) {
          nomeLojaAtual = matchNome[1];
        }

        // Detecta se já tem código
        const matchCodigo = linha.match(/codigo:\s*['"]([^'"]+)['"]/);
        if (matchCodigo) {
          temCodigo = true;
          indiceCodigo = objetoLojaLinhas.length - 1;
        }

        // Detecta fim do objeto loja
        if (linhaTrim.match(/^\},?\s*$/)) {
          dentroDeObjetoLoja = false;

          // Função auxiliar para normalizar nomes (remove acentos, espaços extras, palavras comuns)
          const normalizarNome = (nome: string): string => {
            return nome.toLowerCase()
              // Remove acentos
              .replace(/[àáâãäå]/g, 'a')
              .replace(/[èéêë]/g, 'e')
              .replace(/[ìíîï]/g, 'i')
              .replace(/[òóôõö]/g, 'o')
              .replace(/[ùúûü]/g, 'u')
              .replace(/ç/g, 'c')
              .replace(/ñ/g, 'n')
              // Remove espaços extras
              .replace(/\s+/g, ' ')
              // Remove palavras comuns
              .replace(/shopping\s*/gi, '')
              .replace(/super\s*/gi, '')
              .replace(/centro\s*/gi, '')
              .replace(/mall\s*/gi, '')
              .replace(/center\s*/gi, '')
              .replace(/metrô\s*/gi, '')
              .replace(/metro\s*/gi, '')
              .replace(/plaza\s*/gi, '')
              .replace(/praia\s*/gi, '')
              // Remove espaços extras novamente após remover palavras
              .replace(/\s+/g, ' ')
              .trim();
          };

          // Função para criar variações de um nome (para matching mais flexível)
          const criarVariacoes = (nome: string): string[] => {
            const normalizado = normalizarNome(nome);
            const variacoes = new Set([normalizado]);
            
            // Adiciona variação sem espaços (para "RioSul" vs "Rio Sul")
            const semEspacos = normalizado.replace(/\s/g, '');
            if (semEspacos !== normalizado && semEspacos.length > 0) {
              variacoes.add(semEspacos);
            }
            
            // Adiciona variação com espaço entre maiúsculas/minúsculas
            // (converte "riosul" em "rio sul")
            const nomeOriginalLower = nome.toLowerCase();
            const comEspacosEntreMaiusculas = nomeOriginalLower.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
            if (comEspacosEntreMaiusculas !== normalizado) {
              const normalizadoComEspacos = normalizarNome(comEspacosEntreMaiusculas);
              variacoes.add(normalizadoComEspacos);
              variacoes.add(normalizadoComEspacos.replace(/\s/g, ''));
            }
            
            // Tenta separar palavras compostas (ex: "riosul" -> "rio sul")
            const palavrasSeparadas = normalizado.replace(/([a-z])([a-z])/g, (match, p1, p2, offset, string) => {
              // Se encontrou uma transição de caractere, pode ser início de palavra
              // Mas só faz isso se não quebrar palavras conhecidas
              return match;
            });
            
            // Adiciona também versão sem "Shopping" no início/fim
            const semShopping = normalizado.replace(/^(shopping|super|centro|mall|center)\s+|\s+(shopping|super|centro|mall|center)$/gi, '').trim();
            if (semShopping !== normalizado && semShopping.length > 0) {
              variacoes.add(semShopping);
              variacoes.add(semShopping.replace(/\s/g, ''));
            }
            
            return Array.from(variacoes);
          };

          // Busca código no mapa com múltiplas estratégias
          let codigo = 
            mapaCodigos.get(nomeLojaAtual) || // Busca exata
            mapaCodigos.get(nomeLojaAtual.toLowerCase()); // Busca case-insensitive
          
          // Se não encontrou, tenta correspondência parcial (normaliza e compara)
          if (!codigo) {
            // Cria variações do nome atual
            const variacoesNome = criarVariacoes(nomeLojaAtual);
            
            // Tenta cada variação no mapa
            for (const variacao of variacoesNome) {
              codigo = mapaCodigos.get(variacao);
              if (codigo) {
                console.log(`   🔍 Correspondência encontrada (variação): "${nomeLojaAtual}" -> ${codigo}`);
                break;
              }
            }
            
            // Se ainda não encontrou, busca por correspondência parcial usando similaridade de strings
            if (!codigo) {
              let melhorMatch = '';
              let melhorSimilaridade = 0;
              let melhorChave = '';
              
              for (const [chave, valor] of mapaCodigos.entries()) {
                const chaveNormalizada = normalizarNome(chave);
                
                // Testa cada variação do nome atual contra a chave normalizada
                for (const variacaoNome of variacoesNome) {
                  // Verifica se são idênticos após normalização
                  if (chaveNormalizada === variacaoNome) {
                    melhorMatch = valor;
                    melhorSimilaridade = 100;
                    melhorChave = chave;
                    break;
                  }
                  
                  // Verifica correspondência exata sem espaços (ex: "riosul" = "rio sul")
                  const chaveSemEspacos = chaveNormalizada.replace(/\s+/g, '');
                  const variacaoSemEspacos = variacaoNome.replace(/\s+/g, '');
                  if (chaveSemEspacos === variacaoSemEspacos && chaveSemEspacos.length > 3) {
                    melhorMatch = valor;
                    melhorSimilaridade = 95;
                    melhorChave = chave;
                    continue; // Continua procurando match 100%, mas já tem um bom candidato
                  }
                  
                  // Verifica correspondência parcial (um contém o outro)
                  const contem = chaveNormalizada.includes(variacaoNome) || variacaoNome.includes(chaveNormalizada);
                  if (contem && variacaoNome.length > 3) { // Só se a variação tem pelo menos 4 caracteres
                    // Calcula similaridade baseada em palavras comuns
                    const palavrasNome = variacaoNome.split(/\s+/).filter(p => p.length > 2);
                    const palavrasChave = chaveNormalizada.split(/\s+/).filter(p => p.length > 2);
                    
                    if (palavrasNome.length > 0 && palavrasChave.length > 0) {
                      const palavrasComuns = palavrasNome.filter(p => palavrasChave.includes(p)).length;
                      const totalPalavras = Math.max(palavrasNome.length, palavrasChave.length);
                      const similaridade = (palavrasComuns / totalPalavras) * 100;
                      
                      if (similaridade > melhorSimilaridade && similaridade >= 50) {
                        melhorSimilaridade = similaridade;
                        melhorMatch = valor;
                        melhorChave = chave;
                      }
                    }
                  }
                  
                  // Também verifica se uma variação sem espaços está contida na outra
                  if (chaveSemEspacos.includes(variacaoSemEspacos) || variacaoSemEspacos.includes(chaveSemEspacos)) {
                    if (variacaoSemEspacos.length > 3 && melhorSimilaridade < 85) {
                      const similaridadePorChars = (Math.min(chaveSemEspacos.length, variacaoSemEspacos.length) / 
                                                     Math.max(chaveSemEspacos.length, variacaoSemEspacos.length)) * 85;
                      if (similaridadePorChars > melhorSimilaridade && similaridadePorChars >= 70) {
                        melhorSimilaridade = similaridadePorChars;
                        melhorMatch = valor;
                        melhorChave = chave;
                      }
                    }
                  }
                }
                
                if (melhorSimilaridade === 100) break;
              }
              
              if (melhorMatch && melhorSimilaridade >= 50) {
                codigo = melhorMatch;
                if (melhorSimilaridade === 100) {
                  console.log(`   🔍 Correspondência encontrada (normalizada): "${nomeLojaAtual}" -> "${melhorChave}" -> ${codigo}`);
                } else {
                  console.log(`   🔍 Correspondência encontrada (${melhorSimilaridade.toFixed(0)}%): "${nomeLojaAtual}" -> "${melhorChave}" -> ${codigo}`);
                }
              }
            }
          }

          if (codigo) {
            if (temCodigo && indiceCodigo >= 0) {
              // Atualiza código existente
              objetoLojaLinhas[indiceCodigo] = objetoLojaLinhas[indiceCodigo].replace(
                /codigo:\s*['"]([^'"]+)['"]/,
                `codigo: '${codigo}'`
              );
              codigosAtualizados++;
              console.log(`   ✓ Atualizado: ${nomeLojaAtual} -> ${codigo}`);
            } else {
              // Adiciona código após o nome
              // Encontra a linha do nome
              let linhaNomeIndex = -1;
              for (let j = 0; j < objetoLojaLinhas.length; j++) {
                if (objetoLojaLinhas[j].includes(`nome: '${nomeLojaAtual}'`)) {
                  linhaNomeIndex = j;
                  break;
                }
              }

              if (linhaNomeIndex >= 0) {
                // Insere código na linha seguinte
                const linhaNome = objetoLojaLinhas[linhaNomeIndex];
                const indentacao = linhaNome.match(/^(\s*)/)?.[1] || '    ';
                objetoLojaLinhas.splice(linhaNomeIndex + 1, 0, `${indentacao}codigo: '${codigo}',`);
                codigosAdicionados++;
                console.log(`   + Adicionado: ${nomeLojaAtual} -> ${codigo}`);
              }
            }
          } else if (nomeLojaAtual) {
            naoEncontrados.push(nomeLojaAtual);
          }

          novoConteudo.push(...objetoLojaLinhas);
          objetoLojaLinhas = [];
          continue;
        }
      } else {
        novoConteudo.push(linha);
      }
    }

    // Se ainda está dentro de um objeto (caso edge), adiciona as linhas restantes
    if (objetoLojaLinhas.length > 0) {
      novoConteudo.push(...objetoLojaLinhas);
    }

    // Faz backup
    const backupPath = path.join(process.cwd(), 'data', `lojas.backup.${Date.now()}.ts`);
    fs.writeFileSync(backupPath, fs.readFileSync(lojasTsPath, 'utf-8'), 'utf-8');
    console.log(`\n📦 Backup criado: ${backupPath}`);

    // Salva arquivo atualizado
    fs.writeFileSync(lojasTsPath, novoConteudo.join('\n'), 'utf-8');
    console.log(`\n✅ Arquivo atualizado: ${lojasTsPath}`);
    
    console.log(`\n📊 RESUMO:`);
    console.log(`   Códigos adicionados: ${codigosAdicionados}`);
    console.log(`   Códigos atualizados: ${codigosAtualizados}`);
    
    if (naoEncontrados.length > 0) {
      console.log(`\n⚠️  Lojas sem código encontrado no Excel (${naoEncontrados.length}):`);
      naoEncontrados.slice(0, 10).forEach((nome) => {
        console.log(`   - ${nome}`);
      });
      if (naoEncontrados.length > 10) {
        console.log(`   ... e mais ${naoEncontrados.length - 10}`);
      }
    }
    
    console.log(`\n✨ Processo concluído com sucesso!`);

  } catch (error: any) {
    console.error('❌ Erro ao processar:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Executa o script
atualizarCodigosLojas();
