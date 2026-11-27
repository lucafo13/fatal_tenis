
const nome = document.querySelector("#nome");
const email = document.querySelector("#email");
const cpf = document.querySelector("#cpf");
const cep = document.querySelector("#cep");
const telefone = document.querySelector("#telefone");
const endereco = document.querySelector("#endereco");

const formaPagamento = document.querySelector(
    'input[name="forma-pagamento"]:checked'
);
const form = document.getElementById("formu-compra")
const conteudo = document.getElementById("conteudo")
form.addEventListener('submit', (e) => {
    e.preventDefault()
    const dados = {
        nome: nome.value,
        email: email.value,
        cpf: cpf.value,
        cep: cep.value,
        telefone: telefone.value,
        endereco: endereco.value,
        formaPagamento: formaPagamento.value
    }
    conteudo.innerHTML = `
    <h2>Compra realizada com sucesso!</h2>
    <p>Obrigado, ${dados.nome}, por sua compra.</p>
    <p>Um e-mail de confirmação foi enviado para ${dados.email}.</p>
    <p>Detalhes do pedido:</p>
    <ul>
        <li>CPF: ${dados.cpf}</li>
        <li>CEP: ${dados.cep}</li>
        <li>Telefone: ${dados.telefone}</li>
        <li>Endereço: ${dados.endereco}</li>
        <li>Forma de Pagamento: ${dados.formaPagamento}</li>
    </ul>
    `
    // document.getElementById("payment-sucess-dia
    // log").showModal()
    document.getElementById("payment-success-dialog").showModal();
})
const cepI = document.getElementById('cep')
const total = document.querySelector("#total")
const tabelinhadosfretesresenhudos= { 
  "SP": {valor: 15.00, prazo: "2 a 4 dias úteis"},
  "MG": {valor: 0.00, prazo: "Instantâneo"},
  "RJ": {valor: 20.00, prazo: "3 a 5 dias úteis"},
  "PR": {valor: 22.00, prazo: "4 a 6 dias úteis"}
  ,
  "PADRAO": {valor: 35.00, prazo: "7 a 12 dias úteis"}
}
cepI.addEventListener('blur', async () => {
  const cep = cepI.value.replace(/\D/g, "").trim()
  const resultado = document.querySelector("#frete")

  const sub = document.querySelector("#checkout-subtotal")
  const pre = sub.textContent.replace("R$", "")
  const antes = parseFloat( pre.replace(".", "").replace(',', ".")) || 0
  console.log(antes);
  
  if(cep.length !== 8){
    resultado.innerText = "Nao achei"
    return
  }
  resultado.textContent = "buscando..."
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    const data = await res.json()
    if(data.erro){
      resultado.textContent ="nao deu"
      return
    }
    if(data.localidade === "Taiobeiras"){
      resultado.textContent = `Entrega em ${data.localidade} - ${data.uf} | frete 0, já chegou`
          const tot = 0 + antes
    total.innerText = `R$ ${(tot).toFixed(2).replace(".", ",")}`
      return
    }
    const frete = tabelinhadosfretesresenhudos[data.uf] || tabelinhadosfretesresenhudos["PADRAO"]
    resultado.textContent = `
    Destino: ${data.localidade} - ${data.uf} | Frete: ${frete.valor.toFixed(2).replace(".", ",")}
    `
    const tot = frete.valor + antes
    total.innerText = `R$ ${(tot).toFixed(2).replace(".", ",")}`
  } catch (error) {
    console.log(error);
    
    resultado.textContent = "Nao foi óssivel, faz certo"
  }
})
