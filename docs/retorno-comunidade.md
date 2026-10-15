# Retorno da comunidade

## 1. Geral (cabeçalho das páginas)

- Destaque visual nos títulos: adicionar uma cor de fundo no bloco do título/subtítulo de cada página (conforme a área circulada no topo da tela) para o usuário identificar facilmente em qual seção está.
  - Imóveis: fundo verde
  - Clientes: fundo azul
  - Contratos: fundo amarelo
- Validar se Recebimentos e as demais telas também devem receber uma cor específica no cabeçalho.

## 2. Página: Clientes

### Tabela principal (clientes cadastrados)

- Remover as colunas CPF e e-mail da listagem inicial.
- Adicionar as colunas Cônjuge e Telefone secundário.
- Estrutura final das colunas, nesta ordem:
  - Cliente (nome completo)
  - Telefone principal
  - Cônjuge (apenas o 1º nome)
  - Telefone secundário

- Remover o botão de cadastrar clientes na parte superior da tabela  

### Modal de visualização

- Criar um botão Visualizar ("Ver") na coluna Ações, ao lado de Editar e Excluir.
- Ao clicar, abrir um modal com todos os dados cadastrados daquele cliente, incluindo CPF, RG, e-mail, endereço e demais campos.

## 3. Página: Imóveis

### Tabela principal (imóveis cadastrados)

- Renomear o cabeçalho da coluna VALOR para **Valor do imóvel**.

## 4. Página: Contratos

### Tabela principal (contratos cadastrados)

- Reordenar e ajustar as colunas, que hoje estão como Nº Contrato, Cliente, Imóvel, Tipo, Período, Valor e Status, para esta sequência:
  - Nº de contrato
  - Imóvel
  - Tipo
  - Valor do contrato (renomear o título atual VALOR)
  - Período
  - Cliente (exibir somente o 1º nome)
  - Status

- Remover o botão de cadastrar contrato na parte superior da tabela  


### Modal de visualização (botão Ver)

- Cliente e cônjuge: exibir nome completo e telefone do cliente, mais nome e telefone do cônjuge.
- Imóvel: exibir endereço, bairro, cidade e todas as demais informações adicionais cadastradas para o imóvel.
- Vencimento: exibir a data/dia de vencimento mensal do contrato (exemplo: "Dia 10 de cada mês").

## 5. Página: Recebimentos

- Adicionar o botão atualizar na parte superior do cabeçalho, ao lado do título recebimentos 

### Gerador de recibo em PDF

- Adicionar um botão para gerar recibo de pagamento em PDF.
- Dados que devem constar no documento:
  - Nome do cliente
  - Número/identificação do contrato vinculado
  - Valor recebido
  - Mês de referência do pagamento
  - Campo para assinatura, pronto para assinar e enviar como comprovante ao cliente
