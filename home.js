let cleanupSitePage;


window.initializeSitePage = function initializeSitePage() {
  cleanupSitePage?.();
  const controller = new AbortController();
  const signal = controller.signal;
  let revealObserver = null;
  let map = null;

const header = document.querySelector(".site-header");
const progress = document.querySelector(".scroll-progress");
const menuToggle = document.querySelector(".menu-toggle");
const menuToggleLabel = document.querySelector(".menu-toggle-label");
const navLinks = document.querySelector(".nav-links");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pathStory = document.querySelector("[data-path-story]");
const pathStoryStage = pathStory?.querySelector(".path-story-stage");
const pathStoryWindow = pathStory?.querySelector(".path-story-window");
const pathStoryTrack = pathStory?.querySelector(".path-story-track");
const pathStoryCards = pathStory?.querySelectorAll(".path-story-card");
const pathStoryProgress = pathStory?.querySelector("[data-path-progress]");
const pathStoryCount = pathStory?.querySelector("[data-path-count]");
let pathStoryDistance = 0;

function refreshPathStory() {
  if (!pathStory || !pathStoryStage || !pathStoryWindow || !pathStoryTrack) return;

  const isStatic = reduceMotion || window.matchMedia("(max-width: 850px)").matches;
  pathStory.classList.toggle("is-static", isStatic);

  if (isStatic) {
    pathStory.style.height = "";
    pathStoryTrack.style.transform = "";
    pathStoryDistance = 0;
    pathStoryCards?.forEach((card) => card.classList.add("is-active"));
    return;
  }

  pathStory.style.height = "";
  pathStoryTrack.style.transform = "";
  pathStoryDistance = Math.max(0, pathStoryTrack.scrollWidth - pathStoryWindow.clientWidth);
  pathStory.style.height = `${pathStoryStage.offsetHeight + pathStoryDistance}px`;
  updatePathStory();
}

function updatePathStory() {
  if (!pathStory || !pathStoryStage || !pathStoryWindow || !pathStoryTrack || pathStory.classList.contains("is-static")) return;

  const stickyTop = parseFloat(getComputedStyle(pathStoryStage).top) || 0;
  const sectionTop = pathStory.getBoundingClientRect().top;
  const progressValue = pathStoryDistance > 0
    ? Math.max(0, Math.min(1, (stickyTop - sectionTop) / pathStoryDistance))
    : 0;

  pathStoryTrack.style.transform = `translate3d(${-pathStoryDistance * progressValue}px, 0, 0)`;
  if (pathStoryProgress) pathStoryProgress.style.width = `${progressValue * 100}%`;

  const windowBounds = pathStoryWindow.getBoundingClientRect();
  const windowCenter = windowBounds.left + windowBounds.width / 2;
  let closestCardIndex = 0;
  let closestDistance = Infinity;

  pathStoryCards?.forEach((card, index) => {
    const bounds = card.getBoundingClientRect();
    const center = bounds.left + bounds.width / 2;
    const distanceFromCenter = Math.abs(center - windowCenter);
    const visible = center > windowBounds.left + bounds.width * 0.2
      && center < windowBounds.right - bounds.width * 0.2;

    card.classList.toggle("is-active", visible);
    card.querySelector("img")?.style.setProperty(
      "--path-image-y",
      `${Math.max(-15, Math.min(15, (center - windowCenter) * -0.035))}px`
    );

    if (distanceFromCenter < closestDistance) {
      closestDistance = distanceFromCenter;
      closestCardIndex = index;
    }
  });

  if (pathStoryCount) {
    pathStoryCount.textContent = String(closestCardIndex + 1).padStart(2, "0");
  }
}

function updateScrollEffects() {
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progressValue = scrollableHeight > 0 ? (window.scrollY / scrollableHeight) * 100 : 0;

  if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);
  if (progress) progress.style.width = `${progressValue}%`;

  if (!reduceMotion) {
    document.querySelectorAll("[data-parallax]").forEach((image) => {
      const bounds = image.parentElement.getBoundingClientRect();
      const offset = Math.max(-28, Math.min(28, (bounds.top + bounds.height / 2 - window.innerHeight / 2) * -0.045));
      image.style.setProperty("--parallax-y", `${offset}px`);
    });
  }

  updatePathStory();

}

let scrollFrame = 0;
window.addEventListener("scroll", () => {
  if (scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(() => {
    updateScrollEffects();
    scrollFrame = 0;
  });
}, { passive: true, signal });

window.addEventListener("resize", () => {
  refreshPathStory();
  updateScrollEffects();
}, { signal });
pathStoryTrack?.querySelectorAll("img").forEach((image) => {
  image.addEventListener("load", refreshPathStory, { once: true, signal });
});
refreshPathStory();
updateScrollEffects();

if (menuToggle && navLinks) {
  function closeMenu() {
    menuToggle.classList.remove("is-open");
    if (menuToggleLabel) menuToggleLabel.textContent = "Abrir menu";
    navLinks.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  }

  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.contains("is-open");
    menuToggle.classList.toggle("is-open", !isOpen);
    if (menuToggleLabel) menuToggleLabel.textContent = isOpen ? "Abrir menu" : "Fechar menu";
    navLinks.classList.toggle("is-open", !isOpen);
    document.body.classList.toggle("menu-open", !isOpen);
  }, { signal });

  navLinks.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu, { signal }));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  }, { signal });
}

const cartToggle = document.querySelector("#lilcar");
const cartPanel = document.querySelector("#lilcarx");

if (cartToggle && cartPanel) {
  const cartCloseButtons = cartPanel.querySelectorAll("[data-cart-close]");
  const cartCloseButton = cartPanel.querySelector(".cart-close");

  function setCartOpen(isOpen) {
    cartPanel.classList.toggle("active", isOpen);
    document.body.classList.toggle("cart-open", isOpen);

    if (isOpen) {
      cartCloseButton.focus();
    } else {
      cartToggle.focus();
    }
  }

  cartToggle.addEventListener("click", (event) => {
    event.preventDefault();
    if (menuToggle && navLinks && navLinks.classList.contains("is-open")) {
      menuToggle.classList.remove("is-open");
      if (menuToggleLabel) menuToggleLabel.textContent = "Abrir menu";
      navLinks.classList.remove("is-open");
      document.body.classList.remove("menu-open");
    }
    setCartOpen(!cartPanel.classList.contains("active"));
  }, { signal });

  cartCloseButtons.forEach((button) => {
    button.addEventListener("click", () => setCartOpen(false), { signal });
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && cartPanel.classList.contains("active")) {
      setCartOpen(false);
    }
  }, { signal });
}

document.querySelectorAll("[data-scroll]").forEach((button) => {
  button.addEventListener("click", () => {
    const track = document.querySelector(button.dataset.scrollTarget || ".gallery-track");
    if (!track) return;

    const direction = button.dataset.scroll === "next" ? 1 : -1;
    const slide = track.querySelector(".gallery-slide, .shoe-line-card");
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const distance = slide ? slide.getBoundingClientRect().width + gap : track.clientWidth;
    track.scrollBy({ left: distance * direction, behavior: reduceMotion ? "auto" : "smooth" });
  }, { signal });
});

document.querySelectorAll(".products-content .card, .contact-title").forEach((element) => {
  element.setAttribute("data-reveal", "");
});

const revealElements = document.querySelectorAll("[data-reveal]");

if (reduceMotion || !("IntersectionObserver" in window)) {
  revealElements.forEach((element) => element.classList.add("is-visible"));
} else {
  revealElements.forEach((element) => {
    if (element.dataset.revealDelay) {
      element.style.setProperty("--reveal-delay", `${element.dataset.revealDelay}ms`);
    }
  });

  revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  revealElements.forEach((element) => revealObserver.observe(element));
}

if (window.L && document.querySelector("#mapa")) {
  const coordinates = [-22.3708, -46.9422];
  map = window.L.map("mapa", { scrollWheelZoom: false }).setView(coordinates, 14);

  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  window.L.marker(coordinates).addTo(map)
    .bindPopup("<b>Estamos aqui!</b><br>Fatal Tenis")
    .openPopup();
}

cleanupSitePage = () => {
  controller.abort();
  document.body.classList.remove("menu-open", "cart-open");
  revealObserver?.disconnect();
  map?.remove();
};
};
