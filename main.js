const fs = require("fs");

const {
    AnalisadorLexico
} = require("./analisador_lexico");

const AnalisadorSintatico =
    require("./analisador_sintatico");

const codigo =
    fs.readFileSync(
        process.argv[2],
        "utf8"
    );

try{
        const lexer =
        new AnalisadorLexico(codigo);

    const parser =
        new AnalisadorSintatico(lexer);

    const arvore =
        parser.parse();

    console.log(
        arvore.avaliar()
    );

    arvore.imprimir();
}
catch(erro){
    console.error(erro.message);
}