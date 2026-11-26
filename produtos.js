const productGrid = document.querySelector("#product-grid");
const searchInput = document.querySelector("#product-search");
const filterButtons = document.querySelectorAll("[data-filter]");
const resultCount = document.querySelector("#catalog-results");
const emptyCatalogMessage = document.querySelector("#catalog-empty");
const productCards = Array.from(document.querySelectorAll(".product-card"));
const cartItemsList = document.querySelector("#lilcars");
const cartQuantity = document.querySelector("#quan");
const cartCount = document.querySelector("#cart-count");
const cartEmptyMessage = document.querySelector("#cart-empty");
const cartStatus = document.querySelector("#cart-status");
const contactLink = document.querySelector("#end");
const cartStorageKey = "fatal-tenis-cart";
let activeFilter = "todos";
let cartItems = [];

try {
  const savedCart = window.localStorage.getItem(cartStorageKey);
  if (savedCart) {
    const parsedCart = JSON.parse(savedCart);
    if (!Array.isArray(parsedCart) || !parsedCart.every((item) => typeof item === "string")) {
      throw new TypeError("Formato de sacola salvo inválido.");
    }
    cartItems = parsedCart;
  }
} catch (error) {
  console.error("Não foi possível recuperar a sacola salva:", error);
  cartStatus.textContent = "Não foi possível recuperar a sacola salva neste navegador.";
}

function filterProducts() {
  const searchTerm = searchInput.value.trim().toLocaleLowerCase("pt-BR");
  let visibleCount = 0;

  productCards.forEach((card) => {
    const matchesCategory = activeFilter === "todos" || card.dataset.category === activeFilter;
    const matchesSearch = card.dataset.name.toLocaleLowerCase("pt-BR").includes(searchTerm);
    const isVisible = matchesCategory && matchesSearch;
    card.hidden = !isVisible;
    if (isVisible) visibleCount += 1;
  });

  resultCount.textContent = `${visibleCount} ${visibleCount === 1 ? "modelo encontrado" : "modelos encontrados"}`;
  emptyCatalogMessage.hidden = visibleCount > 0;
}

function getCartCounts() {
  return cartItems.reduce((counts, name) => {
    counts.set(name, (counts.get(name) || 0) + 1);
    return counts;
  }, new Map());
}

function renderCart() {
  const itemCount = cartItems.length;
  const counts = getCartCounts();
  cartQuantity.textContent = String(itemCount);
  cartCount.textContent = String(itemCount);
  cartEmptyMessage.hidden = itemCount > 0;
  cartItemsList.replaceChildren();

  counts.forEach((quantity, name) => {
    const item = document.createElement("li");
    item.className = "cart-item";

    const label = document.createElement("span");
    label.className = "cart-item-name";
    label.textContent = name;

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
      const itemIndex = cartItems.indexOf(name);
      if (itemIndex === -1) return;
      cartItems.splice(itemIndex, 1);
      saveCart();
      renderCart();
      cartStatus.textContent = `${name} removido da sacola.`;
    });

    controls.append(quantityLabel, removeButton);
    item.append(label, controls);
    cartItemsList.append(item);
  });

  contactLink.href = itemCount
    ? `contato.html?itens=${encodeURIComponent(Array.from(counts.keys()).join(", "))}`
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
  });
});

searchInput.addEventListener("input", filterProducts);

productGrid.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add-to-cart]");
  if (!addButton) return;

  const productName = addButton.dataset.productName;
  if (!productName) {
    console.error("Produto sem nome não pode ser adicionado à sacola.");
    cartStatus.textContent = "Não foi possível adicionar este produto.";
    return;
  }

  cartItems.push(productName);
  const wasSaved = saveCart();
  renderCart();
  cartStatus.textContent = wasSaved
    ? `${productName} adicionado à sacola.`
    : `${productName} adicionado, mas não foi possível salvar a sacola neste navegador.`;
});

filterProducts();
renderCart();
