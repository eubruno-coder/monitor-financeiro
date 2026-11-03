# Monitor Financeiro · V1

Dashboard estático e responsivo para acompanhar os pagamentos da planilha **SITUAÇÃO FINANCEIRA** no Google Sheets.

## Acessos

- **Repositório:** https://github.com/eubruno-coder/monitor-financeiro
- **Endereço esperado após habilitar o Pages:** https://eubruno-coder.github.io/monitor-financeiro/
- **Planilha vinculada:** https://docs.google.com/spreadsheets/d/1a--i0Q93IaHzktjqwWgF5Y7ZGKW9Eqn-G57Lyz4T5oM/edit?gid=0

> O repositório e o dashboard são públicos. Os dados da aba publicada também ficam disponíveis para leitura pública. Não cadastre informações confidenciais nessa aba.

## Como ativar o GitHub Pages

1. Abra o repositório e entre em **Settings → Pages**.
2. Em **Build and deployment**, selecione **Deploy from a branch**.
3. Selecione **main**, diretório **/(root)**, e clique em **Save**.
4. Aguarde o GitHub indicar a publicação e abra o endereço do monitor acima.

Nenhum servidor, banco pago ou chave de API é necessário para a versão de testes.

## Fonte dos dados

A configuração está no arquivo \`config.js\` e aponta para a aba **Página1** (\`gid=0\`) da planilha.

O monitor tenta ler o CSV público em \`/export?format=csv&gid=0\`. Se o navegador bloquear o CSV por CORS ou a fonte não estiver disponível nessa rota, tenta a interface de visualização pública (\`/gviz/tq\`) por JSONP. A página informa claramente se nenhuma fonte puder ser consultada.

É necessário publicar a **aba Página1**: **Arquivo → Compartilhar → Publicar na Web → Página1 → CSV → Publicar**. Essa ação não muda automaticamente as permissões de edição do arquivo original.

## Atualizações

- O site tenta uma nova leitura automaticamente a cada **30 segundos** enquanto a página estiver aberta.
- O botão **Atualizar** força uma tentativa imediata.
- O Google pode aplicar cache e atrasar a propagação dos novos pagamentos.
- Se a fonte não estiver disponível, o monitor mantém os últimos dados lidos na sessão e exibe um aviso.

## Estrutura dos dados

A planilha possui blocos paralelos. Por isso, o monitor reconhece:

- Seis grupos de dívidas na parte superior;
- Pagamentos mensais;
- 48 parcelas da moto, incluindo as últimas linhas da tabela;
- Outros grupos de dívidas e registros identificados como Nicole.

**Somente linhas que contêm um mês reconhecido e um valor positivo são consideradas parcelas.** Células auxiliares de totais, quantidades e saldos são ignoradas para evitar duplicações. Um status exatamente equivalente a \`Pago\` indica quitação; sem essa marcação, a parcela é exibida como \`Pendente\`. Não há inferência de atraso nem de ano, pois várias datas possuem somente o nome do mês.

Os grupos sem nomes claros foram identificados provisoriamente como "Dívida 1" etc. Os rótulos e faixas podem ser ajustados em \`app.js\` conforme a planilha evoluir. Reorganizar linhas e colunas poderá exigir ajustes no parser.

## Tecnologias

HTML5, CSS3 e JavaScript sem frameworks, com GitHub Pages para hospedagem. Dados consultados diretamente do Google Sheets, sem gravação ou edição pelo dashboard.

## Diagnóstico de erros

Se aparecer **Sem sincronização**, confira se a planilha está publicada para acesso anônimo e se a aba **Página1** foi selecionada na publicação. Se os dois endpoints públicos falharem, será necessário configurar o **endereço CSV de publicação** emitido pelo Google (formato \`https://docs.google.com/spreadsheets/d/e/.../pub?output=csv\`) como fonte explícita ou adotar uma camada de integração dedicada.

O GitHub Pages precisa ser habilitado uma vez nas configurações do repositório; enviar os arquivos por si só não ativa a hospedagem.
