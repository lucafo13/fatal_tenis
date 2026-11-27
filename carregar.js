
const carregador = document.createElement('div');


carregador.innerHTML = `
<div id="carregador" >
    <img src="image-removebg-preview.png" class="marquinha" alt="">
    <span >FATAL TENIS</span>
    <p id="texti">Sapataria em taiobeiras</p>
</div>
`;

document.body.prepend(carregador);

const texti = carregador.querySelector('#texti');



setTimeout(() => {
    texti.textContent = "Quase lá só mais um pouco";
}, 2000);

setTimeout(() => {
    texti.textContent = "Preparando tudo procê só um instante";
}, 5000);

function finalizarCarregamento() {
    carregador.style.opacity = '0';
    carregador.style.pointerEvents = 'none';

    setTimeout(() => {
        carregador.remove();
    }, 1000);
}

function iniciarCarregamento() {
    setTimeout(finalizarCarregamento, 7000);
}

if (document.readyState === 'complete') {
    iniciarCarregamento();
} else {
    window.addEventListener('load', iniciarCarregamento, {
        once: true
    });
}