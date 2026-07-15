const topbar = document.querySelector(".topbar");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

window.addEventListener("scroll", () => {
  topbar.classList.toggle("scrolled", window.scrollY > 40);
});

menuToggle.addEventListener("click", () => {
  const active = navLinks.classList.toggle("active");
  menuToggle.setAttribute("aria-expanded", String(active));
});

document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("active");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

const eventDate = new Date("2027-05-02T08:00:00-03:00");

function updateCountdown() {
  const diff = eventDate - new Date();
  if (diff <= 0) {
    document.getElementById("countdown").innerHTML = "<strong>A PROVA COMEÇOU!</strong>";
    return;
  }

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff / 3600000) % 24);
  const minutes = Math.floor((diff / 60000) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  document.getElementById("days").textContent = String(days).padStart(3, "0");
  document.getElementById("hours").textContent = String(hours).padStart(2, "0");
  document.getElementById("minutes").textContent = String(minutes).padStart(2, "0");
  document.getElementById("seconds").textContent = String(seconds).padStart(2, "0");
}

updateCountdown();
setInterval(updateCountdown, 1000);
document.getElementById("currentYear").textContent = new Date().getFullYear();

const modal = document.getElementById("articleModal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");

document.querySelectorAll(".text-link").forEach(button => {
  button.addEventListener("click", () => {
    modalTitle.textContent = button.dataset.modalTitle;
    modalText.textContent = button.dataset.modalText;
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
  });
});

function closeModal() {
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
}

document.getElementById("closeModal").addEventListener("click", closeModal);
modal.addEventListener("click", event => {
  if (event.target === modal) closeModal();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeModal();
});

const paymentRadios = document.querySelectorAll('input[name="pagamento"]');
const pixPanel = document.getElementById("pixPanel");
const cardPanel = document.getElementById("cardPanel");
const receipt = document.getElementById("receipt");
const fileName = document.getElementById("fileName");
const form = document.getElementById("registrationForm");
const formStatus = document.getElementById("formStatus");

paymentRadios.forEach(radio => {
  radio.addEventListener("change", () => {
    const isPix = radio.value === "pix" && radio.checked;
    pixPanel.classList.toggle("hidden", !isPix);
    cardPanel.classList.toggle("hidden", isPix);
  });
});

receipt.addEventListener("change", () => {
  fileName.textContent = receipt.files[0]?.name || "Selecionar JPG, PNG ou PDF";
});

document.getElementById("copyPix").addEventListener("click", async () => {
  const key = document.getElementById("pixKey").textContent.trim();
  try {
    await navigator.clipboard.writeText(key);
    document.getElementById("copyPix").textContent = "Copiado!";
    setTimeout(() => document.getElementById("copyPix").textContent = "Copiar chave", 1500);
  } catch {
    alert("Selecione e copie a chave Pix manualmente.");
  }
});

document.getElementById("cpf").addEventListener("input", event => {
  let value = event.target.value.replace(/\D/g, "").slice(0, 11);
  value = value.replace(/(\d{3})(\d)/, "$1.$2");
  value = value.replace(/(\d{3})(\d)/, "$1.$2");
  value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  event.target.value = value;
});

document.getElementById("telefone").addEventListener("input", event => {
  let value = event.target.value.replace(/\D/g, "").slice(0, 11);
  value = value.replace(/^(\d{2})(\d)/, "($1) $2");
  value = value.replace(/(\d{5})(\d{4})$/, "$1-$2");
  event.target.value = value;
});

form.addEventListener("submit", event => {
  event.preventDefault();
  formStatus.className = "form-status";
  formStatus.textContent = "";

  const formData = new FormData(form);
  const payment = formData.get("pagamento");

  if (payment === "pix" && !receipt.files.length) {
    formStatus.classList.add("error");
    formStatus.textContent = "Envie o comprovante do Pix para continuar.";
    return;
  }

  const registrationCode = "XCM27-" + String(Date.now()).slice(-6);
  const record = {
    codigo: registrationCode,
    nome: formData.get("nome"),
    categoria: formData.get("categoria"),
    pagamento: payment,
    status: "Pendente"
  };

  const saved = JSON.parse(localStorage.getItem("xcmInscricoesDemo") || "[]");
  saved.push(record);
  localStorage.setItem("xcmInscricoesDemo", JSON.stringify(saved));

  if (payment === "cartao") {
    const whatsappNumber = "5584000000000";
    const message = encodeURIComponent(
      `Olá! Realizei minha inscrição no XCM Nísia Floresta 2027.\n` +
      `Nome: ${formData.get("nome")}\n` +
      `Categoria: ${formData.get("categoria")}\n` +
      `Código: ${registrationCode}\n` +
      `Gostaria de receber o link para pagamento no cartão.`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
  }

  formStatus.classList.add("success");
  formStatus.textContent = `Inscrição recebida! Código: ${registrationCode}. Status: aguardando confirmação.`;

  form.reset();
  pixPanel.classList.remove("hidden");
  cardPanel.classList.add("hidden");
  fileName.textContent = "Selecionar JPG, PNG ou PDF";
});
