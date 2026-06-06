class Exp {}

class Const extends Exp {
    constructor(valor) {
        super();
        this.valor = valor;
    }

    avaliar() {
        return this.valor;
    }

    imprimir(prefixo = "", ultimo = true) {

    console.log(
        prefixo +
        (ultimo ? "└── " : "├── ") +
        this.valor
    );
    }
}

class OpBin extends Exp {
    constructor(op, esq, dir) {
        super();

        this.op = op;
        this.esq = esq;
        this.dir = dir;
    }

    avaliar() {
        const vEsq = this.esq.avaliar();
        const vDir = this.dir.avaliar();

        switch (this.op) {
            case "+":
                return vEsq + vDir;

            case "-":
                return vEsq - vDir;

            case "*":
                return vEsq * vDir;

            case "/":
                return vEsq / vDir;
        }
    }

    imprimir(prefixo = "", ultimo = true) {

    console.log(
        prefixo +
        (ultimo ? "└── " : "├── ") +
        this.op
    );

    this.esq.imprimir(
        prefixo + (ultimo ? "    " : "│   "),
        false
    );

    this.dir.imprimir(
        prefixo + (ultimo ? "    " : "│   "),
        true
    );
    }
}

class AnalisadorSintatico {
    constructor(lexer){
        this.lexer = lexer;
        this.tokenAtual = lexer.proximoToken();
    }

    consumir(tipoEsperado) {

        if (this.tokenAtual.tipo === tipoEsperado) {

            this.tokenAtual = this.lexer.proximoToken();

        }

        else {

            throw new Error(`Esperado ${tipoEsperado}, encontrado ${this.tokenAtual.tipo}`);

        }
    }

    analisaOperador() {

    switch (this.tokenAtual.tipo) {

      case "Soma":
        this.consumir("Soma");
        return "+";

      case "Sub":
        this.consumir("Sub");
        return "-";

      case "Mult":
        this.consumir("Mult");
        return "*";

      case "Div":
        this.consumir("Div");
        return "/";

      default:
        throw new Error(
          `Operador esperado na posição ${this.tokenAtual.posicao}`
        );
    }
  }

    analisaExp() {

        let tok = this.tokenAtual;

        if (tok.tipo === "Numero") {

        this.consumir("Numero");

        return new Const(
            parseInt(tok.lexema)
        );
        }

        else if (tok.tipo === "ParenEsq") {

        this.consumir("ParenEsq");

        let esq =
            this.analisaExp();

        let operador =
            this.analisaOperador();

        let dir =
            this.analisaExp();

        this.consumir("ParenDir");

        return new OpBin(
            operador,
            esq,
            dir
        );
        }

        throw new Error(
        `Expressão inválida na posição ${tok.posicao}`
        );
  }

    parse() {
        const arvore = this.analisaExp();

        this.consumir("EOF");

        return arvore;
    }

}

module.exports = AnalisadorSintatico;