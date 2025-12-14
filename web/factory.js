const markers = [
  { name: "Gate 1", type: "extract", x: 32, y: 44 },
  { name: "Gate 2", type: "extract", x: 44, y: 78 },
  { name: "Gate 3", type: "extract", x: 26, y: 22 },
  { name: "Gate 0", type: "extract", x: 18, y: 82 },
  { name: "Med Tent Gate", type: "extract", x: 80, y: 68 },
];

const filterState = new Set(["extract"]);

const mapEl = document.getElementById("map");
const filterButtons = document.querySelectorAll(".chip");

function renderMarkers() {
  mapEl.querySelectorAll(".marker").forEach((node) => node.remove());

  markers
    .filter((marker) => filterState.size === 0 || filterState.has(marker.type))
    .forEach((marker) => {
      const el = document.createElement("div");
      el.className = `marker ${marker.type}`;
      el.style.left = `${marker.x}%`;
      el.style.top = `${marker.y}%`;
      el.innerHTML = `<span class="pin" aria-hidden="true"></span><span>${marker.name}</span>`;
      el.title = marker.name;
      mapEl.appendChild(el);
    });
}

function toggleFilter(filter) {
  const isActive = filterState.has(filter);
  if (isActive) {
    filterState.delete(filter);
  } else {
    filterState.add(filter);
  }
  syncButtons();
  renderMarkers();
}

function syncButtons() {
  filterButtons.forEach((btn) => {
    const filter = btn.dataset.filter;
    const active = filterState.has(filter) || (filter === "spawn" && filterState.size === 0);
    btn.classList.toggle("active", active);
  });
}

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => toggleFilter(btn.dataset.filter));
});

renderMarkers();
