let cleanupProductsPage;

window.initializeProductsPage = function initializeProductsPage() {
  cleanupProductsPage?.();
  if (!document.querySelector(".catalog-section")) return;

  const controller = new AbortController();
  const signal = controller.signal;
  let priceObserver = null;

const catalogSection = document.querySelector(".catalog-section");
const promotionSection = document.querySelector("#promocoes");
const searchInput = document.querySelector("#product-search");
const filterButtons = document.querySelectorAll("[data-filter]");
const resultCount = document.querySelector("#catalog-results");
const emptyCatalogMessage = document.querySelector("#catalog-empty");
const cartItemsList = document.querySelector("#lilcars");
const cartQuantity = document.querySelector("#quan");
const cartCount = document.querySelector("#cart-count");
const cartEmptyMessage = document.querySelector("#cart-empty");
const cartStatus = document.querySelector("#cart-status");
const contactLink = document.querySelector("#end");
const cartStorageKey = "fatal-tenis-cart";
const cartTotal = document.querySelector("#cart-total");
const priceFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const productSizes = Array.from({ length: 10 }, (_, index) => index + 35);
const unavailableSizes = new Set([36, 40]);
let activeFilter = "todos";
let cartItems = [];

function parsePrice(value) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const price = Number(normalized);
  if (!Number.isFinite(price)) {
    throw new TypeError(`Preço inválido: ${value}`);
  }
  return price;
}

function getProductPrice(card) {
  const amount = card.querySelector(".price-current strong, .product-price strong");
  if (!amount) {
    throw new Error("Produto sem preço não pode ser adicionado à sacola.");
  }
  return parsePrice(amount.textContent.trim());
}

function normalizeCartItem(item, productPrices) {
  if (typeof item === "string") {
    const unitPrice = productPrices.get(item);
    if (unitPrice === undefined) {
      throw new TypeError(`Não foi possível recuperar o preço de ${item}.`);
    }
    return { name: item, unitPrice, size: null };
  }

  if (
    !item
    || typeof item.name !== "string"
    || typeof item.unitPrice !== "number"
    || !Number.isFinite(item.unitPrice)
    || item.unitPrice < 0
  ) {
    throw new TypeError("Formato de item salvo inválido.");
  }

  const size = item.size ?? null;
  if (size !== null && (!productSizes.includes(size) || unavailableSizes.has(size))) {
    throw new TypeError("Numeração salva indisponível.");
  }

  return { name: item.name, unitPrice: item.unitPrice, size };
}

function addSizeSelector(card) {
  const name = card.querySelector(".card-title")?.textContent.trim();
  const body = card.querySelector(".card-body");
  const addButton = card.querySelector("[data-add-to-cart]");
  if (!name || !body || !addButton || card.querySelector("[data-product-size]")) return;

  const label = document.createElement("label");
  label.className = "product-size";

  const labelText = document.createElement("span");
  labelText.textContent = "Numeração";

  const select = document.createElement("select");
  select.dataset.productSize = "";
  select.setAttribute("aria-label", `Numeração para ${name}`);

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Selecione";
  placeholder.disabled = true;
  placeholder.selected = true;
  select.append(placeholder);

  productSizes.forEach((size) => {
    const option = document.createElement("option");
    option.value = String(size);
    option.textContent = unavailableSizes.has(size) ? `${size} — esgotado` : String(size);
    option.disabled = unavailableSizes.has(size);
    select.append(option);
  });

  label.append(labelText, select);
  body.insertBefore(label, addButton);
}

function animatePrice(priceElement) {
  if (priceElement.dataset.animated === "true") return;
  priceElement.dataset.animated = "true";

  const amount = priceElement.querySelector(".price-current strong") || priceElement.querySelector("strong");
  if (!amount) return;

  const finalPrice = parsePrice(amount.textContent.trim());
  const wasPrice = priceElement.querySelector(".price-was");
  if (wasPrice) {
    const oldAmount = wasPrice.querySelector("del");
    const discount = priceElement.querySelector(".price-discount");
    if (!oldAmount || !discount) {
      throw new Error("Uma promoção precisa informar o preço anterior e o desconto.");
    }

    const oldPrice = parsePrice(oldAmount.textContent.trim());
    if (oldPrice <= finalPrice) {
      throw new RangeError("O preço anterior da promoção deve ser maior que o preço atual.");
    }
    discount.textContent = `${Math.round((1 - finalPrice / oldPrice) * 100)}% OFF`;
    priceElement.classList.add("is-animated");
  }

  if (!window.gsap || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const counter = { value: 0 };
  const timeline = window.gsap.timeline();

  if (wasPrice) {
    timeline
      .fromTo(wasPrice, { opacity: 0, y: 5 }, { opacity: 1, y: 0, duration: 0.28, ease: "power1.out" })
      .fromTo(wasPrice.querySelector(".price-strike"), { scaleX: 0 }, {
        scaleX: 1,
        duration: 0.42,
        ease: "power2.out",
        transformOrigin: "left center"
      }, "-=0.05");
  }

  timeline
    .to(counter, {
      value: finalPrice,
      duration: wasPrice ? 0.95 : 0.75,
      ease: "power2.out",
      onUpdate: () => {
        amount.textContent = priceFormatter.format(counter.value);
      }
    }, wasPrice ? "-=0.08" : 0)
    .fromTo(amount, { y: 5, scale: 0.96 }, {
      y: 0,
      scale: 1,
      duration: 0.38,
      ease: "back.out(1.7)"
    }, "<");
}

function observePrices() {
  const prices = document.querySelectorAll(".product-price");
  if (!("IntersectionObserver" in window)) {
    prices.forEach(animatePrice);
    return;
  }

  priceObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animatePrice(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.7 });

  prices.forEach((price) => priceObserver.observe(price));
}

const listOptions = {
  valueNames: [
    { data: ["name", "category"] },
    "product-type",
    "card-title",
    "card-text"
  ]
};
document.querySelectorAll(".product-card").forEach(addSizeSelector);
const productList = new window.List("product-catalog", listOptions);
const promotionList = document.querySelector("#promotion-grid .product-card")
  ? new window.List("promocoes", listOptions)
  : null;
const catalogLists = promotionList ? [productList, promotionList] : [productList];
const productPrices = new Map();
document.querySelectorAll(".product-card").forEach((card) => {
  const name = card.querySelector(".card-title")?.textContent.trim();
  if (name) productPrices.set(name, getProductPrice(card));
});

try {
  const savedCart = window.localStorage.getItem(cartStorageKey);
  if (savedCart) {
    const parsedCart = JSON.parse(savedCart);
    if (!Array.isArray(parsedCart)) {
      throw new TypeError("Formato de sacola salvo inválido.");
    }
    cartItems = parsedCart.map((item) => normalizeCartItem(item, productPrices));
    if (parsedCart.some((item) => typeof item === "string" || item.size === undefined)) saveCart();
  }
} catch (error) {
  console.error("Não foi possível recuperar a sacola salva:", error);
  cartStatus.textContent = "Não foi possível recuperar a sacola salva neste navegador.";
}

function filterProducts() {
  const searchTerm = searchInput.value.trim();

  catalogLists.forEach((list) => {
    list.search(searchTerm);
    list.filter((item) => activeFilter === "todos" || item.values().category === activeFilter);
  });

  const visibleCount = catalogLists.reduce((count, list) => count + list.matchingItems.length, 0);
  if (promotionList) {
    promotionSection.hidden = promotionList.matchingItems.length === 0;
  }

  resultCount.textContent = `${visibleCount} ${visibleCount === 1 ? "modelo encontrado" : "modelos encontrados"}`;
  emptyCatalogMessage.hidden = visibleCount > 0;
}

function getCartCounts() {
  return cartItems.reduce((counts, item) => {
    const key = `${item.name}\u0000${item.unitPrice}\u0000${item.size ?? ""}`;
    const group = counts.get(key) || { ...item, quantity: 0 };
    group.quantity += 1;
    counts.set(key, group);
    return counts;
  }, new Map());
}

function renderCart() {
  const itemCount = cartItems.length;
  const counts = getCartCounts();
  const total = Math.round(cartItems.reduce((sum, item) => sum + item.unitPrice, 0) * 100) / 100;
  cartQuantity.textContent = String(itemCount);
  cartCount.textContent = String(itemCount);
  cartTotal.textContent = priceFormatter.format(total);
  cartEmptyMessage.hidden = itemCount > 0;
  cartItemsList.replaceChildren();

  counts.forEach(({ name, unitPrice, size, quantity }) => {
    const item = document.createElement("li");
    item.className = "cart-item";

    const label = document.createElement("span");
    label.className = "cart-item-name";
    const sizeLabel = size === null ? "Numeração a confirmar" : `nº ${size}`;
    label.textContent = `${name} · ${sizeLabel} — R$ ${priceFormatter.format(unitPrice)}`;

    const controls = document.createElement("div");
    controls.className = "cart-item-controls";

    const quantityLabel = document.createElement("span");
    quantityLabel.textContent = `× ${quantity}`;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "cart-remove";
    removeButton.textContent = "Remover";
    removeButton.setAttribute("aria-label", `Remover uma unidade de ${name}`);
    removeButton.addEventListener("click", () => {
      const itemIndex = cartItems.findIndex((cartItem) => (
        cartItem.name === name && cartItem.unitPrice === unitPrice && cartItem.size === size
      ));
      if (itemIndex === -1) return;
      cartItems.splice(itemIndex, 1);
      saveCart();
      renderCart();
      cartStatus.textContent = `${name} removido da sacola.`;
    }, { signal });

    controls.append(quantityLabel, removeButton);
    item.append(label, controls);
    cartItemsList.append(item);
  });

  contactLink.href = itemCount
    ? `contato.html?itens=${encodeURIComponent(Array.from(new Set(cartItems.map((item) => item.name))).join(", "))}`
    : "contato.html";
  contactLink.textContent = itemCount ? "Perguntar sobre os modelos" : "Falar com a Fatal";
  const arrow = document.createElement("span");
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "↗";
  contactLink.append(arrow);
}

function saveCart() {
  try {
    window.localStorage.setItem(cartStorageKey, JSON.stringify(cartItems));
    return true;
  } catch (error) {
    console.error("Não foi possível salvar a sacola:", error);
    return false;
  }
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((filterButton) => {
      const isActive = filterButton === button;
      filterButton.classList.toggle("is-active", isActive);
      filterButton.setAttribute("aria-pressed", String(isActive));
    });
    filterProducts();
  }, { signal });
});

searchInput.addEventListener("input", filterProducts, { signal });

catalogSection.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add-to-cart]");
  if (!addButton) return;

  const productCard = addButton.closest(".product-card");
  const productName = productCard?.querySelector(".card-title")?.textContent.trim();
  if (!productCard || !productName) {
    console.error("Produto sem nome não pode ser adicionado à sacola.");
    cartStatus.textContent = "Não foi possível adicionar este produto.";
    return;
  }

  const sizeSelect = productCard.querySelector("[data-product-size]");
  const size = Number(sizeSelect?.value);
  if (!sizeSelect || !productSizes.includes(size) || unavailableSizes.has(size)) {
    cartStatus.textContent = "Selecione uma numeração disponível.";
    sizeSelect?.focus();
    return;
  }

  let unitPrice;
  try {
    unitPrice = getProductPrice(productCard);
  } catch (error) {
    console.error("Não foi possível adicionar o produto:", error);
    cartStatus.textContent = "Este produto não tem um preço válido.";
    return;
  }

  cartItems.push({ name: productName, unitPrice, size });
  const wasSaved = saveCart();
  renderCart();
  cartStatus.textContent = wasSaved
    ? `${productName} adicionado à sacola.`
    : `${productName} adicionado, mas não foi possível salvar a sacola neste navegador.`;
}, { signal });

filterProducts();
renderCart();
observePrices();

  cleanupProductsPage = () => {
    controller.abort();
    priceObserver?.disconnect();
  };
};
