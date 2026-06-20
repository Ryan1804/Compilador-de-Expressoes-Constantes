class Token {
  constructor(tipo, lexema, posicao) {
    this.tipo = tipo;
    this.lexema = lexema;
    this.posicao = posicao;
  }
}

class AnalisadorLexico {
  constructor(entrada) {
    this.entrada = entrada;
    this.posicao = 0;
  }

  proximoToken() {
    while (this.posicao < this.entrada.length) {
      let char = this.entrada[this.posicao];

      if (/\s/.test(char)) {
        this.posicao++;
        continue;
      }

      const simbolos = {
        '(': 'ParenEsq', ')': 'ParenDir',
        '+': 'Soma', '-': 'Sub',
        '*': 'Mult', '/': 'Div'
      };

      if (simbolos[char]) {
        const token = new Token(simbolos[char], char, this.posicao);
        this.posicao++;
        return token;
      }

      if (/[0-9]/.test(char)) {
        let inicio = this.posicao;
        let lexema = '';

        while (this.posicao < this.entrada.length && /[0-9]/.test(this.entrada[this.posicao])) {
          lexema += this.entrada[this.posicao];
          this.posicao++;
        }
        return new Token('Numero', lexema, inicio);
      }

      throw new Error(`Erro léxico na posição ${this.posicao}: caractere '${char}' não reconhecido.`);
    }

    return new Token('EOF', 'EOF', this.posicao);
  }
}


class Exp {
  avaliar() { throw new Error("Método abstrato não implementado."); }
  imprimir() { throw new Error("Método abstrato não implementado."); }
  gerarCodigo() { throw new Error("Método abstrato não implementado."); }
}

class Const extends Exp {
  constructor(valorStr) {
    super();
    this.valor = parseInt(valorStr, 10);
  }

  avaliar() {
    return this.valor;
  }

  imprimir() {
    return this.valor.toString();
  }

  gerarCodigo() {
    return [`mov $${this.valor}, %rax`];
  }
}

class OpBin extends Exp {
  constructor(operador, esq, dir) {
    super();
    this.operador = operador;
    this.esq = esq;
    this.dir = dir;
  }

  avaliar() {
    const valEsq = this.esq.avaliar();
    const valDir = this.dir.avaliar();

    switch (this.operador) {
      case '+': return valEsq + valDir;
      case '-': return valEsq - valDir;
      case '*': return valEsq * valDir;
      case '/': return Math.trunc(valEsq / valDir);
      default: throw new Error(`Operador desconhecido: ${this.operador}`);
    }
  }

  imprimir() {
    return `(${this.esq.imprimir()} ${this.operador} ${this.dir.imprimir()})`;
  }

  gerarCodigo() {
    const codigo = [];

    codigo.push(...this.dir.gerarCodigo());
    codigo.push('push %rax');
    codigo.push(...this.esq.gerarCodigo());
    codigo.push('pop %rbx');

    switch (this.operador) {
      case '+':
        codigo.push('add %rbx, %rax');
        break;
      case '-':
        codigo.push('sub %rbx, %rax');
        break;
      case '*':
        codigo.push('imul %rbx, %rax');
        break;
      case '/':
        codigo.push('cqo');
        codigo.push('idiv %rbx');
        break;
      default:
        throw new Error(`Operador desconhecido: ${this.operador}`);
    }

    return codigo;
  }
}

class AnalisadorSintatico {
  constructor(lexer) {
    this.lexer = lexer;
    this.tokenAtual = this.lexer.proximoToken();
  }

  consumir(tipoEsperado) {
    if (this.tokenAtual.tipo === tipoEsperado) {
      const tokenConsumido = this.tokenAtual;
      this.tokenAtual = this.lexer.proximoToken();
      return tokenConsumido;
    } else {
      throw new Error(`Erro sintático na posição ${this.tokenAtual.posicao}: Esperava '${tipoEsperado}', encontrou '${this.tokenAtual.lexema}'.`);
    }
  }

  analisaExp() {
    if (this.tokenAtual.tipo === 'Numero') {
      const token = this.consumir('Numero');
      return new Const(token.lexema);
    }
    else if (this.tokenAtual.tipo === 'ParenEsq') {
      this.consumir('ParenEsq');
      const esq = this.analisaExp();
      const operador = this.analisaOperador();
      const dir = this.analisaExp();
      this.consumir('ParenDir');
      return new OpBin(operador, esq, dir);
    }
    else {
      throw new Error(`Erro sintático na posição ${this.tokenAtual.posicao}: Expressão inválida iniciada por '${this.tokenAtual.lexema}'.`);
    }
  }

  analisaOperador() {
    const tiposOperadores = ['Soma', 'Sub', 'Mult', 'Div'];
    if (tiposOperadores.includes(this.tokenAtual.tipo)) {
      const tokenOp = this.tokenAtual;
      this.consumir(tokenOp.tipo);
      return tokenOp.lexema;
    } else {
      throw new Error(`Erro sintático na posição ${this.tokenAtual.posicao}: Esperava um operador matemático, encontrou '${this.tokenAtual.lexema}'.`);
    }
  }

  analisar() {
    const ast = this.analisaExp();
    if (this.tokenAtual.tipo !== 'EOF') {
      throw new Error(`Erro sintático na posição ${this.tokenAtual.posicao}: Código extra encontrado após a expressão principal.`);
    }
    return ast;
  }
}


function gerarPrograma(ast) {
  const corpo = ast.gerarCodigo()
    .map(linha => '\t' + linha)
    .join('\n');

  return [
    '\t#',
    '\t# modelo de saida para o compilador EC1',
    '\t#',
    '',
    '\t.section .text',
    '\t.globl _start',
    '',
    '_start:',
    '\t## codigo gerado para a expressao',
    corpo,
    '',
    '\tcall imprime_num',
    '\tcall sair',
    '',
    '\t.include "runtime.s"',
    ''
  ].join('\n');
}

function simularAssembly(linhas) {
  let rax = 0n, rbx = 0n;
  const pilha = [];

  for (const linha of linhas) {
    const instr = linha.trim();
    let m;

    if ((m = instr.match(/^mov \$(-?\d+), %rax$/))) {
      rax = BigInt(m[1]);
    } else if (instr === 'push %rax') {
      pilha.push(rax);
    } else if (instr === 'pop %rbx') {
      rbx = pilha.pop();
    } else if (instr === 'add %rbx, %rax') {
      rax = rax + rbx;
    } else if (instr === 'sub %rbx, %rax') {
      rax = rax - rbx;
    } else if (instr === 'imul %rbx, %rax') {
      rax = rax * rbx;
    } else if (instr === 'cqo') {
    } else if (instr === 'idiv %rbx') {
      rax = rax / rbx;
    } else {
      throw new Error(`Instrução não reconhecida pelo simulador: '${instr}'`);
    }
  }

  if (pilha.length !== 0) {
    throw new Error(`Pilha desbalanceada ao final da execução (${pilha.length} valor(es) restante(s)).`);
  }

  return Number(rax);
}


const fs = require('fs');
const path = require('path');

function compilar(codigo) {
  const lexer = new AnalisadorLexico(codigo);
  const parser = new AnalisadorSintatico(lexer);
  return parser.analisar();
}

function executarTestes() {
  const dir = process.cwd();
  const files = fs.readdirSync(dir);
  const okFiles = files.filter(f => /^teste_ok_.*\.ec1$/.test(f));
  const errFiles = files.filter(f => /^teste_erro_.*\.ec1$/.test(f));

  let passed = 0;
  let failed = 0;

  console.log('Executando suíte de testes (esperados: OK)');
  for (const f of okFiles) {
    const codigo = fs.readFileSync(path.join(dir, f), 'utf8');
    try {
      const ast = compilar(codigo);
      const valor = ast.avaliar();

      const linhas = ast.gerarCodigo();
      const valorAsm = simularAssembly(linhas);
      if (valorAsm !== valor) {
        throw new Error(`código gerado calculou ${valorAsm}, esperado ${valor}`);
      }

      console.log(`OK: ${f} -> ${ast.imprimir()} = ${valor} (asm = ${valorAsm})`);
      passed++;
    } catch (e) {
      console.log(`FAIL: ${f} -> ${e.message}`);
      failed++;
    }
  }

  console.log('\nExecutando suíte de testes (esperados: ERRO)');
  for (const f of errFiles) {
    const codigo = fs.readFileSync(path.join(dir, f), 'utf8');
    try {
      compilar(codigo);
      console.log(`FAIL: ${f} -> não detectou erro`);
      failed++;
    } catch (e) {
      console.log(`OK: ${f} -> erro detectado: ${e.message}`);
      passed++;
    }
  }

  console.log(`\nResumo: passed=${passed} failed=${failed}`);
  if (failed > 0) process.exit(1);
}

const caminhoArquivo = process.argv[2];

if (!caminhoArquivo) {
  executarTestes();
} else {
  try {
    const codigo = fs.readFileSync(caminhoArquivo, 'utf-8');

    console.log("=== ANÁLISE LÉXICA (Tokens) ===");
    const lexer = new AnalisadorLexico(codigo);
    let token = lexer.proximoToken();

    while (token.tipo !== 'EOF') {
      console.log(`<${token.tipo}, "${token.lexema}", ${token.posicao}>`);
      token = lexer.proximoToken();
    }

    console.log("\n=== ANÁLISE SINTÁTICA (AST) ===");
    const lexerParaSintatico = new AnalisadorLexico(codigo);
    const parser = new AnalisadorSintatico(lexerParaSintatico);

    const ast = parser.analisar();

    console.log(`Árvore Sintática: ${ast.imprimir()}`);

    console.log("\n=== RESULTADO DA INTERPRETAÇÃO ===");
    const resultado = ast.avaliar();
    console.log(resultado);

    console.log("\n=== GERAÇÃO DE CÓDIGO (assembly x86-64) ===");
    const assembly = gerarPrograma(ast);

    const parsed = path.parse(caminhoArquivo);
    const arquivoSaida = path.join(parsed.dir, parsed.name + '.s');
    fs.writeFileSync(arquivoSaida, assembly, 'utf-8');
    console.log(`Assembly salvo em: ${arquivoSaida}`);
    console.log('\n' + assembly);

  } catch (erro) {
    console.error("\n ERRO DETECTADO:");
    console.error(erro.message);
    process.exit(1);
  }
}
