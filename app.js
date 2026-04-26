"use strict";

/* ===================================================
   폐액 통 상태 관리 (localStorage)
=================================================== */
const BIN_NAMES = ["산", "염기", "유기", "무기"];
const BIN_IDS   = { "산": "acid", "염기": "base", "유기": "organic", "무기": "inorganic" };

function loadBins() {
    const saved = localStorage.getItem("ecosafelab_bins");
    if (saved) return JSON.parse(saved);
    return { "산": [], "염기": [], "유기": [], "무기": [] };
}

function saveBins(bins) {
    localStorage.setItem("ecosafelab_bins", JSON.stringify(bins));
}

function addToBin(bins, containerType, entry) {
    if (!bins[containerType]) bins[containerType] = [];
    bins[containerType].push(entry);
}

function removeFromBin(containerType, idx) {
    const bins = loadBins();
    bins[containerType].splice(idx, 1);
    saveBins(bins);
    renderAllBins();
}

/* ===================================================
   UI 렌더링
=================================================== */
function renderAllBins() {
    const bins = loadBins();
    for (const name of BIN_NAMES) {
        const id     = BIN_IDS[name];
        const el     = document.getElementById(`bin-${id}`);
        const volEl  = document.getElementById(`vol-${id}`);
        const chems  = bins[name] || [];

        if (chems.length === 0) {
            el.innerHTML = `<span class="text-muted small">비어 있음</span>`;
            volEl.textContent = "";
        } else {
            el.innerHTML = chems.map((c, i) => `
                <span class="chem-pill">
                    <span><b>${escHtml(c.formula)}</b> <span class="text-muted">${escHtml(c.name)}</span></span>
                    <span class="vol-info">${c.volume}mL / ${c.conc}%</span>
                    <span class="remove-btn" onclick="removeFromBin('${escHtml(name)}',${i})" title="제거">✕</span>
                </span>`).join("");
            const totalVol = chems.reduce((s, c) => s + Number(c.volume), 0);
            volEl.textContent = `총 ${totalVol} mL`;
        }
    }
}

function escHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
}

/* ===================================================
   PubChem 자동완성
=================================================== */
const localDB = [
    "hydrochloric acid","sulfuric acid","nitric acid","acetic acid",
    "phosphoric acid","hydrofluoric acid","formic acid",
    "sodium hydroxide","potassium hydroxide","calcium hydroxide","ammonia",
    "water","sodium carbonate","calcium carbonate",
    "ethanol","methanol","acetone","benzene","toluene","diethyl ether",
    "chloroform","hexane","dichloromethane",
    "sodium chloride","sodium bicarbonate","sodium hypochlorite","bleach",
    "hydrogen peroxide","hydrogen sulfide","potassium permanganate",
    "ammonium chloride","copper sulfate"
];

let autocompleteTimeout = null;

async function onChemInput() {
    const q = document.getElementById("chemInput").value.trim();
    const box = document.getElementById("suggestions");
    box.innerHTML = "";
    clearTimeout(autocompleteTimeout);
    if (q.length < 2) return;

    autocompleteTimeout = setTimeout(async () => {
        const local = localDB.filter(x => x.includes(q.toLowerCase()));
        let apiList = [];
        try {
            const res = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/compound/${encodeURIComponent(q)}/json`);
            const d = await res.json();
            apiList = d.dictionary_terms?.compound || [];
        } catch {}

        const list = [...new Set([...local, ...apiList])].slice(0, 10);
        list.forEach(item => {
            const d = document.createElement("div");
            d.className = "suggestion-item";
            d.textContent = item;
            d.onclick = () => {
                document.getElementById("chemInput").value = item;
                box.innerHTML = "";
                previewClassify(item);
            };
            box.appendChild(d);
        });
    }, 200);
}

async function previewClassify(name) {
    const el = document.getElementById("classifyResult");
    el.textContent = "분류 중...";
    try {
        const res = await fetch("/classify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name })
        });
        const d = await res.json();
        if (d.found) {
            const srcBadge = d.source === 'pubchem'
                ? `<span class="badge bg-info ms-1" title="PubChem에서 자동 조회됨">PubChem</span>`
                : '';
            el.innerHTML = `<b>${d.formula}</b> → <b>${d.containerType}</b> 폐액 통 권장
                <span class="badge bg-secondary ms-1">${d.types.join(", ")}</span>${srcBadge}`;
            document.getElementById("containerSelect").value =
                (document.getElementById("containerSelect").value === "auto") ? "auto" : document.getElementById("containerSelect").value;
        } else {
            el.textContent = "DB에 없는 물질입니다. 자동 분류가 제한될 수 있습니다.";
        }
    } catch {
        el.textContent = "서버 연결 오류";
    }
}

/* ===================================================
   폐액 추가 & 반응 분석
=================================================== */
let pendingAdd = null; // 위험 경고 확인 후 실제 추가에 사용

async function addChemical() {
    const name   = document.getElementById("chemInput").value.trim().toLowerCase();
    const volume = parseFloat(document.getElementById("volumeInput").value);
    const conc   = parseFloat(document.getElementById("concInput").value);
    const selBin = document.getElementById("containerSelect").value;

    if (!name) return showResult([{ type: "error", msg: "화학물질명을 입력하세요." }]);
    if (isNaN(volume) || volume <= 0) return showResult([{ type: "error", msg: "올바른 부피를 입력하세요." }]);
    if (isNaN(conc) || conc < 0 || conc > 100) return showResult([{ type: "error", msg: "농도는 0~100% 사이로 입력하세요." }]);

    // 1. 서버에서 분류 & 반응 분석
    const bins = loadBins();

    let classRes;
    try {
        const r = await fetch("/classify", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name })
        });
        classRes = await r.json();
    } catch {
        classRes = { found: false };
    }

    // 실제 담을 통 결정
    let targetBin;
    if (selBin === "auto") {
        targetBin = classRes.found ? classRes.containerType : "무기";
    } else {
        targetBin = selBin;
    }

    const formula = classRes.found ? classRes.formula : name.toUpperCase();
    const existingNames = (bins[targetBin] || []).map(c => c.name);

    // 2. 반응 분석
    // 기존 물질의 부피·농도 정보까지 함께 전달 → ΔT 계산에 사용
    const existingFull = (bins[targetBin] || []).map(c => ({
        name: c.name, volume: c.volume, conc: c.conc
    }));

    let analysis;
    try {
        const r = await fetch("/check-reaction", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                newChem:  { name, volume, conc },
                existing: existingFull
            })
        });
        analysis = await r.json();
    } catch {
        analysis = { results: [], containerType: targetBin };
    }

    const reactions = analysis.results || [];
    const entry = { name, formula, volume, conc, containerType: targetBin };

    // 3. 위험 반응이 있으면 경고 모달
    const dangerous = reactions.filter(r => r.dangerous);
    if (dangerous.length > 0) {
        pendingAdd = { entry, targetBin, reactions };
        showDangerOverlay(dangerous);
    } else {
        // 바로 추가
        commitAdd(entry, targetBin);
        renderAnalysisResults(reactions, targetBin, formula);
    }
}

function commitAdd(entry, targetBin) {
    const bins = loadBins();
    addToBin(bins, targetBin, entry);
    saveBins(bins);
    renderAllBins();

    // 입력 초기화
    document.getElementById("chemInput").value = "";
    document.getElementById("volumeInput").value = "";
    document.getElementById("concInput").value = "";
    document.getElementById("classifyResult").textContent = "";
    document.getElementById("suggestions").innerHTML = "";
}

/* ===================================================
   결과 렌더링
=================================================== */
function riskClass(risk) {
    return { "낮음": "risk-low", "보통": "risk-medium", "높음": "risk-high", "매우 높음": "risk-critical" }[risk] || "risk-low";
}

function renderGasInfo(g) {
    if (!g) return "";
    const heavier = g.heavierThanAir
        ? `<span class="badge bg-danger">공기보다 무거움 (${g.densityVsAir}배) — 바닥 축적</span>`
        : `<span class="badge bg-warning text-dark">공기보다 가벼움 (${g.densityVsAir}배) — 위로 확산</span>`;

    const tlvRow = g.tlvTwa !== null
        ? `<tr><td>TLV-TWA</td><td><b>${g.tlvTwa} ppm</b></td></tr>`
        : "";
    const dangerRow = g.dangerousPpm !== null
        ? `<tr><td>즉각 위험 농도</td><td class="text-warning fw-bold">${g.dangerousPpm} ppm</td></tr>`
        : "";
    const fatalRow = g.fatalPpm !== null
        ? `<tr><td>치사 농도</td><td class="text-danger fw-bold">${g.fatalPpm} ppm</td></tr>`
        : "";

    return `
    <div class="gas-info-card mt-2">
        <div class="gas-info-title">💨 발생 기체 특성: ${escHtml(g.fullName)}</div>
        <div class="gas-info-body">
            <div class="row g-2">
                <div class="col-sm-6">
                    <table class="table table-sm table-borderless mb-0 small">
                        <tr><td>색</td><td><b>${escHtml(g.color)}</b></td></tr>
                        <tr><td>냄새</td><td>${escHtml(g.odor)}</td></tr>
                        ${g.odorThresholdPpm ? `<tr><td>감지 한계</td><td>${g.odorThresholdPpm} ppm</td></tr>` : ""}
                        <tr><td>밀도</td><td>${heavier}</td></tr>
                    </table>
                </div>
                <div class="col-sm-6">
                    <table class="table table-sm table-borderless mb-0 small">
                        <tr><td>위험 등급</td><td><b class="text-danger">${escHtml(g.hazardLevel)}</b></td></tr>
                        ${tlvRow}${dangerRow}${fatalRow}
                    </table>
                </div>
            </div>
            <div class="small text-muted mt-1">📌 ${escHtml(g.note)}</div>
            <div class="small fw-bold text-danger mt-1">🚨 대처: ${escHtml(g.action)}</div>
        </div>
    </div>`;
}

function renderAnalysisResults(reactions, targetBin, formula) {
    const el = document.getElementById("resultArea");
    let html = `<div class="card mb-3"><div class="card-header fw-bold">분석 결과 — <b>${formula}</b> → <b>${targetBin}</b> 폐액 통</div><div class="card-body">`;

    if (reactions.length === 0) {
        html += `<div class="alert alert-success mb-0">기존 폐액과의 반응 없음. 안전하게 추가되었습니다.</div>`;
    } else {
        html += reactions.map(r => {
            const dGLabel = r.deltaG !== null
                ? `${r.deltaG} kJ/mol <span class="text-muted small">(${r.deltaG < 0 ? "자발적 반응 ✓" : "비자발적"})</span>`
                : "계산 불가";
            const dTLabel = r.deltaT !== null
                ? `<span class="text-danger fw-bold">+${r.deltaT} °C</span> <span class="text-muted small">(희석 수용액 기준)</span>`
                : "부피·농도 정보 필요";

            return `
            <div class="result-card ${riskClass(r.risk)}">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <strong>${escHtml(r.reactionType)}</strong>
                    <span class="risk-badge ${escHtml(r.risk)}">${escHtml(r.risk)}</span>
                </div>
                <div class="mb-1"><span class="label-tag">반응식</span> ${escHtml(r.equation)}</div>
                <div class="mb-2"><span class="label-tag">반응 물질</span>
                    <code>${escHtml(r.pair)}</code>
                    <span class="text-muted small">(${escHtml(r.chemA)} + ${escHtml(r.chemB)})</span>
                </div>

                <div class="thermo-grid">
                    <div class="thermo-item">
                        <div class="thermo-label">ΔH (엔탈피 변화)</div>
                        <div class="thermo-value">${r.deltaH !== null ? r.deltaH + " kJ/mol" : "—"}</div>
                        <div class="thermo-sub">${escHtml(r.heatFlow)}</div>
                    </div>
                    <div class="thermo-item">
                        <div class="thermo-label">ΔS (엔트로피 변화)</div>
                        <div class="thermo-value">${r.deltaS !== null ? r.deltaS + " J/(mol·K)" : "—"}</div>
                        <div class="thermo-sub">${r.deltaS > 0 ? "무질서도 증가" : "무질서도 감소"}</div>
                    </div>
                    <div class="thermo-item">
                        <div class="thermo-label">ΔG (깁스 에너지)</div>
                        <div class="thermo-value">${dGLabel}</div>
                        <div class="thermo-sub">ΔG = ΔH − TΔS (T = 298 K)</div>
                    </div>
                    <div class="thermo-item">
                        <div class="thermo-label">예상 온도 상승 (ΔT)</div>
                        <div class="thermo-value">${dTLabel}</div>
                        <div class="thermo-sub">q = |ΔH| × n, ΔT = q / mc</div>
                    </div>
                </div>

                ${r.gasProduced ? renderGasInfo(r.gasInfo) : ""}
                ${r.warning ? `<div class="mt-2 text-danger small fw-bold">⚠️ ${escHtml(r.warning)}</div>` : ""}
            </div>`;
        }).join("");
    }

    html += `</div></div>`;
    el.innerHTML = html;
}

function showResult(msgs) {
    document.getElementById("resultArea").innerHTML = msgs.map(m =>
        `<div class="alert alert-${m.type === "error" ? "danger" : "info"}">${escHtml(m.msg)}</div>`
    ).join("");
}

/* ===================================================
   위험 경고 모달
=================================================== */
function showDangerOverlay(dangerous) {
    const detail = document.getElementById("danger-detail");
    detail.innerHTML = dangerous.map(r => `
        <div class="mb-2 p-2 border-start border-danger border-3 ps-3">
            <b>${escHtml(r.reactionType)}</b><br>
            ${escHtml(r.equation)}<br>
            ${r.gasProduced ? `💨 <b>기체 발생: ${escHtml(r.gasProduced)}</b><br>` : ""}
            <span class="text-danger">${escHtml(r.warning)}</span>
        </div>`).join("");
    document.getElementById("danger-overlay").classList.add("show");
}

function closeDangerOverlay(confirmed) {
    document.getElementById("danger-overlay").classList.remove("show");
    if (confirmed && pendingAdd) {
        commitAdd(pendingAdd.entry, pendingAdd.targetBin);
        renderAnalysisResults(pendingAdd.reactions, pendingAdd.targetBin, pendingAdd.entry.formula);
    } else {
        document.getElementById("resultArea").innerHTML =
            `<div class="alert alert-secondary">추가가 취소되었습니다.</div>`;
    }
    pendingAdd = null;
}

/* ===================================================
   관리자 패널
=================================================== */
let isAdmin = false;

function showLogin() {
    document.getElementById("loginCard").classList.toggle("hidden");
}

function doLogin() {
    const pass = document.getElementById("adminPass").value;
    if (pass === "admin1234") {
        isAdmin = true;
        document.getElementById("loginCard").classList.add("hidden");
        document.getElementById("loginBtn").classList.add("hidden");
        document.getElementById("logoutBtn").classList.remove("hidden");
        loadAdminAlerts();
    } else {
        alert("비밀번호가 틀렸습니다.");
    }
}

function doLogout() {
    isAdmin = false;
    document.getElementById("loginBtn").classList.remove("hidden");
    document.getElementById("logoutBtn").classList.add("hidden");
    document.getElementById("adminPanel").classList.remove("show");
}

function toggleAdmin() {
    if (!isAdmin) { alert("관리자 로그인이 필요합니다."); return; }
    const panel = document.getElementById("adminPanel");
    panel.classList.toggle("show");
    if (panel.classList.contains("show")) loadAdminAlerts();
}

async function loadAdminAlerts() {
    try {
        const res = await fetch("/admin/alerts");
        const alerts = await res.json();
        const el = document.getElementById("adminAlertList");

        if (alerts.length === 0) {
            el.innerHTML = `<span class="text-muted">알림 없음</span>`;
            return;
        }

        el.innerHTML = alerts.reverse().map(a => `
            <div class="alert-row mb-2">
                <div class="small text-muted">${new Date(a.timestamp).toLocaleString("ko-KR")}</div>
                <b>${escHtml(a.newChem)}</b> 추가 시 위험 반응 감지
                ${a.alerts.map(r => `
                    <div class="mt-1 ps-2">
                        <span class="badge bg-danger">${escHtml(r.risk)}</span>
                        ${escHtml(r.reactionType)} — ${escHtml(r.pair)}
                        ${r.gasProduced ? `💨 ${escHtml(r.gasProduced)}` : ""}
                    </div>`).join("")}
            </div>`).join("");
    } catch {
        document.getElementById("adminAlertList").innerHTML = `<span class="text-danger">서버 연결 오류</span>`;
    }
}

async function clearAdminAlerts() {
    if (!confirm("관리자 알림을 모두 삭제하시겠습니까?")) return;
    await fetch("/admin/alerts", { method: "DELETE" });
    loadAdminAlerts();
}

/* ===================================================
   전역 노출 & 초기화
=================================================== */
window.onChemInput    = onChemInput;
window.addChemical    = addChemical;
window.removeFromBin  = removeFromBin;
window.closeDangerOverlay = closeDangerOverlay;
window.showLogin      = showLogin;
window.doLogin        = doLogin;
window.doLogout       = doLogout;
window.toggleAdmin    = toggleAdmin;
window.clearAdminAlerts = clearAdminAlerts;

document.addEventListener("click", e => {
    if (!e.target.closest("#chemInput") && !e.target.closest("#suggestions")) {
        document.getElementById("suggestions").innerHTML = "";
    }
});

renderAllBins();
