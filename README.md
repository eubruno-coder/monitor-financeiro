# Monitor Financeiro

> Dashboard web estático para leitura e visualização de dados tabulares publicados em uma planilha Google Sheets.

[![Status](https://img.shields.io/badge/status-V1%20%7C%20teste-blue)](#status)
[![Stack](https://img.shields.io/badge/stack-HTML%20%7C%20CSS%20%7C%20JavaScript-yellow)](#tecnologias)
[![Fonte](https://img.shields.io/badge/fonte-Google%20Sheets-34A853?logo=googlesheets&logoColor=white)](#fonte-dos-dados)

---

## Objetivo

O **Monitor Financeiro** demonstra como consumir dados tabulares publicados no Google Sheets e apresentá-los em um dashboard responsivo, sem manter um backend próprio na versão atual.

A aplicação foi concebida para leitura e acompanhamento. Ela não edita a planilha, não processa pagamentos e não substitui um sistema financeiro ou contábil.

## Funcionalidades documentadas

- Leitura de dados de uma aba publicada do Google Sheets.
- Atualização automática periódica enquanto a página permanece aberta.
- Botão para solicitar nova consulta.
- Tratamento de indisponibilidade da fonte de dados.
- Manutenção dos últimos dados carregados durante a sessão, acompanhada de aviso quando a sincronização falha.
- Interface web responsiva.

## Tecnologias

- HTML5
- CSS3
- JavaScript Vanilla
- Google Sheets como fonte externa
- GitHub Pages para hospedagem estática

## Arquitetura atual

```text
monitor-financeiro/
├── index.html   # Interface do dashboard
├── app.js       # Leitura, interpretação e apresentação dos dados
├── config.js    # Identificação da planilha e parâmetros de consulta
└── README.md
```

## Fluxo de dados

```text
Google Sheets
     │
     ▼
Aba publicada para leitura
     │
     ▼
CSV / endpoint de visualização
     │
     ▼
JavaScript no navegador
     │
     ▼
Dashboard
```

O navegador consulta a fonte externa diretamente. Não existe camada intermediária de servidor na V1.

## Configuração da fonte

Os parâmetros de conexão ficam em `config.js`. Para utilizar outra planilha, configure o identificador e a aba correspondentes conforme o formato esperado pelo código.

A aba precisa estar publicada para leitura pela aplicação. A publicação de uma aba torna seu conteúdo acessível a quem obtiver o endereço público; portanto, utilize somente dados apropriados para divulgação.

**Não publique dados bancários, documentos, informações pessoais, dívidas identificáveis ou registros financeiros privados em uma planilha aberta.** Para dados reais e restritos, a arquitetura deve ser substituída por uma integração autenticada com controle de acesso no servidor.

## Atualização e falhas

- A aplicação tenta atualizar os dados em intervalos regulares.
- O botão de atualização permite solicitar uma nova leitura.
- A propagação de alterações pode sofrer atraso por cache do provedor.
- Se a fonte não responder, a interface deve informar a falha em vez de apresentar dados antigos como se fossem atuais.

## Limitações da V1

- Somente leitura; o dashboard não altera a planilha.
- A fonte de dados precisa estar publicada para acesso pelo navegador.
- Não há autenticação própria nem isolamento de usuários.
- Não há backend, banco de dados ou trilha de auditoria.
- A estrutura da planilha influencia diretamente o parser; mudanças em linhas, colunas ou rótulos podem exigir ajustes no código.
- A disponibilidade depende do Google Sheets e dos endpoints públicos utilizados.

## Executar localmente

1. Clone o repositório.
2. Verifique os parâmetros em `config.js`.
3. Inicie um servidor HTTP local ou utilize a publicação pelo GitHub Pages.
4. Abra a aplicação no navegador.

A consulta à planilha pode ser bloqueada quando o arquivo é aberto diretamente por `file://`, dependendo das políticas do navegador e da origem externa.

## Publicação

O projeto pode ser hospedado pelo GitHub Pages, utilizando a branch principal e a raiz do repositório como origem, desde que essa configuração esteja habilitada nas configurações do GitHub.

## Roadmap

### V1 — Dashboard de leitura
- [x] Interface estática
- [x] Consulta a fonte Google Sheets
- [x] Atualização periódica
- [x] Tratamento básico de falha de sincronização

### V1.1 — Robustez
- [ ] Validar esquema dos dados antes de renderizar
- [ ] Melhorar mensagens de erro e diagnóstico
- [ ] Adicionar testes para o parser
- [ ] Separar apresentação e camada de dados
- [ ] Documentar claramente os campos esperados

### V2 — Segurança e evolução
- [ ] Avaliar backend para fontes privadas
- [ ] Implementar autenticação e autorização se houver múltiplos usuários
- [ ] Adicionar histórico confiável de atualizações
- [ ] Criar controles de acesso e auditoria
- [ ] Definir política de retenção e privacidade

## Status

**V1 — protótipo de dashboard estático.** A aplicação demonstra leitura e visualização de uma fonte externa. Não deve ser utilizada para expor informações financeiras pessoais ou operar dados privados sem uma arquitetura de segurança apropriada.

## Autor

Desenvolvido por **Bruno Silva**.

GitHub: [eubruno-coder](https://github.com/eubruno-coder)

---

**Projeto:** Monitor Financeiro  
**Categoria:** Dashboard / Integração de dados  
**Stack:** HTML, CSS, JavaScript e Google Sheets  
**Status:** V1 — teste
