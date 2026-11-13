"use strict";

const STORAGE_KEY = "votafacil.poll.v1";
const draftOptions = [];

const createScreen = document.querySelector("#create-screen");
const pollScreen = document.querySelector("#poll-screen");
const createForm = document.querySelector("#create-form");
const questionInput = document.querySelector("#question");
const optionInput = document.querySelector("#option-input");
const optionList = document.querySelector("#option-list");
const optionCount = document.querySelector("#option-count");
const appMessage = document.querySelector("#app-message");
const pollQuestion = document.querySelector("#poll-question");
const pollStatus = document.querySelector("#poll-status");
const voteForm = document.querySelector("#vote-form");
const voterNameInput = document.querySelector("#voter-name");
const pollOptions = document.querySelector("#poll-options");
const voteButton = document.querySelector("#vote-button");
const voteFeedback = document.querySelector("#vote-feedback");
const totalVotes = document.querySelector("#total-votes");
const resultsList = document.querySelector("#results-list");
const endPollButton = document.querySelector("#end-poll");
const resetPollButton = document.querySelector("#reset-poll");

function showMessage(message, kind) {
  appMessage.textContent = message;
  appMessage.dataset.kind = kind || "info";
  appMessage.hidden = false;
}

function clearMessage() {
  appMessage.textContent = "";
  appMessage.hidden = true;
  delete appMessage.dataset.kind;
}

function readPoll() {
  const savedPoll = localStorage.getItem(STORAGE_KEY);
  if (!savedPoll) {
    return null;
  }

  const poll = JSON.parse(savedPoll);
  if (
    !poll ||
    typeof poll.question !== "string" ||
    !Array.isArray(poll.options) ||
    !Array.isArray(poll.votes) ||
    typeof poll.ended !== "boolean"
  ) {
    throw new Error("Os dados salvos da votação estão inválidos.");
  }

  return poll;
}

function savePoll(poll) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(poll));
}

function normalizeName(name) {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}

function renderDraftOptions() {
  optionList.replaceChildren();

  draftOptions.forEach((option, index) => {
    const item = document.createElement("li");
    item.className = "option-item";

    const name = document.createElement("span");
    name.textContent = option;

    const removeButton = document.createElement("button");
    removeButton.className = "remove-option";
    removeButton.type = "button";
    removeButton.textContent = "Remover";
    removeButton.setAttribute("aria-label", `Remover opção ${option}`);
    removeButton.addEventListener("click", () => {
      draftOptions.splice(index, 1);
      renderDraftOptions();
    });

    item.append(name, removeButton);
    optionList.append(item);
  });

  optionCount.textContent = `${draftOptions.length} ${draftOptions.length === 1 ? "opção" : "opções"}`;
}

function addDraftOption() {
  const option = optionInput.value.trim();
  if (!option) {
    optionInput.focus();
    return;
  }

  const duplicate = draftOptions.some(
    (existing) => existing.toLocaleLowerCase("pt-BR") === option.toLocaleLowerCase("pt-BR")
  );
  if (duplicate) {
    showMessage("Essa opção já foi adicionada. Escolha um nome diferente.", "error");
    optionInput.focus();
    return;
  }

  clearMessage();
  draftOptions.push(option);
  optionInput.value = "";
  renderDraftOptions();
  optionInput.focus();
}

function showCreateScreen() {
  createScreen.hidden = false;
  pollScreen.hidden = true;
}

function showPollScreen(poll) {
  createScreen.hidden = true;
  pollScreen.hidden = false;
  pollQuestion.textContent = poll.question;
  pollStatus.textContent = poll.ended ? "VOTAÇÃO ENCERRADA" : "VOTAÇÃO ABERTA";
  voteButton.disabled = poll.ended;
  voterNameInput.disabled = poll.ended;
  endPollButton.disabled = poll.ended;

  pollOptions.replaceChildren();
  poll.options.forEach((option, index) => {
    const label = document.createElement("label");
    label.className = "choice-card";

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "selectedOption";
    radio.value = option.id;
    radio.required = true;
    radio.disabled = poll.ended;
    radio.id = `poll-option-${index}`;

    const text = document.createElement("span");
    text.textContent = option.name;

    label.htmlFor = radio.id;
    label.append(radio, text);
    pollOptions.append(label);
  });

  renderResults(poll);
}

function renderResults(poll) {
  const total = poll.votes.length;
  totalVotes.textContent = `${total} ${total === 1 ? "voto" : "votos"}`;
  resultsList.replaceChildren();

  if (total === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-results";
    empty.textContent = "Ainda não há votos. Seja a primeira pessoa a participar!";
    resultsList.append(empty);
  }

  poll.options.forEach((option) => {
    const count = poll.votes.filter((vote) => vote.optionId === option.id).length;
    const percentage = total === 0 ? 0 : Math.round((count / total) * 100);

    const result = document.createElement("div");
    result.className = "result";

    const label = document.createElement("div");
    label.className = "result-label";
    const name = document.createElement("span");
    name.className = "result-name";
    name.textContent = option.name;
    const value = document.createElement("span");
    value.className = "result-value";
    value.textContent = `${count} ${count === 1 ? "voto" : "votos"} · ${percentage}%`;
    label.append(name, value);

    const track = document.createElement("div");
    track.className = "bar-track";
    track.setAttribute("role", "progressbar");
    track.setAttribute("aria-label", `${option.name}: ${percentage}%`);
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", "100");
    track.setAttribute("aria-valuenow", String(percentage));

    const fill = document.createElement("div");
    fill.className = "bar-fill";
    fill.style.width = `${percentage}%`;
    track.append(fill);
    result.append(label, track);
    resultsList.append(result);
  });
}

function loadPoll() {
  try {
    const poll = readPoll();
    clearMessage();
    if (poll) {
      showPollScreen(poll);
    } else {
      showCreateScreen();
    }
  } catch (error) {
    showCreateScreen();
    showMessage(`Não foi possível carregar a votação salva: ${error.message}`, "error");
  }
}

document.querySelector("#add-option").addEventListener("click", addDraftOption);
optionInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addDraftOption();
  }
});

createForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const question = questionInput.value.trim();
  if (!question) {
    showMessage("Digite a pergunta da votação.", "error");
    questionInput.focus();
    return;
  }
  if (draftOptions.length < 2) {
    showMessage("Adicione pelo menos duas opções antes de criar a votação.", "error");
    optionInput.focus();
    return;
  }

  const poll = {
    question,
    options: draftOptions.map((name) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name
    })),
    votes: [],
    ended: false
  };

  try {
    savePoll(poll);
    draftOptions.length = 0;
    createForm.reset();
    renderDraftOptions();
    loadPoll();
  } catch (error) {
    showMessage(`Não foi possível salvar a votação: ${error.message}`, "error");
  }
});

voteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  voteFeedback.textContent = "";

  const voterName = voterNameInput.value.trim().replace(/\s+/g, " ");
  const selectedOption = pollOptions.querySelector('input[name="selectedOption"]:checked');
  if (!voterName || !selectedOption) {
    voteFeedback.textContent = "Informe seu nome e escolha uma opção.";
    return;
  }

  try {
    const poll = readPoll();
    if (!poll) {
      throw new Error("A votação não está disponível.");
    }
    if (poll.ended) {
      voteFeedback.textContent = "Esta votação já foi encerrada.";
      showPollScreen(poll);
      return;
    }

    const alreadyVoted = poll.votes.some((vote) => normalizeName(vote.name) === normalizeName(voterName));
    if (alreadyVoted) {
      voteFeedback.textContent = "Este nome já foi usado para votar nesta enquete.";
      return;
    }

    const optionExists = poll.options.some((option) => option.id === selectedOption.value);
    if (!optionExists) {
      throw new Error("A opção selecionada não existe mais. Atualize a página e tente novamente.");
    }

    poll.votes.push({
      name: voterName,
      optionId: selectedOption.value
    });
    savePoll(poll);
    voterNameInput.value = "";
    showPollScreen(poll);
    voteFeedback.textContent = "Voto registrado. Obrigado por participar!";
  } catch (error) {
    showMessage(`Não foi possível registrar o voto: ${error.message}`, "error");
  }
});

endPollButton.addEventListener("click", () => {
  try {
    const poll = readPoll();
    if (!poll) {
      throw new Error("A votação não está disponível.");
    }
    poll.ended = true;
    savePoll(poll);
    showPollScreen(poll);
    showMessage("Votação encerrada. Os resultados continuam disponíveis.");
  } catch (error) {
    showMessage(`Não foi possível encerrar a votação: ${error.message}`, "error");
  }
});

resetPollButton.addEventListener("click", () => {
  const confirmed = window.confirm(
    "Tem certeza de que deseja criar uma nova votação? A pergunta, as opções e todos os votos atuais serão apagados."
  );
  if (!confirmed) {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
    createForm.reset();
    voteForm.reset();
    draftOptions.length = 0;
    renderDraftOptions();
    voteFeedback.textContent = "";
    clearMessage();
    showCreateScreen();
    showMessage("Votação apagada. Digite uma nova pergunta e adicione as opções.");
    questionInput.focus();
  } catch (error) {
    showMessage(`Não foi possível criar uma nova votação: ${error.message}`, "error");
  }
});

window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY || event.key === null) {
    loadPoll();
  }
});

loadPoll();
