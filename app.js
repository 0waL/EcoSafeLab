console.log("NEW CODE LOADED");

let thermoDB = {
    "HCl": { dhf: -167.2, molarMass: 36.46, density: 1.19 },
    "NaOH": { dhf: -470.1, molarMass: 40.00, density: 2.13 },
    "H2O2": { dhf: -187.8, molarMass: 34.01, density: 1.45 },
    "H2O": { dhf: -285.83, molarMass: 18.02, density: 1.00 },
    "NaCl": { dhf: -407.3, molarMass: 58.44, density: 2.16 },
    "H2S": { dhf: -20.6, molarMass: 34.08, density: 1.36 }
};

function loadContainers() {
    let data = localStorage.getItem("containers");
    return data ? JSON.parse(data) : [
        { name: "Container A", chemicals: [], energy: 0 }
    ];
}

function saveContainers(c) {
    localStorage.setItem("containers", JSON.stringify(c));
}

function clearAllData() {
    localStorage.clear();
    renderContainers();
    document.getElementById("result").innerHTML =
        `<div class="alert alert-info">저장 기록이 초기화되었습니다.</div>`;
}

function renderContainers() {
    let containers = loadContainers();
    let html = "";

    containers.forEach(c => {
        html += `<b>${c.name}</b><br>`;

        if (c.chemicals.length === 0) {
            html += `저장된 폐액 없음<br>`;
        }

        c.chemicals.forEach(x => {
            html += `- ${x.chem}, ${x.volume} mL, ${x.concentration}%<br>`;
        });

        html += `<hr>`;
    });

    document.getElementById("containerInfo").innerHTML = html;
}

async function fetchSuggestions() {
    let q = document.getElementById("chemicalInput").value.trim();

    if (q.length < 2) {
        document.getElementById("suggestions").innerHTML = "";
        return;
    }

    try {
        let res = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/compound/${encodeURIComponent(q)}/json`);
        let data = await res.json();

        let list = data.dictionary_terms?.compound || [];
        let box = document.getElementById("suggestions");
        box.innerHTML = "";

        list.slice(0, 10).forEach(item => {
            let d = document.createElement("div");
            d.className = "suggestion-item";
            d.innerText = item;
            d.onclick = () => {
                document.getElementById("chemicalInput").value = item;
                box.innerHTML = "";
            };
            box.appendChild(d);
        });

    } catch (e) {
        console.log("자동완성 오류:", e);
    }
}

async function toSmiles(name) {
    let aliases = {
        "hydrogen sulfide": "7783-06-4",
        "hydrochloric acid": "7647-01-0",
        "sodium chloride": "7647-14-5",
        "sodium hydroxide": "1310-73-2",
        "water": "7732-18-5",
        "hydrogen peroxide": "7722-84-1"
    };

    let query = aliases[name.toLowerCase()] || name;

    try {
        let res = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(query)}/property/CanonicalSMILES/JSON`);
        let d = await res.json();

        if (!d.PropertyTable || !d.PropertyTable.Properties || d.PropertyTable.Properties.length === 0) {
            return null;
        }

        return d.PropertyTable.Properties[0].CanonicalSMILES;
    } catch (e) {
        console.log("SMILES 변환 오류:", e);
        return null;
    }
}

async function toFormula(smiles) {
    try {
        let res = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(smiles)}/property/MolecularFormula/JSON`);
        let d = await res.json();

        if (!d.PropertyTable || !d.PropertyTable.Properties || d.PropertyTable.Properties.length === 0) {
            return null;
        }

        return d.PropertyTable.Properties[0].MolecularFormula;
    } catch (e) {
        console.log("화학식 변환 오류:", e);
        return null;
    }
}

async function predictReaction(smiles) {
    try {
        let res = await fetch("http://localhost:3000/predict-reaction", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ smiles })
        });

        if (!res.ok) {
            return null;
        }

        return await res.json();
    } catch (e) {
        console.log("AI 서버 연결 오류:", e);
        return null;
    }
}

function parseReaction(r) {
    if (!r || !r.includes(">>")) {
        return null;
    }

    let [re, pr] = r.split(">>");

    return {
        reactants: re.split("."),
        products: pr.split(".")
    };
}

async function calcHess(parsed) {
    if (!parsed) {
        return { deltaH: null, reactants: [], products: [] };
    }

    let rSum = 0;
    let pSum = 0;
    let found = false;

    for (let r of parsed.reactants) {
        let f = await toFormula(r);
        if (f && thermoDB[f]) {
            rSum += thermoDB[f].dhf;
            found = true;
        }
    }

    for (let p of parsed.products) {
        let f = await toFormula(p);
        if (f && thermoDB[f]) {
            pSum += thermoDB[f].dhf;
            found = true;
        }
    }

    if (!found) {
        return { deltaH: null };
    }

    return { deltaH: pSum - rSum };
}

function simpleSafetyCheck(a, b) {
    let x = a.toLowerCase();
    let y = b.toLowerCase();

    if (
        (x.includes("hydrochloric acid") && y.includes("sodium hydroxide")) ||
        (x.includes("sodium hydroxide") && y.includes("hydrochloric acid"))
    ) {
        return {
            rxn: "HCl + NaOH → NaCl + H₂O",
            deltaH: -57.3,
            note: "강산-강염기 중화 반응"
        };
    }

    if (
        (x.includes("hydrogen sulfide") && y.includes("hydrochloric acid")) ||
        (x.includes("hydrochloric acid") && y.includes("hydrogen sulfide"))
    ) {
        return {
            rxn: "뚜렷한 일반 반응식 없음",
            deltaH: null,
            note: "주의: hydrogen sulfide는 독성 가스입니다."
        };
    }

    if (
        (x.includes("hydrogen sulfide") && y.includes("sodium chloride")) ||
        (x.includes("sodium chloride") && y.includes("hydrogen sulfide"))
    ) {
        return {
            rxn: "뚜렷한 일반 반응식 없음",
            deltaH: null,
            note: "일반 조건에서 큰 반응 가능성 낮음"
        };
    }

    return null;
}

async function analyzeContainer(newChem) {
    let containers = loadContainers();
    let existing = containers[0].chemicals;
    let results = [];

    for (let c of existing) {
        if (c.chem === newChem) continue;

        let simple = simpleSafetyCheck(newChem, c.chem);

        if (simple) {
            results.push({
                pair: `${newChem} + ${c.chem}`,
                rxn: simple.rxn,
                deltaH: simple.deltaH,
                note: simple.note
            });
            continue;
        }

        let s1 = await toSmiles(newChem);
        let s2 = await toSmiles(c.chem);

        if (!s1 || !s2) {
            results.push({
                pair: `${newChem} + ${c.chem}`,
                rxn: "SMILES 변환 실패",
                deltaH: null,
                note: "PubChem에서 물질 정보를 찾지 못했습니다."
            });
            continue;
        }

        let ai = await predictReaction([s1, s2]);

        if (!ai || !ai.predictions || ai.predictions.length === 0) {
            results.push({
                pair: `${newChem} + ${c.chem}`,
                rxn: "AI 예측 결과 없음 또는 서버 응답 없음",
                deltaH: null,
                note: "서버 또는 예측 모델 응답을 확인하세요."
            });
            continue;
        }

        let rxn = ai.predictions[0].smiles;
        let parsed = parseReaction(rxn);
        let hess = await calcHess(parsed);

        results.push({
            pair: `${newChem} + ${c.chem}`,
            rxn,
            deltaH: hess.deltaH,
            note: "AI 예측 결과"
        });
    }

    return results;
}

async function analyze() {
    let chem = document.getElementById("chemicalInput").value.trim().toLowerCase();
    let volume = parseFloat(document.getElementById("volume").value);
    let concentration = parseFloat(document.getElementById("concentration").value);

    if (!chem || isNaN(volume) || isNaN(concentration)) {
        document.getElementById("result").innerHTML =
            `<div class="alert alert-danger">화학물질명, 부피, 농도를 모두 입력하세요.</div>`;
        return;
    }

    let containers = loadContainers();
    let auto = await analyzeContainer(chem);

    containers[0].chemicals.push({
        chem,
        volume,
        concentration
    });

    saveContainers(containers);

    let html = `<div class="alert alert-info">저장 완료</div>`;

    if (auto.length === 0) {
        html += `<div class="alert alert-secondary">비교할 기존 폐액이 없습니다.</div>`;
    }

    auto.forEach(r => {
        html += `
        <div class="alert alert-warning">
            <b>${r.pair}</b><br>
            반응식: ${r.rxn}<br>
            ΔH: ${r.deltaH !== null && !isNaN(r.deltaH) ? r.deltaH.toFixed(2) + " kJ/mol" : "계산 불가"}<br>
            설명: ${r.note}
        </div>`;
    });

    document.getElementById("result").innerHTML = html;
    renderContainers();
}

function showLogin() {
    document.getElementById("loginCard").classList.remove("hidden");
}

function login() {
    let pass = document.getElementById("adminPass").value;

    if (pass === "admin") {
        document.getElementById("dashboard").classList.remove("hidden");
    } else {
        alert("비밀번호가 틀렸습니다.");
    }
}

function logout() {
    document.getElementById("dashboard").classList.add("hidden");
}

window.analyze = analyze;
window.addWaste = analyze;
window.fetchSuggestions = fetchSuggestions;
window.showLogin = showLogin;
window.login = login;
window.logout = logout;
window.clearAllData = clearAllData;

renderContainers();