# Compilador EC1

Esse é o nosso compilador da linguagem EC1 (aquelas expressões aritméticas
totalmente entre parênteses, tipo `(33 + (912 * 11))`). Ele faz a análise léxica,
a sintática, interpreta a expressão e gera o assembly x86-64 (pra Linux).

## Como rodar

Rodar os testes automáticos:

```bash
node ex006.js
```

Compilar um arquivo `.ec1` (ele gera o assembly e salva em `<arquivo>.s`):

```bash
node ex006.js arquivo.ec1
```

Se quiser montar e rodar de verdade no Linux:

```bash
node ex006.js arquivo.ec1      # gera arquivo.s
as --64 -o arquivo.o arquivo.s
ld  -o arquivo.bin arquivo.o
./arquivo.bin                  # mostra o resultado da expressão
```

Pra montar precisa do `runtime.s` (que vem junto), que tem as rotinas de imprimir
o número e sair do programa.

## Como ele gera o código

A geração de código percorre a árvore e o resultado sempre fica no `%rax`. Um
número vira `mov $valor, %rax`. Uma operação usa a pilha: a gente traduz o lado
direito, dá `push %rax`, traduz o lado esquerdo, dá `pop %rbx` e faz a conta
(`add`, `sub`, `imul`, ou `cqo` + `idiv` na divisão). A ordem é invertida de
propósito pra subtração e divisão darem o resultado certo.

## Testes

Os arquivos `teste_ok_*.ec1` são programas válidos e os `teste_erro_*.ec1` são os
que têm que dar erro. Rodando `node ex006.js`, cada teste certo é interpretado e o
assembly gerado também é conferido, pra garantir que os dois dão o mesmo valor.
