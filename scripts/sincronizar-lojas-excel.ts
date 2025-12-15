/**
 * Script para sincronizar TODAS as lojas com o arquivo Excel (fonte de verdade)
 * Atualiza códigos E nomes das lojas baseado no Excel
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

interface LojaExcel {
  'Loja'?: string; // Código da loja (ex: "CE20", "CE23")
  'Shopping'?: string; // Nome da loja
  'Cidade'?: string;
  'Estado'?: string;
  'Endereço'?: string;
  [key: string]: any;
}

interface LojaTS {
  id: string;
  nome: string;
  codigo?: string;
  cidade?: string;
  estado?: string;
  endereco?: string;
  place_id?: string;
  [key: string]: any;
}

function normalizarTexto(texto: string): string {
  if (!texto) return '';
  return texto.toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/ç/g, 'c')
    .replace(/ñ/g, 'n')
    .replace(/\s+/g, ' ')
    .replace(/shopping\s*/gi, '')
    .replace(/super\s*/gi, '')
    .replace(/centro\s*/gi, '')
    .replace(/mall\s*/gi, '')
    .replace(/center\s*/gi, '')
    .replace(/metrô\s*/gi, '')
    .replace(/metro\s*/gi, '')
    .replace(/\s+/g, '')
    .trim();
}

function sincronizarLojas() {
  try {
    // 1. Lê o Excel
    const excelPath = path.join(process.cwd(), 'Base lojas.xlsx');
    if (!fs.existsSync(excelPath)) {
      console.error(`❌ Arquivo não encontrado: ${excelPath}`);
      process.exit(1);
    }

    console.log(`📖 Lendo arquivo Excel: ${excelPath}`);
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const lojasExcel: LojaExcel[] = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 Total de lojas no Excel: ${lojasExcel.length}`);

    // 2. Cria índice do Excel por múltiplos critérios
    const indiceExcel = new Map<string, LojaExcel>();
    const indicePorCodigo = new Map<string, LojaExcel>();
    const indicePorNomeNormalizado = new Map<string, LojaExcel>();
    const indicePorCidadeEstado = new Map<string, LojaExcel[]>();

    // Mapeamentos manuais diretos: nome_exato_no_arquivo -> código_no_excel
    const mapeamentosDiretos: { [key: string]: string } = {
      'Bourbon Shopping São Paulo': 'CE71', // Shopping Bourbon SP
      'Boulevard Shopping Belo Horizonte': 'CE131', // Boulevard Shopping BH
      'Shopping PátioMix Resende': 'CE159', // Shopping Pátio Resende
      'Parque Municipal Dom José - Barueri': 'CE164', // Parque Shopping Barueri
      'Palladium Shopping Center Ponta Grossa': 'CE184', // Shopping Palladium - Ponta Grossa
      'International Mall': 'CE187', // Shopping Internacional Guarulhos
      'Parque Shopping Belém': 'CE190', // Park Shopping Belém
      'Grand Plaza Shopping': 'CE196', // Shopping Grande Plaza ABC
      'North Shopping Jóquei': 'CE245', // Northe Shopping Jóquei
      'Bosque Maia': 'CE252', // Parque Maia
      'Shopping Praça Nova Araçatuba': 'CE292', // Praça Nova Araçatuva
    };
    
    // Mapeamentos por código -> nome no Excel
    const mapeamentosPorCodigo: { [key: string]: string } = {
      'CE71': 'Shopping Bourbon SP',
      'CE131': 'Boulevard Shopping BH',
      'CE159': 'Shopping Pátio Resende',
      'CE164': 'Parque Shopping Barueri',
      'CE184': 'Shopping Palladium - Ponta Grossa',
      'CE187': 'Shopping Internacional Guarulhos',
      'CE190': 'Park Shopping Belém',
      'CE196': 'Shopping Grande Plaza ABC',
      'CE245': 'Northe Shopping Jóquei',
      'CE252': 'Parque Maia',
      'CE292': 'Praça Nova Araçatuva',
    };

    lojasExcel.forEach((lojaExcel) => {
      const codigo = lojaExcel['Loja']?.trim();
      const nome = lojaExcel['Shopping']?.trim();
      const cidade = lojaExcel['Cidade']?.trim();
      const estado = lojaExcel['Estado']?.trim();

      if (codigo && nome) {
        // Índice por código
        indicePorCodigo.set(codigo, lojaExcel);

        // Índice por nome normalizado (várias variações)
        const nomeNorm = normalizarTexto(nome);
        indicePorNomeNormalizado.set(nomeNorm, lojaExcel);
        
        // Também armazena sem "shopping", sem espaços, etc.
        const nomeSemShopping = nome.replace(/shopping\s*/gi, '').trim();
        const nomeSemShoppingNorm = normalizarTexto(nomeSemShopping);
        indicePorNomeNormalizado.set(nomeSemShoppingNorm, lojaExcel);
        
        // Versão com espaços removidos
        const nomeSemEspacos = nomeNorm.replace(/\s/g, '');
        indicePorNomeNormalizado.set(nomeSemEspacos, lojaExcel);

        // Adiciona também nome com variações de palavras comuns removidas
        const variacoesComuns = [
          nome.replace(/shopping\s*/gi, '').replace(/center\s*/gi, '').replace(/centro\s*/gi, '').trim(),
          nome.replace(/mall\s*/gi, '').trim(),
          nome.replace(/plaza\s*/gi, '').trim(),
        ];
        
        variacoesComuns.forEach(variacao => {
          const variacaoNorm = normalizarTexto(variacao);
          if (variacaoNorm && variacaoNorm !== nomeNorm) {
            indicePorNomeNormalizado.set(variacaoNorm, lojaExcel);
            indicePorNomeNormalizado.set(variacaoNorm.replace(/\s/g, ''), lojaExcel);
          }
        });

        // Índice por cidade+estado
        if (cidade && estado) {
          const chaveCidadeEstado = `${normalizarTexto(cidade)}|${normalizarTexto(estado)}`;
          if (!indicePorCidadeEstado.has(chaveCidadeEstado)) {
            indicePorCidadeEstado.set(chaveCidadeEstado, []);
          }
          indicePorCidadeEstado.get(chaveCidadeEstado)!.push(lojaExcel);
        }

        // Chave composta para busca rápida
        const chave = `${codigo}|${nomeNorm}`;
        indiceExcel.set(chave, lojaExcel);
      }
    });

    console.log(`📝 Índices criados:`);
    console.log(`   - Por código: ${indicePorCodigo.size}`);
    console.log(`   - Por nome normalizado: ${indicePorNomeNormalizado.size}`);
    console.log(`   - Por cidade+estado: ${indicePorCidadeEstado.size}`);

    // 3. Lê o arquivo lojas.ts
    const lojasTsPath = path.join(process.cwd(), 'data', 'lojas.ts');
    if (!fs.existsSync(lojasTsPath)) {
      console.error(`❌ Arquivo não encontrado: ${lojasTsPath}`);
      process.exit(1);
    }

    console.log(`\n📖 Lendo arquivo: ${lojasTsPath}`);
    let lojasTsContent = fs.readFileSync(lojasTsPath, 'utf-8');

    // 4. Processa cada loja
    const linhas = lojasTsContent.split('\n');
    const novoConteudo: string[] = [];
    let dentroDeObjetoLoja = false;
    let objetoLojaLinhas: string[] = [];
    let nomeLojaAtual = '';
    let codigoLojaAtual = '';
    let cidadeLojaAtual = '';
    let estadoLojaAtual = '';
    let indiceNome = -1;
    let indiceCodigo = -1;

    let lojasAtualizadas = 0;
    let codigosAdicionados = 0;
    let nomesAtualizados = 0;
    let naoEncontradas: string[] = [];

    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];
      const linhaTrim = linha.trim();

      // Detecta início de objeto loja
      if (linhaTrim.match(/^\{\s*$/)) {
        dentroDeObjetoLoja = true;
        objetoLojaLinhas = [linha];
        nomeLojaAtual = '';
        codigoLojaAtual = '';
        cidadeLojaAtual = '';
        estadoLojaAtual = '';
        indiceNome = -1;
        indiceCodigo = -1;
        continue;
      }

      if (dentroDeObjetoLoja) {
        objetoLojaLinhas.push(linha);

        // Detecta campos da loja
        const matchNome = linha.match(/nome:\s*['"]([^'"]+)['"]/);
        if (matchNome) {
          nomeLojaAtual = matchNome[1];
          indiceNome = objetoLojaLinhas.length - 1;
        }

        const matchCodigo = linha.match(/codigo:\s*['"]([^'"]+)['"]/);
        if (matchCodigo) {
          codigoLojaAtual = matchCodigo[1];
          indiceCodigo = objetoLojaLinhas.length - 1;
        }

        const matchCidade = linha.match(/cidade:\s*['"]([^'"]+)['"]/);
        if (matchCidade) {
          cidadeLojaAtual = matchCidade[1];
        }

        const matchEstado = linha.match(/estado:\s*['"]([^'"]+)['"]/);
        if (matchEstado) {
          estadoLojaAtual = matchEstado[1];
        }

        // Detecta fim do objeto loja
        if (linhaTrim.match(/^\},?\s*$/)) {
          dentroDeObjetoLoja = false;

          if (nomeLojaAtual) {
            // Busca correspondência no Excel
            let lojaExcelEncontrada: LojaExcel | null = null;

            // Estratégia 0: Mapeamento direto manual (mais confiável)
            if (mapeamentosDiretos[nomeLojaAtual]) {
              const codigoMapeado = mapeamentosDiretos[nomeLojaAtual];
              lojaExcelEncontrada = indicePorCodigo.get(codigoMapeado) || null;
              if (lojaExcelEncontrada) {
                console.log(`   📌 Mapeamento direto: "${nomeLojaAtual}" -> ${codigoMapeado}`);
              }
            }

            // Estratégia 1: Busca por código (se já existe)
            if (!lojaExcelEncontrada && codigoLojaAtual) {
              lojaExcelEncontrada = indicePorCodigo.get(codigoLojaAtual) || null;
            }

            // Estratégia 1b: Tenta mapeamento por código conhecido
            if (!lojaExcelEncontrada && codigoLojaAtual && mapeamentosPorCodigo[codigoLojaAtual]) {
              const nomeEsperado = mapeamentosPorCodigo[codigoLojaAtual];
              const nomeEsperadoNorm = normalizarTexto(nomeEsperado);
              lojaExcelEncontrada = indicePorNomeNormalizado.get(nomeEsperadoNorm) || null;
            }

            // Estratégia 2: Busca por nome normalizado
            if (!lojaExcelEncontrada) {
              const nomeNorm = normalizarTexto(nomeLojaAtual);
              
              // Tenta mapeamento manual primeiro
              const mapeamentoManual = mapeamentosManuais[nomeNorm] || mapeamentosManuais[nomeNorm.replace(/\s/g, '')];
              if (mapeamentoManual) {
                const nomeMapeadoNorm = normalizarTexto(mapeamentoManual);
                lojaExcelEncontrada = indicePorNomeNormalizado.get(nomeMapeadoNorm) || null;
              }
              
              if (!lojaExcelEncontrada) {
                lojaExcelEncontrada = indicePorNomeNormalizado.get(nomeNorm) || null;
              }
              
              // Tenta variações
              if (!lojaExcelEncontrada) {
                const nomeSemEspacos = nomeNorm.replace(/\s/g, '');
                lojaExcelEncontrada = indicePorNomeNormalizado.get(nomeSemEspacos) || null;
                
                // Tenta também remover palavras específicas
                if (!lojaExcelEncontrada) {
                  const nomeSemShopping = nomeNorm.replace(/shopping/gi, '').replace(/\s/g, '');
                  lojaExcelEncontrada = indicePorNomeNormalizado.get(nomeSemShopping) || null;
                }
              }
            }

            // Estratégia 3: Busca por cidade + estado + similaridade de nome
            if (!lojaExcelEncontrada && cidadeLojaAtual && estadoLojaAtual) {
              const chaveCidadeEstado = `${normalizarTexto(cidadeLojaAtual)}|${normalizarTexto(estadoLojaAtual)}`;
              const candidatos = indicePorCidadeEstado.get(chaveCidadeEstado);
              
              if (candidatos && candidatos.length > 0) {
                // Encontra o mais similar
                const nomeNorm = normalizarTexto(nomeLojaAtual);
                let melhorMatch: LojaExcel | null = null;
                let melhorSimilaridade = 0;

                for (const candidato of candidatos) {
                  const nomeCandidatoNorm = normalizarTexto(candidato['Shopping'] || '');
                  const similaridade = calcularSimilaridade(nomeNorm, nomeCandidatoNorm);
                  
                  if (similaridade > melhorSimilaridade && similaridade >= 50) { // Reduzido threshold para 50%
                    melhorSimilaridade = similaridade;
                    melhorMatch = candidato;
                  }
                }

                if (melhorMatch) {
                  lojaExcelEncontrada = melhorMatch;
                  console.log(`   🔍 Encontrada por similaridade (${melhorSimilaridade.toFixed(0)}%): "${nomeLojaAtual}" -> "${melhorMatch['Shopping']}"`);
                }
              }
            }

            // Estratégia 4: Busca em TODAS as lojas do Excel por similaridade (último recurso)
            if (!lojaExcelEncontrada) {
              const nomeNorm = normalizarTexto(nomeLojaAtual);
              let melhorMatch: LojaExcel | null = null;
              let melhorSimilaridade = 0;

              for (const lojaExcel of lojasExcel) {
                const nomeExcel = lojaExcel['Shopping']?.trim();
                if (!nomeExcel) continue;

                const nomeExcelNorm = normalizarTexto(nomeExcel);
                const similaridade = calcularSimilaridade(nomeNorm, nomeExcelNorm);
                
                // Se tem mesma cidade e estado, aumenta a similaridade
                if (cidadeLojaAtual && estadoLojaAtual) {
                  const cidadeExcel = normalizarTexto(lojaExcel['Cidade'] || '');
                  const estadoExcel = normalizarTexto(lojaExcel['Estado'] || '');
                  const cidadeLojaNorm = normalizarTexto(cidadeLojaAtual);
                  const estadoLojaNorm = normalizarTexto(estadoLojaAtual);
                  
                  if (cidadeExcel === cidadeLojaNorm && estadoExcel === estadoLojaNorm) {
                    // Aumenta similaridade se cidade e estado batem
                    const similaridadeAjustada = Math.min(100, similaridade + 20);
                    if (similaridadeAjustada > melhorSimilaridade && similaridadeAjustada >= 60) {
                      melhorSimilaridade = similaridadeAjustada;
                      melhorMatch = lojaExcel;
                    }
                    continue;
                  }
                }
                
                if (similaridade > melhorSimilaridade && similaridade >= 60) {
                  melhorSimilaridade = similaridade;
                  melhorMatch = lojaExcel;
                }
              }

              if (melhorMatch && melhorSimilaridade >= 60) {
                lojaExcelEncontrada = melhorMatch;
                console.log(`   🔍 Encontrada por busca global (${melhorSimilaridade.toFixed(0)}%): "${nomeLojaAtual}" -> "${melhorMatch['Shopping']}"`);
              }
            }

            // Atualiza com dados do Excel
            if (lojaExcelEncontrada) {
              const codigoExcel = lojaExcelEncontrada['Loja']?.trim();
              const nomeExcel = lojaExcelEncontrada['Shopping']?.trim();

              if (codigoExcel && nomeExcel) {
                let atualizou = false;

                // Atualiza código
                if (codigoLojaAtual !== codigoExcel) {
                  if (indiceCodigo >= 0) {
                    objetoLojaLinhas[indiceCodigo] = objetoLojaLinhas[indiceCodigo].replace(
                      /codigo:\s*['"]([^'"]+)['"]/,
                      `codigo: '${codigoExcel}'`
                    );
                  } else {
                    // Adiciona código após nome
                    if (indiceNome >= 0) {
                      const linhaNome = objetoLojaLinhas[indiceNome];
                      const indentacao = linhaNome.match(/^(\s*)/)?.[1] || '    ';
                      objetoLojaLinhas.splice(indiceNome + 1, 0, `${indentacao}codigo: '${codigoExcel}',`);
                      indiceCodigo = indiceNome + 1;
                    }
                  }
                  codigosAdicionados++;
                  atualizou = true;
                }

                // Atualiza nome (se diferente)
                if (nomeLojaAtual !== nomeExcel) {
                  if (indiceNome >= 0) {
                    objetoLojaLinhas[indiceNome] = objetoLojaLinhas[indiceNome].replace(
                      /nome:\s*['"]([^'"]+)['"]/,
                      `nome: '${nomeExcel.replace(/'/g, "\\'")}'`
                    );
                    nomesAtualizados++;
                    atualizou = true;
                  }
                }

                if (atualizou) {
                  lojasAtualizadas++;
                  console.log(`   ✓ ${nomeLojaAtual} -> ${nomeExcel} (${codigoExcel})`);
                }
              }
            } else {
              naoEncontradas.push(nomeLojaAtual);
            }
          }

          novoConteudo.push(...objetoLojaLinhas);
          objetoLojaLinhas = [];
          continue;
        }
      } else {
        novoConteudo.push(linha);
      }
    }

    // Faz backup
    const backupPath = path.join(process.cwd(), 'data', `lojas.backup.${Date.now()}.ts`);
    fs.writeFileSync(backupPath, fs.readFileSync(lojasTsPath, 'utf-8'), 'utf-8');
    console.log(`\n📦 Backup criado: ${backupPath}`);

    // Salva arquivo atualizado
    fs.writeFileSync(lojasTsPath, novoConteudo.join('\n'), 'utf-8');
    console.log(`\n✅ Arquivo atualizado: ${lojasTsPath}`);

    console.log(`\n📊 RESUMO:`);
    console.log(`   Lojas atualizadas: ${lojasAtualizadas}`);
    console.log(`   Códigos adicionados/atualizados: ${codigosAdicionados}`);
    console.log(`   Nomes atualizados: ${nomesAtualizados}`);

    if (naoEncontradas.length > 0) {
      console.log(`\n⚠️  Lojas não encontradas no Excel (${naoEncontradas.length}):`);
      naoEncontradas.slice(0, 20).forEach((nome) => {
        console.log(`   - ${nome}`);
      });
      if (naoEncontradas.length > 20) {
        console.log(`   ... e mais ${naoEncontradas.length - 20}`);
      }
      
      // Para cada loja não encontrada, busca candidatos similares no Excel
      console.log(`\n🔍 Buscando candidatos similares no Excel:`);
      naoEncontradas.slice(0, 15).forEach((nomeNaoEncontrado) => {
        const nomeNorm = normalizarTexto(nomeNaoEncontrado);
        const candidatos: Array<{ loja: LojaExcel; similaridade: number }> = [];
        
        for (const lojaExcel of lojasExcel) {
          const nomeExcel = lojaExcel['Shopping']?.trim();
          if (!nomeExcel) continue;
          
          const nomeExcelNorm = normalizarTexto(nomeExcel);
          const similaridade = calcularSimilaridade(nomeNorm, nomeExcelNorm);
          
          if (similaridade >= 40) {
            candidatos.push({ loja: lojaExcel, similaridade });
          }
        }
        
        candidatos.sort((a, b) => b.similaridade - a.similaridade);
        
        if (candidatos.length > 0) {
          console.log(`\n   "${nomeNaoEncontrado}":`);
          candidatos.slice(0, 3).forEach((candidato) => {
            console.log(`     → ${candidato.loja['Loja']} - "${candidato.loja['Shopping']}" (${candidato.similaridade.toFixed(0)}% similar)`);
          });
        }
      });
    }

    console.log(`\n✨ Processo concluído!`);
  } catch (error: any) {
    console.error('❌ Erro ao processar:', error.message);
    console.error(error);
    process.exit(1);
  }
}

function calcularSimilaridade(str1: string, str2: string): number {
  if (str1 === str2) return 100;
  if (!str1 || !str2) return 0;
  
  // Uma contém a outra
  if (str1.includes(str2) || str2.includes(str1)) {
    const menor = Math.min(str1.length, str2.length);
    const maior = Math.max(str1.length, str2.length);
    return (menor / maior) * 85;
  }
  
  // Similaridade por palavras
  const palavras1 = str1.split(/\s+/).filter(p => p.length > 2);
  const palavras2 = str2.split(/\s+/).filter(p => p.length > 2);
  
  if (palavras1.length === 0 || palavras2.length === 0) {
    // Fallback: similaridade por caracteres comuns
    const chars1 = new Set(str1.split(''));
    const chars2 = new Set(str2.split(''));
    const charsComuns = Array.from(chars1).filter(c => chars2.has(c)).length;
    const totalChars = Math.max(chars1.size, chars2.size);
    return totalChars > 0 ? (charsComuns / totalChars) * 70 : 0;
  }
  
  const palavrasComuns = palavras1.filter(p => palavras2.includes(p)).length;
  const totalPalavras = Math.max(palavras1.length, palavras2.length);
  
  return totalPalavras > 0 ? (palavrasComuns / totalPalavras) * 100 : 0;
}

// Executa o script
sincronizarLojas();
