class Token {
  constructor(tipo, lexema, posicao) {
    this.tipo = tipo;
    this.lexema = lexema;
    this.posicao = posicao;
  }
}

class LexicalError extends Error {
  constructor(position, character) {
    super(
      `Erro lexico na posicao ${position}: caractere invalido '${character}'`,
    );
    this.name = "LexicalError";
    this.position = position;
    this.character = character;
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
        "(": "ParenEsq",
        ")": "ParenDir",
        "+": "Soma",
        "-": "Sub",
        "*": "Mult",
        "/": "Div",
      };

      if (simbolos[char]) {
        const token = new Token(simbolos[char], char, this.posicao);
        this.posicao++;
        return token;
      }

      if (/[0-9]/.test(char)) {
        let inicio = this.posicao;
        let lexema = "";

        while (
          this.posicao < this.entrada.length &&
          /[0-9]/.test(this.entrada[this.posicao])
        ) {
          lexema += this.entrada[this.posicao];
          this.posicao++;
        }
        return new Token("Numero", lexema, inicio);
      }

      throw new LexicalError(this.posicao, char);
    }

    return new Token("EOF", "EOF", this.posicao);
  }
}

module.exports = {
    Token,
    LexicalError,
    AnalisadorLexico
};