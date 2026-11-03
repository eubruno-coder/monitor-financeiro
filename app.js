"use strict";
const cfg=window.MONITOR_CONFIG;
const $=id=>document.getElementById(id);
const brl=value=>Number(value).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const normalize=value=>String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase();
const months=["janeiro","fevereiro","marco","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
function money(value){
  if(typeof value==="number")return value;
  let s=String(value??"").trim().replace(/[^0-9,.-]/g,"");
  if(!s)return NaN;
  if(s.includes(","))s=s.replace(/\./g,"").replace(",",".");
  return Number(s);
}
function parseCSV(input){
  let rows=[],row=[],cell="",quoted=false;
  const text=String(input).replace(/^\uFEFF/,"");
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
    else if(c===","&&!quoted){row.push(cell);cell="";}
    else if((c==="\r"||c==="\n")&&!quoted){if(c==="\r"&&text[i+1]==="\n")i++;row.push(cell);rows.push(row);row=[];cell="";}
    else cell+=c;
  }
  if(cell||row.length){row.push(cell);rows.push(row);}
  return rows;
}
function rowsFromGviz(response){
  if(!response||response.status!=="ok"||!response.table||!Array.isArray(response.table.rows))throw Error("A fonte pública não devolveu uma tabela válida.");
  return response.table.rows.map(row=>(row.c||[]).map(cell=>cell==null?"":(cell.f!=null?cell.f:(cell.v==null?"":cell.v))));
}
function findRow(rows,col,search,from=0){
  for(let i=from;i<rows.length;i++)if(normalize((rows[i]||[])[col])===normalize(search))return i;
  return -1;
}
function extract(rows){
  const result=[];
  const add=(name,col,start,count)=>{
    if(start<0)return;
    for(let r=start;r<Math.min(rows.length,start+count);r++){
      const cells=rows[r]||[];
      const month=String(cells[col]??"").trim();
      const amount=money(cells[col+1]);
      if(!months.includes(normalize(month))||!Number.isFinite(amount)||amount<=0)continue;
      result.push({name,month,amount,paid:normalize(cells[col+2])==="pago"});
    }
  };
  const top=findRow(rows,0,"QNT PARC");
  if(top>=0){
    [
      ["Dívida 1",0],["Dívida 2",3],["Dívida 3",6],
      ["Dívida 4",9],["Dívida 5",12],["Dívida 6",15]
    ].forEach(([name,col])=>add(name,col,top+1,10));
  }
  const moto=findRow(rows,3,"PARCELAS MOTO");
  add("Parcelas da moto",3,moto+1,moto<0?0:48);
  const outros=findRow(rows,9,"DATA COMPRA",top+5);
  add("Dívida 7",9,outros+1,outros<0?0:5);
  const nicoleFirst=findRow(rows,12,"DATA COMPRA",top+5);
  add("Aluguel — 1",12,nicoleFirst+2,nicoleFirst<0?0:3);
  const nicoleSecond=findRow(rows,12,"DATA COMPRA",nicoleFirst+1);
  add("Aluguel — 2",12,nicoleSecond+2,nicoleSecond<0?0:6);
  return result;
}
let entries=[],monthlyEntries=[],busy=false; const expandedGroups=new Set();
function statusLabel(text,kind){
  const el=$("connection");
  el.textContent=text;
  el.className="pill"+(kind?" "+kind:"");
}
function updateOptions(id,values,allText){
  const select=$(id),previous=select.value;
  select.replaceChildren(new Option(allText,"all"));
  for(const value of values)select.add(new Option(value,value));
  select.value=[...select.options].some(item=>item.value===previous)?previous:"all";
}
function extractMonthly(rows){
  const start=findRow(rows,0,"PAGAMENTO MÊS");
  if(start<0)return [];
  const result=[];
  for(let r=start+1;r<Math.min(rows.length,start+25);r++){
    const cells=rows[r]||[];
    const month=String(cells[0]??"").trim();
    const amount=money(cells[1]);
    if(!months.includes(normalize(month))||!Number.isFinite(amount)||amount<=0)continue;
    result.push({month,amount,paid:normalize(cells[2])==="pago"});
  }
  return result;
}
function renderMonthly(){
  const tbody=$("monthlyRows");tbody.replaceChildren();
  const total=monthlyEntries.reduce((sum,item)=>sum+item.amount,0);
  const paid=monthlyEntries.filter(item=>item.paid);
  $("monthlyTotal").textContent=brl(total);
  $("monthlyPaid").textContent=paid.length+" mês(es)";
  $("monthlyPending").textContent=(monthlyEntries.length-paid.length)+" mês(es)";
  $("monthlyEmpty").hidden=monthlyEntries.length!==0;
  for(const item of monthlyEntries){
    const tr=document.createElement("tr");
    for(const value of [item.month,brl(item.amount)]){
      const td=document.createElement("td");td.textContent=value;tr.append(td);
    }
    const td=document.createElement("td"),badge=document.createElement("span");
    badge.className="tag"+(item.paid?" paid":"");
    badge.textContent=item.paid?"Pago":"Pendente";
    td.append(badge);tr.append(td);tbody.append(tr);
  }
}
function renderDebts(selected){
  const names=[...new Set(selected.map(item=>item.name))];
  $("debtCount").textContent=names.length+" grupos";
  const root=$("debtGrid");root.replaceChildren();
  for(const name of names){
    const items=selected.filter(item=>item.name===name);
    const total=items.reduce((sum,item)=>sum+item.amount,0);
    const paid=items.filter(item=>item.paid).reduce((sum,item)=>sum+item.amount,0);
    const pct=total?Math.round(paid/total*100):0;
    const card=document.createElement("article");card.className="debtCard";
    const heading=document.createElement("h3");heading.textContent=name;card.append(heading);
    const meta=document.createElement("div");meta.className="small";meta.textContent=items.length+" parcelas • "+items.filter(x=>x.paid).length+" pagas";card.append(meta);
    const numbers=document.createElement("div");numbers.className="debtNumbers";
    for(const [label,value,cls] of [["Total",total,""],["Restante",total-paid,"pendingText"]]){
      const part=document.createElement("div");const l=document.createElement("span");l.className="small";l.textContent=label;const v=document.createElement("strong");v.className=cls;v.textContent=brl(value);part.append(l,v);numbers.append(part);
    }
    card.append(numbers);
    const bar=document.createElement("div");bar.className="debtProgress";const fill=document.createElement("div");fill.style.width=pct+"%";bar.append(fill);card.append(bar);
    const summary=document.createElement("div");summary.className="line small";summary.textContent=pct+"% quitado • "+brl(paid)+" pago";card.append(summary);
    const list=document.createElement("div");list.className="installments";list.style.marginTop="13px";
    const expanded=expandedGroups.has(name);const visible=expanded?items:items.slice(0,4);
    for(const item of visible){
      const line=document.createElement("div");line.className="installment";
      const month=document.createElement("span");month.textContent=item.month;
      const amount=document.createElement("span");amount.className="amount";amount.textContent=brl(item.amount);
      const badge=document.createElement("span");badge.className="tag"+(item.paid?" paid":"");badge.textContent=item.paid?"Pago":"Pendente";
      line.append(month,amount,badge);list.append(line);
    }
    card.append(list);
    if(items.length>4){
      const toggle=document.createElement("button");toggle.className="debtToggle";toggle.type="button";
      toggle.textContent=expanded?"Mostrar menos":"Ver todas as "+items.length+" parcelas";
      toggle.addEventListener("click",()=>{if(expandedGroups.has(name))expandedGroups.delete(name);else expandedGroups.add(name);show();});
      card.append(toggle);
    }
    root.append(card);
  }
}
function show(){
  const group=$("group").value,status=$("statusFilter").value,month=$("month").value;
  const selected=entries.filter(item=>
    (group==="all"||group===item.name)&&
    (status==="all"||(status==="paid"&&item.paid)||(status==="pending"&&!item.paid))&&
    (month==="all"||normalize(item.month)===normalize(month)));
  renderDebts(selected);
  const total=selected.reduce((acc,item)=>acc+item.amount,0);
  const paidItems=selected.filter(item=>item.paid);
  const paid=paidItems.reduce((acc,item)=>acc+item.amount,0);
  const remaining=selected.length-paidItems.length;
  const percent=total>0?Math.min(100,Math.max(0,Math.round(paid/total*100))):0;
  $("total").textContent=brl(total);
  $("paid").textContent=brl(paid);
  $("pending").textContent=brl(total-paid);
  $("count").textContent=String(selected.length);
  $("paidCount").textContent=paidItems.length+" parcela(s) quitada(s)";
  $("pendingCount").textContent=remaining+" parcela(s) sem confirmação";
  $("percent").textContent=percent+"%";
  $("bar").style.width=percent+"%";
  $("progress").setAttribute("aria-valuenow",String(percent));
  $("shown").textContent=selected.length+" resultados";
  const tbody=$("rows");
  tbody.replaceChildren();
  for(const item of selected){
    const tr=document.createElement("tr");
    for(const value of [item.name,item.month,brl(item.amount)]){
      const td=document.createElement("td");td.textContent=value;tr.append(td);
    }
    const td=document.createElement("td");
    const badge=document.createElement("span");
    badge.className="tag"+(item.paid?" paid":"");
    badge.textContent=item.paid?"Pago":"Pendente";
    td.append(badge);tr.append(td);tbody.append(tr);
  }
  $("empty").hidden=selected.length!==0;
}
let accessToken=null,tokenClient=null,expiresAt=0;
function readyForOAuth(){return Boolean(cfg.oauthClientId&&cfg.oauthClientId.includes(".apps.googleusercontent.com"));}
function setupAuth(){
  if(!readyForOAuth()){
    statusLabel("Configuração pendente","bad");
    $("authHelp").textContent="Falta configurar o Client ID OAuth do Google Cloud. Nenhum dado financeiro será carregado até a configuração.";
    $("login").disabled=true;return;
  }
  if(!window.google?.accounts?.oauth2){statusLabel("Google indisponível","bad");$("authHelp").textContent="Não foi possível carregar o serviço de login do Google. Atualize a página.";return;}
  tokenClient=google.accounts.oauth2.initTokenClient({
    client_id:cfg.oauthClientId,
    scope:"https://www.googleapis.com/auth/spreadsheets.readonly",
    callback:response=>{
      if(response.error||!response.access_token){statusLabel("Acesso não autorizado","bad");$("authHelp").textContent="O Google não concedeu acesso: "+(response.error_description||response.error||"autorização não recebida")+". Confira os usuários de teste e as permissões da conta.";return;}
      accessToken=response.access_token;
      expiresAt=Date.now()+Math.max(0,Number(response.expires_in||3600)-60)*1000;
      $("privateContent").hidden=false;$("authNotice").hidden=true;
      $("login").hidden=true;$("logout").hidden=false;
      refresh();
    },
    error_callback:error=>{
      const type=error?.type||"unknown";
      const messages={
        popup_failed_to_open:"O navegador bloqueou a janela de login do Google. Permita pop-ups para eubruno-coder.github.io e tente novamente.",
        popup_closed:"A janela de autenticação do Google foi fechada antes da conclusão. Tente novamente e mantenha a janela aberta.",
        unknown:"Não foi possível abrir ou concluir o login do Google. Verifique as permissões de pop-up e tente novamente."
      };
      statusLabel(type==="popup_closed"?"Janela fechada":"Falha no login","bad");
      $("authHelp").textContent=messages[type]||("Falha de autenticação: "+type+". Verifique a configuração OAuth e tente novamente.");
    }
  });
  statusLabel("Login necessário");
  $("authHelp").textContent="O Google verificará as permissões da conta escolhida. O acesso é somente de leitura.";
}
function signIn(){
  if(!tokenClient){setupAuth();if(!tokenClient)return;}
  tokenClient.requestAccessToken({prompt:"select_account consent"});
}
function signOut(){
  const token=accessToken;accessToken=null;expiresAt=0;
  if(token&&window.google?.accounts?.oauth2)google.accounts.oauth2.revoke(token,()=>{});
  entries=[];monthlyEntries=[];
  $("privateContent").hidden=true;$("authNotice").hidden=false;
  $("login").hidden=false;$("logout").hidden=true;
  statusLabel("Sessão encerrada");
}
async function loadPrivateSheet(){
  if(!accessToken||Date.now()>=expiresAt){signOut();throw Error("Sessão expirada. Entre novamente com o Google.");}
  const range=encodeURIComponent("'Página1'!A1:AE100");
  const url="https://sheets.googleapis.com/v4/spreadsheets/"+encodeURIComponent(cfg.spreadsheetId)+"/values/"+range+"?valueRenderOption=FORMATTED_VALUE";
  const response=await fetch(url,{headers:{Authorization:"Bearer "+accessToken},cache:"no-store"});
  if(response.status===401){signOut();throw Error("Sessão expirada. Entre novamente.");}
  if(response.status===403)throw Error("Esta conta não tem permissão para ler a planilha, ou a Google Sheets API não está habilitada no projeto.");
  if(response.status===404)throw Error("Planilha não encontrada ou indisponível para esta conta.");
  if(!response.ok)throw Error("Falha na leitura privada (HTTP "+response.status+").");
  const data=await response.json();
  return data.values||[];
}
async function refresh(){
  if(busy||!accessToken)return;
  busy=true;$("refresh").disabled=true;statusLabel("Sincronizando...");
  try{
    const rows=await loadPrivateSheet();
    const parsed=extract(rows);
    if(!parsed.length)throw Error("Nenhuma parcela reconhecida na planilha.");
    entries=parsed;monthlyEntries=extractMonthly(rows);renderMonthly();
    updateOptions("group",[...new Set(entries.map(item=>item.name))],"Todos os grupos");
    updateOptions("month",months.filter(m=>entries.some(item=>normalize(item.month)===m)).map(m=>m[0].toUpperCase()+m.slice(1)),"Todos os meses");
    show();statusLabel("Conectado","good");
    $("updated").textContent="Última leitura: "+new Date().toLocaleString("pt-BR");
    $("error").hidden=true;
  }catch(error){
    statusLabel("Sem sincronização","bad");
    $("error").hidden=false;$("error").textContent=error.message;
  }finally{busy=false;$("refresh").disabled=false;}
}
$("group").addEventListener("change",show);
$("statusFilter").addEventListener("change",show);
$("month").addEventListener("change",show);
$("refresh").addEventListener("click",refresh);
$("login").addEventListener("click",signIn);
$("logout").addEventListener("click",signOut);
window.addEventListener("load",setupAuth);
setInterval(refresh,Math.max(15000,Number(cfg.refreshMs)||30000));
