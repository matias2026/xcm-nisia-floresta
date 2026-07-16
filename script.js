const SUPABASE_URL = "https://gzrrevldyugacfdkqndh.supabase.co";
const SUPABASE_KEY = "sb_publishable_zmTWWNEPcf2vy-oK4B9Xbg_LlL_B49w";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);const topbar = document.querySelector(".topbar");
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

form.addEventListener("submit", async event => {
  event.preventDefault();

  formStatus.className = "form-status";
  formStatus.textContent = "Enviando inscrição...";

  const submitButton = form.querySelector('button[type="submit"]');

  if (submitButton) {
    submitButton.disabled = true;
  }

  try {
    const formData = new FormData(form);
    const payment = formData.get("pagamento");


    const registrationCode =
      "XCM27-" + String(Date.now()).slice(-6);
      let caminhoComprovante = null;

if (receipt.files.length) {
  const arquivo = receipt.files[0];
  const extensao = arquivo.name.split(".").pop().toLowerCase();
  const nomeArquivo = `${registrationCode}-${Date.now()}.${extensao}`;

  const { error: uploadError } = await supabaseClient.storage
    .from("Comprovante")
    .upload(nomeArquivo, arquivo, {
      contentType: arquivo.type,
      upsert: false
    });

  if (uploadError) {
    console.error("Erro no upload:", uploadError);
    throw new Error(`Erro ao enviar comprovante: ${uploadError.message}`);
  }

  caminhoComprovante = nomeArquivo;
}

    const novaInscricao = {
      codigo_inscricao: registrationCode,
      nome: formData.get("nome"),
      cpf: formData.get("cpf"),
      nascimento: formData.get("nascimento") || null,
      telefone: formData.get("telefone"),
      email: formData.get("email") || null,
      cidade: formData.get("cidade"),
      equipe: formData.get("equipe") || "Sem equipe",
      categoria: formData.get("categoria"),
      instagram: formData.get("instagram") || null,
      pagamento: payment,
      comprovante: caminhoComprovante,
      licenca_cbc: formData.get("licenca_cbc") || null,
      status: "pendente"
    };

    const { error } = await supabaseClient
      .from("inscricoes")
      .insert([novaInscricao]);

    if (error) {
      console.error("Erro do Supabase:", error);
      throw new Error("Não foi possível salvar a inscrição.");
    }

    if (payment === "cartao") {
      const whatsappNumber = "5584000000000";

      const message = encodeURIComponent(
        `Olá! Realizei minha inscrição no XCM Nísia Floresta 2027.\n` +
        `Nome: ${novaInscricao.nome}\n` +
        `Categoria: ${novaInscricao.categoria}\n` +
        `Código: ${registrationCode}\n` +
        `Gostaria de receber o link para pagamento no cartão.`
      );

      window.open(
        `https://wa.me/${whatsappNumber}?text=${message}`,
        "_blank"
      );
    }

    formStatus.classList.add("success");
    formStatus.textContent =
      `Inscrição salva! Código: ${registrationCode}. ` +
      `Status: aguardando confirmação.`;

    form.reset();
    pixPanel.classList.remove("hidden");
    cardPanel.classList.add("hidden");
    fileName.textContent = "Selecionar JPG, PNG ou PDF";

  } catch (error) {
    console.error("Erro na inscrição:", error);

    formStatus.classList.add("error");
    formStatus.textContent =
      error.message || "Não foi possível enviar a inscrição.";
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
});
