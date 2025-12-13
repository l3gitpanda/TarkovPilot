const mapConfigs = {
  "Ground Zero": { color: "#1f2937" },
  Factory: { color: "#3730a3" },
  Customs: { color: "#7c3aed" },
  Woods: { color: "#0f766e" },
  Shoreline: { color: "#0284c7" },
  Interchange: { color: "#a855f7" },
  Reserve: { color: "#475569" },
  "The Lab": { color: "#b91c1c" },
  Lighthouse: { color: "#d97706" },
  "Streets of Tarkov": { color: "#0ea5e9" },
};

const rawLocationLookup = {
  sandbox: "Ground Zero",
  sandbox_high: "Ground Zero",
  factory_day: "Factory",
  factory_night: "Factory",
  factory4_day: "Factory",
  factory4_night: "Factory",
  bigmap: "Customs",
  woods: "Woods",
  shoreline: "Shoreline",
  interchange: "Interchange",
  shopping_mall: "Interchange",
  rezervbase: "Reserve",
  rezerv_base: "Reserve",
  laboratory: "The Lab",
  lighthouse: "Lighthouse",
  tarkovstreets: "Streets of Tarkov",
  city: "Streets of Tarkov",
};

const state = {
  socket: null,
  currentMap: null,
  bounds: {},
  lastPosition: null,
  quests: [],
};

const marker = document.getElementById("marker");
const mapBackground = document.getElementById("mapBackground");
const mapStatus = document.getElementById("mapStatus");
const coordStatus = document.getElementById("coordStatus");
const connectionStatus = document.getElementById("connectionStatus");
const mapSelect = document.getElementById("mapSelect");
const configList = document.getElementById("configList");
const logElement = document.getElementById("log");
const questList = document.getElementById("questList");
const resetBoundsBtn = document.getElementById("resetBounds");
const updateAgentBtn = document.getElementById("updateAgent");

function init() {
  populateMapSelect();
  mapSelect.addEventListener("change", () => setActiveMap(mapSelect.value, true));
  resetBoundsBtn.addEventListener("click", resetBounds);
  updateAgentBtn.addEventListener("click", requestUpdate);
  connect();
}

function populateMapSelect() {
  Object.keys(mapConfigs).forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    mapSelect.appendChild(option);
  });
}

function connect() {
  const socket = new WebSocket("ws://localhost:5123");
  state.socket = socket;
  setConnection("Connecting…", "warn");

  socket.addEventListener("open", () => setConnection("Connected", "green"));
  socket.addEventListener("close", () => {
    setConnection("Disconnected — retrying…", "red");
    setTimeout(connect, 2000);
  });
  socket.addEventListener("error", () => setConnection("Connection error", "red"));
  socket.addEventListener("message", onMessage);
}

function requestUpdate() {
  if (!state.socket || state.socket.readyState !== WebSocket.OPEN) {
    log("Update", "WebSocket not connected");
    return;
  }

  state.socket.send(JSON.stringify({ messageType: "UPDATE" }));
  log("Update", "Requested agent update");
}

function onMessage(evt) {
  let data;
  try {
    data = JSON.parse(evt.data);
  } catch (err) {
    log("Received non-JSON message", evt.data);
    return;
  }

  switch (data.messageType) {
    case "MAP_CHANGE":
      handleMapChange(data.map);
      break;
    case "POSITION_UPDATE":
      handlePosition({ x: data.x, y: data.y, z: data.z }, "position update");
      break;
    case "SEND_FILENAME":
      handleFilename(data.filename);
      break;
    case "CONFIGURATION":
      updateConfiguration(data);
      break;
    case "QUEST_UPDATE":
      handleQuest(data);
      break;
    default:
      log("Message", JSON.stringify(data));
  }
}

function handleMapChange(rawMap) {
  const mapped = resolveMapName(rawMap);
  if (!mapped) {
    log("Unknown map", rawMap);
    return;
  }
  setActiveMap(mapped, true);
  log("Map", mapped);
}

function handlePosition(pos, source = "") {
  state.lastPosition = pos;
  ensureBounds(pos);
  renderPosition();
  const text = `${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}`;
  coordStatus.textContent = text;
  log(source || "Position", text);
}

function handleFilename(filename) {
  if (!filename) return;
  log("Screenshot", filename);

  const mapGuess = parseMapFromFilename(filename);
  if (mapGuess) {
    setActiveMap(mapGuess, false);
  }

  const coords = parseCoords(filename);
  if (coords) {
    handlePosition(coords, "Screenshot position");
  }
}

function parseCoords(str) {
  const matches = str.match(/-?\d+(?:\.\d+)?/g);
  if (!matches || matches.length < 3) return null;
  const numbers = matches.slice(-3).map((n) => Number(n));
  if (numbers.some((n) => Number.isNaN(n))) return null;
  return { x: numbers[0], y: numbers[1], z: numbers[2] };
}

function parseMapFromFilename(str) {
  const lowered = str.toLowerCase();
  const direct = Object.keys(mapConfigs).find((name) => lowered.includes(name.toLowerCase().replace(/\s+/g, "")));
  if (direct) return direct;

  const rawMatch = Object.keys(rawLocationLookup).find((key) => lowered.includes(key));
  return rawMatch ? rawLocationLookup[rawMatch] : null;
}

function resolveMapName(raw) {
  if (!raw) return null;
  if (mapConfigs[raw]) return raw;
  const lowered = raw.toLowerCase();
  if (rawLocationLookup[lowered]) return rawLocationLookup[lowered];
  return null;
}

function setActiveMap(name, setSelect) {
  if (!name || !mapConfigs[name]) return;
  state.currentMap = name;
  if (setSelect && mapSelect.value !== name) {
    mapSelect.value = name;
  }
  mapBackground.dataset.mapName = name;
  applyMapStyle(name);
  renderPosition();
  mapStatus.textContent = `Viewing ${name}`;
}

function applyMapStyle(name) {
  const config = mapConfigs[name] || {};
  const safeName = name.toLowerCase().replace(/\s+/g, "-");
  const imagePath = `maps/${safeName}.svg`;
  mapBackground.style.backgroundImage = `linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.0)), url('${imagePath}')`;
  mapBackground.style.backgroundColor = config.color || "#0b1221";
}

function ensureBounds(pos) {
  const map = state.currentMap;
  if (!map) return;
  if (!state.bounds[map]) {
    state.bounds[map] = { minX: pos.x - 50, maxX: pos.x + 50, minY: pos.y - 50, maxY: pos.y + 50 };
  }

  const bounds = state.bounds[map];
  bounds.minX = Math.min(bounds.minX, pos.x);
  bounds.maxX = Math.max(bounds.maxX, pos.x);
  bounds.minY = Math.min(bounds.minY, pos.y);
  bounds.maxY = Math.max(bounds.maxY, pos.y);
}

function resetBounds() {
  if (state.currentMap && state.lastPosition) {
    state.bounds[state.currentMap] = {
      minX: state.lastPosition.x - 50,
      maxX: state.lastPosition.x + 50,
      minY: state.lastPosition.y - 50,
      maxY: state.lastPosition.y + 50,
    };
    renderPosition();
  }
}

function renderPosition() {
  if (!state.currentMap || !state.lastPosition || !state.bounds[state.currentMap]) {
    marker.classList.remove("visible");
    return;
  }

  const { minX, maxX, minY, maxY } = state.bounds[state.currentMap];
  const xPct = clamp((state.lastPosition.x - minX) / (maxX - minX), 0, 1) * 100;
  const yPct = 100 - clamp((state.lastPosition.y - minY) / (maxY - minY), 0, 1) * 100;

  marker.style.left = `${xPct}%`;
  marker.style.top = `${yPct}%`;
  marker.classList.add("visible");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updateConfiguration(cfg) {
  configList.innerHTML = "";
  const entries = [
    ["Version", cfg.version],
    ["Game folder", formatPath(cfg.gameFolder, cfg.gameFolderErr)],
    ["Screenshots", formatPath(cfg.screenshotsFolder, cfg.screenshotsFolderErr)],
  ];
  entries.forEach(([label, value]) => {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.innerHTML = value || "<span class='badge red'>missing</span>";
    configList.append(dt, dd);
  });
}

function formatPath(path, err) {
  if (!path) return null;
  if (err) {
    return `${path} <span class="badge red">${err}</span>`;
  }
  return `${path} <span class="badge green">ok</span>`;
}

function handleQuest(data) {
  const entry = `${data.questId} — ${data.status}`;
  state.quests.unshift(entry);
  state.quests = state.quests.slice(0, 8);
  renderQuests();
  log("Quest", entry);
}

function renderQuests() {
  questList.innerHTML = "";
  state.quests.forEach((text) => {
    const li = document.createElement("li");
    li.textContent = text;
    questList.appendChild(li);
  });
}

function setConnection(label, tone) {
  connectionStatus.textContent = label;
  connectionStatus.className = `connection badge ${tone}`;
}

function log(label, message) {
  const time = new Date().toLocaleTimeString();
  const entry = document.createElement("div");
  entry.className = "log-entry";
  entry.innerHTML = `<strong>[${time}] ${label}:</strong> ${message}`;
  logElement.prepend(entry);
  const children = [...logElement.children];
  if (children.length > 80) {
    children.slice(80).forEach((el) => el.remove());
  }
}

setActiveMap("Ground Zero", true);
init();
