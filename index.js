emailjs.init("5_JqmtV7HfHYu5zbd")


const send = document.getElementById('send')
send.addEventListener('click', () => {
    const nome = document.getElementById('nome').value
const email = document.getElementById('email').value
const msg = document.getElementById('msg').value
    if(nome === "" || email === "" || msg === "") {
        return alert("preencha os campos")
    } 
    emailjs.send(
    'service_6vp4bi1', 'template_4026jfk', 
    {
     nome: nome,
     email: email,
    mensagem: msg
    }
)
    alert(`email enviado com o nome de ${nome} com sucesso`)
})




let lilcar = document.getElementById('lilcar')
let lilcars = document.getElementById('lilcars')
let quantidade = document.getElementById('quan')
let lilcarx = document.getElementById('lilcarx')
lilcar.addEventListener('click', function(){

    lilcarx.classList.toggle('active')
});
lilcar.addEventListener('click', function(){

    lilcarx.classList.toggle('active')
});
const produtos = []
function adicionarProduto(nome) {
    produtos.push(nome);
    atualizarCarrinho();
     localStorage.setItem('carrinho', JSON.stringify(produtos));
    alerta(`Produto ${nome} adicionado ao carrinho!`)
  
}
function atualizarCarrinho() {
    lilcars.innerHTML = '';
    for(i of produtos){
        lilcars.innerHTML += `<p>${i}</p>`
    }
}