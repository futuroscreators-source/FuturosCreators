(() => {
  "use strict";

  // Chaves fictícias desta primeira versão. Troque-as antes de publicar o ARG.
  const STAGES = [
    { answer: "IGNORARAM", unlock: "arquivo-01", nav: "nav-file-01", label: "Registro de atividade" },
    { answer: "HORARIOS", unlock: "arquivo-02", nav: "nav-file-02", label: "Comunicação recuperada" },
    { answer: "NOX", unlock: "arquivo-03", nav: "nav-file-03", label: "Diretório NOX" }
  ];
  const COLLECTIVE_KEY = "CONVERGENCIA";
  const STORAGE_KEY = "fc_arg_lore2_progress_v1";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  let state = loadState();

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return { stages: Array.isArray(saved.stages) ? saved.stages : [], collective: Boolean(saved.collective) };
    } catch {
      return { stages: [], collective: false };
    }
  }
  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderProgress();
  }
  function normalize(value) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  }
  function feedback(element, message, kind) {
    element.textContent = message;
    element.className = "form-hint " + (kind || "");
  }
  function unlockStage(index) {
    if (!state.stages.includes(index)) state.stages.push(index);
    saveState();
    const stage = STAGES[index];
    const nav = document.getElementById(stage.nav);
    if (nav) {
      nav.classList.remove("locked");
      nav.classList.add("unlocked");
      nav.querySelector("b").textContent = "›";
    }
    const output = $("#terminal-output");
    if (output && index === 0) {
      const p = document.createElement("p");
      p.className = "terminal-ok";
      p.textContent = "[OK] Registro de atividade recuperado.";
      output.appendChild(p);
    }
  }
  function renderProgress() {
    const total = STAGES.length + 1;
    const completed = state.stages.length + (state.collective ? 1 : 0);
    const percent = Math.round(completed / total * 100);
    $("#progress-number").textContent = percent + "%";
    $("#progress-bar").style.width = percent + "%";
    STAGES.forEach((stage, i) => {
      const nav = document.getElementById(stage.nav);
      if (nav && state.stages.includes(i)) {
        nav.classList.remove("locked");
        nav.classList.add("unlocked");
        nav.querySelector("b").textContent = "›";
      }
    });
    if (state.collective) {
      feedback($("#collective-feedback"), "MARCO REGISTRADO NESTE DISPOSITIVO.", "success");
    }
  }
  function showPanel(id) {
    const target = document.getElementById(id);
    if (!target) return;
    if (id !== "terminal") {
      const index = STAGES.findIndex(stage => stage.unlock === id);
      if (index >= 0 && !state.stages.includes(index)) return;
    }
    $$(".panel").forEach(panel => panel.classList.toggle("active-panel", panel.id === id));
    $$(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.target === id));
    if (window.innerWidth < 760) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  $$(".nav-item").forEach(item => item.addEventListener("click", () => {
    if (item.classList.contains("locked")) return;
    showPanel(item.dataset.target);
  }));

  $("#code-form").addEventListener("submit", event => {
    event.preventDefault();
    const input = $("#code-input");
    const result = $("#form-feedback");
    if (normalize(input.value) === "IGNORARAM") {
      unlockStage(0);
      feedback(result, "CHAVE ACEITA. O REGISTRO DE ATIVIDADE FOI RECUPERADO.", "success");
      input.value = "";
      showPanel("arquivo-01");
    } else {
      feedback(result, "CHAVE NÃO RECONHECIDA. VOLTE À FRASE DO BUFFER E RELEIA COM ATENÇÃO.", "error");
    }
  });

  $$(".secondary-form").forEach(form => form.addEventListener("submit", event => {
    event.preventDefault();
    const index = Number(form.dataset.stage);
    const input = $("input", form);
    const result = $(".form-hint", form);
    if (normalize(input.value) === normalize(STAGES[index].answer)) {
      unlockStage(index);
      feedback(result, "CHAVE ACEITA. NOVO PACOTE ADICIONADO AO ÍNDICE.", "success");
      input.value = "";
      if (index < STAGES.length - 1) showPanel(STAGES[index + 1].unlock);
    } else {
      feedback(result, "RESPOSTA INCORRETA. O DOCUMENTO AINDA CONTÉM UMA PISTA.", "error");
    }
  }));

  $("#collective-form").addEventListener("submit", event => {
    event.preventDefault();
    const input = $("#collective-code");
    const result = $("#collective-feedback");
    if (normalize(input.value) === COLLECTIVE_KEY) {
      state.collective = true;
      saveState();
      feedback(result, "PROTOCOLO REGISTRADO NESTE DISPOSITIVO. A SINCRONIZAÇÃO GLOBAL AINDA PRECISA DE BACKEND.", "success");
      input.value = "";
    } else {
      feedback(result, "CHAVE NÃO VALIDADA. A COMUNIDADE AINDA PRECISA INVESTIGAR.", "error");
    }
  });

  function updateClock() {
    $("#clock").textContent = new Date().toLocaleTimeString("pt-BR", { hour12: false });
  }
  $("#year").textContent = new Date().getFullYear();
  updateClock();
  setInterval(updateClock, 1000);
  renderProgress();
})();
