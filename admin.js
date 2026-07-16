const SUPABASE_URL = "https://gzrrevldyugacfdkqndh.supabase.co";
const SUPABASE_KEY = "sb_publishable_zmTWWNEPcf2vy-oK4B9Xbg_LlL_B49w";

const supabaseAdmin = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const loginArea = document.getElementById("loginArea");
const adminArea = document.getElementById("adminArea");
const tabelaBody = document.querySelector("#tabela tbody");

let inscricoes = [];

async function verificarSessao() {
  const {
    data: { session }
  } = await supabaseAdmin.auth.getSession();

  if (session) {
    mostrarPainel();
    await carregarInscricoes();
  }
}

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Digite o e-mail e a senha.");
    return;
  }

  const { error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error(error);
    alert("E-mail ou senha incorretos.");
    return;
  }

  mostrarPainel();
  await carregarInscricoes();
}

function mostrarPainel() {
  loginArea.style.display = "none";
  adminArea.style.display = "block";
}

async function carregarInscricoes() {
  tabelaBody.innerHTML =
    '<tr><td colspan="5">Carregando inscrições...</td></tr>';

  const { data, error } = await supabaseAdmin
    .from("inscricoes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    tabelaBody.innerHTML =
      '<tr><td colspan="5">Erro ao carregar inscrições.</td></tr>';
    return;
  }

  inscricoes = data || [];
  renderizarTabela();
}

function renderizarTabela() {
  tabelaBody.innerHTML = "";

  if (!inscricoes.length) {
    tabelaBody.innerHTML =
      '<tr><td colspan="5">Nenhuma inscrição encontrada.</td></tr>';
    return;
  }

  inscricoes.forEach(inscricao => {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td>${escaparHTML(inscricao.codigo_inscricao || "")}</td>
      <td>${escaparHTML(inscricao.nome || "")}</td>
      <td>${escaparHTML(inscricao.cpf || "")}</td>
      <td>${escaparHTML(inscricao.categoria || "")}</td>
      <td>
  <div class="status-actions">
    <span class="status-badge status-${inscricao.status || "pendente"}">
      ${escaparHTML(inscricao.status || "pendente")}
    </span>

    <select
      class="status-select"
      onchange="alterarStatus(${inscricao.id}, this.value)"
    >
      <option value="">Alterar</option>
      <option value="pendente">Pendente</option>
      <option value="pago">Pago</option>
      <option value="cancelado">Cancelado</option>
      <option value="cortesia">Cortesia</option>
    </select>
  </div>
</td>
    `;

    tabelaBody.appendChild(linha);
  });
}

function exportarCSV() {
  if (!inscricoes.length) {
    alert("Não existem inscrições para exportar.");
    return;
  }

  const dadosExcel = inscricoes.map(inscricao => ({
    "Código": inscricao.codigo_inscricao || "",
    "Nome": inscricao.nome || "",
    "CPF": inscricao.cpf || "",
    "Nascimento": inscricao.nascimento || "",
    "Telefone": inscricao.telefone || "",
    "E-mail": inscricao.email || "",
    "Cidade": inscricao.cidade || "",
    "Equipe": inscricao.equipe || "",
    "Categoria": inscricao.categoria || "",
    "Instagram": inscricao.instagram || "",
    "Licença CBC": inscricao.licenca_cbc || "",
    "Pagamento": inscricao.pagamento || "",
    "Status": inscricao.status || "",
    "Data da inscrição": formatarData(inscricao.created_at)
  }));

  const planilha = XLSX.utils.json_to_sheet(dadosExcel);
  const arquivo = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    arquivo,
    planilha,
    "Inscritos"
  );

  XLSX.writeFile(
    arquivo,
    `inscritos-xcm-${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}

function formatarData(data) {
  if (!data) return "";

  return new Date(data).toLocaleString("pt-BR");
}

function escaparHTML(valor) {
  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}async function alterarStatus(id, novoStatus) {
  if (!novoStatus) return;

  const confirmar = window.confirm(
    `Deseja alterar o status para "${novoStatus}"?`
  );

  if (!confirmar) {
    await carregarInscricoes();
    return;
  }

  const { error } = await supabaseAdmin
    .from("inscricoes")
    .update({ status: novoStatus })
    .eq("id", id);

  if (error) {
    console.error("Erro ao atualizar status:", error);
    alert("Não foi possível atualizar o status.");
    await carregarInscricoes();
    return;
  }

  await carregarInscricoes();
}

verificarSessao();
async function logout() {
  const { error } = await supabaseAdmin.auth.signOut();

  if (error) {
    console.error(error);
    alert("Não foi possível sair.");
    return;
  }

  document.getElementById("email").value = "";
  document.getElementById("password").value = "";

  adminArea.style.display = "none";
  loginArea.style.display = "block";
  tabelaBody.innerHTML = "";
  inscricoes = [];
}