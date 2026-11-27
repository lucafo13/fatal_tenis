const pageScripts = new Map();
let activeFormsController;
let pageVisit = 0;
const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

function loadScript(url, isReady) {
  if (isReady()) return Promise.resolve();
  if (pageScripts.has(url)) return pageScripts.get(url);

  const pending = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Não foi possível carregar ${url}`));
    document.head.append(script);
  });

  pageScripts.set(url, pending);
  pending.catch(() => pageScripts.delete(url));
  return pending;
}

function loadStyle(url) {
  const alreadyLoaded = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .some((link) => link.href === url);
  if (alreadyLoaded) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    link.onload = resolve;
    link.onerror = () => reject(new Error(`Não foi possível carregar ${url}`));
    document.head.append(link);
  });
}

function initializeCheckoutSummary() {
  const itemsList = document.getElementById("checkout-items");
  const summary = document.getElementById("checkout-summary");
  const emptyMessage = document.getElementById("checkout-empty");
  if (!itemsList || !summary) return;

  try {
    const savedCart = JSON.parse(window.localStorage.getItem("fatal-tenis-cart") || "[]");
    if (!Array.isArray(savedCart)) {
      throw new TypeError("Formato de sacola salvo inválido.");
    }

    const groups = savedCart.reduce((counts, item) => {
      const name = typeof item === "string" ? item : item?.name;
      const unitPrice = typeof item === "string" ? null : item?.unitPrice;
      const size = typeof item === "string" ? null : item?.size ?? null;
      if (
        typeof name !== "string"
        || (unitPrice !== null && (typeof unitPrice !== "number" || !Number.isFinite(unitPrice) || unitPrice < 0))
        || (size !== null && (!Number.isInteger(size) || size < 35 || size > 44 || size === 36 || size === 40))
      ) {
        throw new TypeError("Formato de item salvo inválido.");
      }

      const key = `${name}\u0000${unitPrice ?? "a-confirmar"}\u0000${size ?? "a-confirmar"}`;
      const group = counts.get(key) || { name, unitPrice, size, quantity: 0 };
      group.quantity += 1;
      counts.set(key, group);
      return counts;
    }, new Map());

    let subtotal = 0;
    let totalKnown = true;
    groups.forEach(({ name, unitPrice, size, quantity }) => {
      const item = document.createElement("li");
      const label = document.createElement("span");
      const sizeLabel = size === null ? "numeração a confirmar" : `nº ${size}`;
      label.textContent = `${name} · ${sizeLabel} × ${quantity}`;
      const amount = document.createElement("span");
      amount.textContent = unitPrice === null
        ? "Preço a confirmar"
        : currency.format(unitPrice * quantity);
      if (unitPrice === null) {
        totalKnown = false;
      } else {
        subtotal += unitPrice * quantity;
      }
      item.append(label, amount);
      itemsList.append(item);
    });
    const hasItems = savedCart.length > 0;
    summary.hidden = !hasItems;
    if (emptyMessage) emptyMessage.hidden = hasItems;

    const subtotalLabel = document.getElementById("checkout-subtotal");
    const totalLabel = document.getElementById("checkout-total");
    if (subtotalLabel) {
      subtotalLabel.textContent = totalKnown
        ? currency.format(Math.round(subtotal * 100) / 100)
        : "A confirmar";
    }
    if (totalLabel) totalLabel.textContent = "A confirmar";
  } catch (error) {
    console.error("Não foi possível carregar os itens da compra:", error);
    summary.hidden = true;
    if (emptyMessage) emptyMessage.hidden = false;
  }
}

function initializeCheckoutPage(signal) {
  const form = document.querySelector("#formu");
  const status = document.getElementById("checkout-status");
  if (!form || !status || !document.querySelector(".payment-methods")) return;

  const notes = {
    pix: "Prévia do Pix selecionada. O QR Code real depende da configuração de uma cobrança.",
    cartao: "Prévia do cartão selecionada. Não digite dados reais neste formulário.",
    boleto: "Prévia do boleto selecionada. A linha digitável depende da configuração de uma cobrança."
  };
  const paymentOptions = form.querySelectorAll('input[name="forma-pagamento"]');
  const paymentPanels = form.querySelectorAll("[data-payment-panel]");
  const updatePaymentNote = () => {
    const selected = form.querySelector('input[name="forma-pagamento"]:checked');
    status.textContent = notes[selected?.value] || "Escolha uma forma de pagamento disponível.";
    paymentOptions.forEach((option) => {
      const choice = option.closest(".payment-option");
      choice?.classList.toggle("is-selected", option.checked);
      choice?.setAttribute("aria-expanded", String(option.checked));
    });
    paymentPanels.forEach((panel) => {
      panel.hidden = panel.dataset.paymentPanel !== selected?.value;
    });
  };

  paymentOptions.forEach((option) => {
    option.addEventListener("change", updatePaymentNote, { signal });
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    status.textContent = "Nenhum pedido foi enviado: o pagamento ainda não está configurado.";
  }, { signal });
  updatePaymentNote();
}

function initializeContactForm(signal) {
  const form = document.getElementById("formu");
  const message = document.getElementById("msg");
  const status = document.getElementById("email-status");
  if (!form || !message || !status) return;

  const selectedItems = new URLSearchParams(window.location.search).get("itens");
  if (selectedItems) {
    message.value = `Olá! Tenho interesse nestes modelos: ${selectedItems}.`;
  }

  const emailServiceReady = Boolean(window.emailjs);
  if (emailServiceReady) {
    try {
      window.emailjs.init({ publicKey: "5_JqmtV7HfHYu5zbd" });
    } catch (error) {
      console.error("Falha ao inicializar o envio de mensagens:", error);
      status.textContent = "O envio está temporariamente indisponível. Tente novamente mais tarde.";
    }
  } else {
    status.textContent = "Não foi possível carregar o serviço de mensagens. Tente novamente mais tarde.";
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!emailServiceReady) return;

    const name = document.getElementById("nome").value;
    const email = document.getElementById("email").value;
    const submitButton = form.querySelector('button[type="submit"]');

    submitButton.disabled = true;
    status.textContent = "Enviando mensagem...";

    window.emailjs.send("service_6vp4bi1", "template_4026jfk", {
      nome: name,
      email,
      mensagem: message.value
    }).then(() => {
      status.textContent = `Mensagem enviada com sucesso, ${name}!`;
      form.reset();
    }).catch((error) => {
      console.error("Falha ao enviar mensagem:", error);
      status.textContent = "Não foi possível enviar a mensagem. Tente novamente.";
    }).finally(() => {
      submitButton.disabled = false;
    });
  }, { signal });
}

function initializeFormsPage() {
  activeFormsController?.abort();
  activeFormsController = new AbortController();
  initializeCheckoutSummary();
  initializeCheckoutPage(activeFormsController.signal);
  initializeContactForm(activeFormsController.signal);
}

function initializeCurrentPage() {
  const visit = ++pageVisit;
  const needsMap = Boolean(document.querySelector("#mapa"));
  const needsCatalog = Boolean(document.querySelector(".catalog-section"));
  const needsEmail = Boolean(document.querySelector("#msg"));
  const pending = [];

  const pageTitle = document.querySelector("#swup")?.dataset.pageTitle;
  if (pageTitle) document.title = pageTitle;

  if (needsMap && !window.L) {
    pending.push(loadStyle(
      "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    ));
    pending.push(loadScript(
      "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
      () => Boolean(window.L)
    ));
  }
  if (needsCatalog && !window.List) {
    pending.push(loadScript(
      "https://cdnjs.cloudflare.com/ajax/libs/list.js/2.3.1/list.min.js",
      () => Boolean(window.List)
    ));
  }
  if (needsCatalog && !window.gsap) {
    pending.push(loadScript(
      "https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js",
      () => Boolean(window.gsap)
    ));
  }
  if (needsEmail && !window.emailjs) {
    pending.push(loadScript(
      "https://cdn.jsdelivr.net/npm/@emailjs/browser@5/dist/email.min.js",
      () => Boolean(window.emailjs)
    ));
  }

  window.initializeSitePage();
  if (!needsCatalog || window.List) {
    window.initializeProductsPage();
  } else {
    const status = document.getElementById("catalog-results");
    if (status) status.textContent = "Carregando os controles do catálogo...";
  }
  initializeFormsPage();

  if (pending.length > 0) {
    Promise.allSettled(pending).then((results) => {
      let resourceLoaded = false;
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          resourceLoaded = true;
        } else {
          console.error("Não foi possível preparar um recurso desta página:", result.reason);
        }
      });

      if (resourceLoaded && visit === pageVisit) initializeCurrentPage();
    });
  }
}

function initializeSwup() {
  if (!window.Swup || window.siteSwup) return;

  window.siteSwup = new window.Swup();
  window.siteSwup.hooks.on("page:view", initializeCurrentPage);
  window.siteSwup.hooks.on("animation:out:start", () => {
    document.querySelector(".page-veil")?.classList.add("is-active");
  });
  const revealPage = () => document.querySelector(".page-veil")?.classList.remove("is-active");
  window.siteSwup.hooks.on("animation:in:end", revealPage);
  window.siteSwup.hooks.on("animation:skip", revealPage);
  window.siteSwup.hooks.on("visit:abort", revealPage);
}

initializeCurrentPage();
if (location.protocol === "file:") {
  console.info("As transições do Swup precisam que o site seja aberto por HTTP; os links continuam funcionando normalmente.");
} else {
  loadScript("https://unpkg.com/swup@4", () => Boolean(window.Swup))
    .then(initializeSwup)
    .catch((error) => {
      console.error("O Swup não carregou; a navegação continuará com recarregamento normal.", error);
    });
}
