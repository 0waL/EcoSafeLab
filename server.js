const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

/* ===================================================
   화학물질 DB
=================================================== */
const chemDB = {
    // 산 (Acid)
    "hydrochloric acid": { formula: "HCl",     types: ["acid","strong_acid"],          mw: 36.46,  dhf: -167.2  },
    "hcl":               { formula: "HCl",     types: ["acid","strong_acid"],          mw: 36.46,  dhf: -167.2  },
    "sulfuric acid":     { formula: "H2SO4",   types: ["acid","strong_acid","oxidizer"], mw: 98.08, dhf: -814.0  },
    "h2so4":             { formula: "H2SO4",   types: ["acid","strong_acid","oxidizer"], mw: 98.08, dhf: -814.0  },
    "nitric acid":       { formula: "HNO3",    types: ["acid","strong_acid","oxidizer"], mw: 63.01, dhf: -207.4  },
    "hno3":              { formula: "HNO3",    types: ["acid","strong_acid","oxidizer"], mw: 63.01, dhf: -207.4  },
    "acetic acid":       { formula: "CH3COOH", types: ["acid","weak_acid","organic"],   mw: 60.05,  dhf: -484.5  },
    "ch3cooh":           { formula: "CH3COOH", types: ["acid","weak_acid","organic"],   mw: 60.05,  dhf: -484.5  },
    "phosphoric acid":   { formula: "H3PO4",   types: ["acid","weak_acid"],            mw: 98.00,  dhf: -1288.3 },
    "h3po4":             { formula: "H3PO4",   types: ["acid","weak_acid"],            mw: 98.00,  dhf: -1288.3 },
    "hydrofluoric acid": { formula: "HF",      types: ["acid","weak_acid","toxic"],    mw: 20.01,  dhf: -332.6  },
    "hf":                { formula: "HF",      types: ["acid","weak_acid","toxic"],    mw: 20.01,  dhf: -332.6  },
    "formic acid":       { formula: "HCOOH",   types: ["acid","weak_acid","organic"],  mw: 46.03,  dhf: -424.7  },

    // 염기 (Base)
    "sodium hydroxide":   { formula: "NaOH",     types: ["base","strong_base"],   mw: 40.00,  dhf: -470.1  },
    "naoh":               { formula: "NaOH",     types: ["base","strong_base"],   mw: 40.00,  dhf: -470.1  },
    "potassium hydroxide":{ formula: "KOH",      types: ["base","strong_base"],   mw: 56.11,  dhf: -424.8  },
    "koh":                { formula: "KOH",      types: ["base","strong_base"],   mw: 56.11,  dhf: -424.8  },
    "calcium hydroxide":  { formula: "Ca(OH)2",  types: ["base","strong_base"],   mw: 74.09,  dhf: -986.1  },
    "ca(oh)2":            { formula: "Ca(OH)2",  types: ["base","strong_base"],   mw: 74.09,  dhf: -986.1  },
    "ammonia":            { formula: "NH3",      types: ["base","weak_base","toxic"], mw: 17.03, dhf: -46.1  },
    "nh3":                { formula: "NH3",      types: ["base","weak_base","toxic"], mw: 17.03, dhf: -46.1  },
    "sodium carbonate":    { formula: "Na2CO3",  types: ["base","carbonate","inorganic"], mw: 105.99, dhf: -1130.7 },
    "na2co3":              { formula: "Na2CO3",  types: ["base","carbonate","inorganic"], mw: 105.99, dhf: -1130.7 },
    "calcium carbonate":   { formula: "CaCO3",   types: ["salt","carbonate","inorganic"], mw: 100.09, dhf: -1206.9 },
    "caco3":               { formula: "CaCO3",   types: ["salt","carbonate","inorganic"], mw: 100.09, dhf: -1206.9 },

    // 유기 (Organic)
    "ethanol":       { formula: "C2H5OH",    types: ["organic","flammable"],         mw: 46.07,  dhf: -277.7 },
    "methanol":      { formula: "CH3OH",     types: ["organic","flammable","toxic"], mw: 32.04,  dhf: -238.7 },
    "acetone":       { formula: "C3H6O",     types: ["organic","flammable"],         mw: 58.08,  dhf: -248.4 },
    "benzene":       { formula: "C6H6",      types: ["organic","flammable","toxic"], mw: 78.11,  dhf: 49.0   },
    "toluene":       { formula: "C7H8",      types: ["organic","flammable","toxic"], mw: 92.14,  dhf: 12.4   },
    "diethyl ether": { formula: "(C2H5)2O",  types: ["organic","flammable"],         mw: 74.12,  dhf: -279.6 },
    "ether":         { formula: "(C2H5)2O",  types: ["organic","flammable"],         mw: 74.12,  dhf: -279.6 },
    "chloroform":    { formula: "CHCl3",     types: ["organic","toxic"],             mw: 119.37, dhf: -134.5 },
    "hexane":        { formula: "C6H14",     types: ["organic","flammable"],         mw: 86.18,  dhf: -198.7 },
    "dichloromethane":{ formula: "CH2Cl2",   types: ["organic","toxic"],             mw: 84.93,  dhf: -124.2 },
    "dcm":           { formula: "CH2Cl2",    types: ["organic","toxic"],             mw: 84.93,  dhf: -124.2 },

    // 무기 (Inorganic / Salt)
    "sodium chloride":      { formula: "NaCl",   types: ["salt","inorganic"],               mw: 58.44,  dhf: -411.2  },
    "nacl":                 { formula: "NaCl",   types: ["salt","inorganic"],               mw: 58.44,  dhf: -411.2  },
    "sodium bicarbonate":   { formula: "NaHCO3", types: ["salt","carbonate","inorganic"],   mw: 84.01,  dhf: -950.8  },
    "nahco3":               { formula: "NaHCO3", types: ["salt","carbonate","inorganic"],   mw: 84.01,  dhf: -950.8  },
    "sodium hypochlorite":  { formula: "NaOCl",  types: ["salt","oxidizer","inorganic","bleach"], mw: 74.44, dhf: -347.1 },
    "naocl":                { formula: "NaOCl",  types: ["salt","oxidizer","inorganic","bleach"], mw: 74.44, dhf: -347.1 },
    "bleach":               { formula: "NaOCl",  types: ["salt","oxidizer","inorganic","bleach"], mw: 74.44, dhf: -347.1 },
    "hydrogen peroxide":    { formula: "H2O2",   types: ["oxidizer","inorganic"],           mw: 34.01,  dhf: -187.8  },
    "h2o2":                 { formula: "H2O2",   types: ["oxidizer","inorganic"],           mw: 34.01,  dhf: -187.8  },
    "hydrogen sulfide":     { formula: "H2S",    types: ["sulfide","toxic","inorganic"],    mw: 34.08,  dhf: -20.6   },
    "h2s":                  { formula: "H2S",    types: ["sulfide","toxic","inorganic"],    mw: 34.08,  dhf: -20.6   },
    "potassium permanganate":{ formula: "KMnO4", types: ["oxidizer","inorganic"],           mw: 158.03, dhf: -837.2  },
    "kmno4":                { formula: "KMnO4",  types: ["oxidizer","inorganic"],           mw: 158.03, dhf: -837.2  },
    "ammonium chloride":    { formula: "NH4Cl",  types: ["salt","ammonium","inorganic"],    mw: 53.49,  dhf: -314.4  },
    "nh4cl":                { formula: "NH4Cl",  types: ["salt","ammonium","inorganic"],    mw: 53.49,  dhf: -314.4  },
    "copper sulfate":       { formula: "CuSO4",  types: ["salt","inorganic"],               mw: 159.61, dhf: -771.4  },
    "cuso4":                { formula: "CuSO4",  types: ["salt","inorganic"],               mw: 159.61, dhf: -771.4  },
};

function lookupChem(name) {
    return chemDB[name.toLowerCase().trim()] || null;
}

function has(chem, t) { return chem.types.includes(t); }

function getContainerType(chem) {
    if (has(chem, "strong_acid") || (has(chem, "weak_acid") && !has(chem, "organic"))) return "산";
    if (has(chem, "strong_base") || has(chem, "weak_base")) return "염기";
    if (has(chem, "base") && !has(chem, "acid")) return "염기";
    if (has(chem, "organic")) return "유기";
    return "무기";
}

/* ===================================================
   발생 기체 특성 DB
=================================================== */
const gasDB = {
    "H₂S": {
        fullName:       "황화수소 (Hydrogen Sulfide, H₂S)",
        color:          "무색",
        odor:           "썩은 달걀 냄새",
        odorThresholdPpm: 0.0005,
        densityVsAir:   1.19,
        heavierThanAir: true,
        tlvTwa:         1,       // ppm
        tlvStel:        5,       // ppm
        dangerousPpm:   300,
        fatalPpm:       1000,
        hazardLevel:    "맹독 (즉사 위험)",
        note:           "고농도에서 후각이 마비되어 감지 불가. 공기보다 무거워 바닥에 축적.",
        action:         "즉시 대피 · 방독마스크(ABEK급) 착용 · 119 신고"
    },
    "CO₂": {
        fullName:       "이산화탄소 (Carbon Dioxide, CO₂)",
        color:          "무색",
        odor:           "무취",
        odorThresholdPpm: null,
        densityVsAir:   1.52,
        heavierThanAir: true,
        tlvTwa:         5000,
        tlvStel:        30000,
        dangerousPpm:   40000,
        fatalPpm:       100000,
        hazardLevel:    "질식 위험",
        note:           "공기보다 무거워 바닥에 축적. 밀폐 공간에서 산소 농도 감소.",
        action:         "환기 확보 · 밀폐 용기 압력 주의 · 저지대 출입 금지"
    },
    "Cl₂": {
        fullName:       "염소 (Chlorine, Cl₂)",
        color:          "황록색",
        odor:           "강한 자극성 냄새 (수영장 냄새)",
        odorThresholdPpm: 0.5,
        densityVsAir:   2.47,
        heavierThanAir: true,
        tlvTwa:         0.5,
        tlvStel:        1,
        dangerousPpm:   10,
        fatalPpm:       430,
        hazardLevel:    "독성 (폐 손상)",
        note:           "황록색으로 육안 식별 가능. 공기보다 2.5배 무거워 바닥 축적. 호흡기 점막 손상.",
        action:         "즉시 대피 · 바람 위쪽으로 이동 · 방독마스크 착용 · 119 신고"
    },
    "NH₃": {
        fullName:       "암모니아 (Ammonia, NH₃)",
        color:          "무색",
        odor:           "강한 자극성 냄새",
        odorThresholdPpm: 5,
        densityVsAir:   0.59,
        heavierThanAir: false,
        tlvTwa:         25,
        tlvStel:        35,
        dangerousPpm:   300,
        fatalPpm:       2000,
        hazardLevel:    "자극·독성",
        note:           "공기보다 가벼워 위로 확산. 수용성 높음. 눈·피부·호흡기 자극.",
        action:         "환기 확보 · 눈·피부 즉시 수세 · 대량 흡입 시 119 신고"
    },
    "O₂": {
        fullName:       "산소 (Oxygen, O₂)",
        color:          "무색",
        odor:           "무취",
        odorThresholdPpm: null,
        densityVsAir:   1.11,
        heavierThanAir: false,
        tlvTwa:         null,
        tlvStel:        null,
        dangerousPpm:   null,
        fatalPpm:       null,
        hazardLevel:    "산화 (연소 가속)",
        note:           "산화제로 가연성 물질의 연소를 급격히 가속.",
        action:         "화기 즉시 제거 · 가연성 물질과 격리"
    }
};

function getGasKey(gasStr) {
    if (!gasStr) return null;
    if (gasStr.includes("H₂S")) return "H₂S";
    if (gasStr.includes("CO₂")) return "CO₂";
    if (gasStr.includes("Cl₂")) return "Cl₂";
    if (gasStr.includes("NH₃")) return "NH₃";
    if (gasStr.includes("O₂")) return "O₂";
    return null;
}

/* ===================================================
   반응 분석 엔진
=================================================== */
const T_STD = 298.15; // K (25°C 표준 상태)

// ΔG = ΔH - T·ΔS  (ΔH: kJ/mol, ΔS: J/(mol·K) → 변환 후 계산)
function calcDeltaG(dH, dS) {
    if (dH === null || dS === null) return null;
    return parseFloat((dH - T_STD * (dS / 1000)).toFixed(2));
}

function analyzeReaction(a, b) {
    const reactions = [];

    // 산 + 염기 → 중화
    if ((has(a,"acid") && has(b,"base")) || (has(a,"base") && has(b,"acid"))) {
        const acid = has(a,"acid") ? a : b;
        const base = has(a,"base") ? a : b;
        const isStrong = has(acid,"strong_acid") && has(base,"strong_base");
        const dH = isStrong ? -57.3 : -55.2; // kJ/mol
        const dS = -80;                       // J/(mol·K) — 이온 결합으로 엔트로피 감소
        reactions.push({
            reactionType: "중화 반응",
            equation:     `${acid.formula} + ${base.formula} → 염 + H₂O`,
            deltaH:       dH,
            deltaS:       dS,
            deltaG:       calcDeltaG(dH, dS),
            heatFlow:     "발열 (열 방출)",
            gasProduced:  null,
            risk:         "보통",
            warning:      `발열 반응 (ΔH = ${dH} kJ/mol). 급격한 혼합 시 온도 상승에 주의하세요.`,
            dangerous:    false
        });
    }

    // 산 + 탄산염 → CO₂ 발생
    if ((has(a,"acid") && has(b,"carbonate")) || (has(a,"carbonate") && has(b,"acid"))) {
        const carb = has(a,"carbonate") ? a : b;
        const dH = -35.0; // kJ/mol  (2HCl + Na2CO3 기준)
        const dS = 165;   // J/(mol·K) — 기체 생성으로 엔트로피 크게 증가
        reactions.push({
            reactionType: "CO₂ 발생 반응",
            equation:     `2산 + ${carb.formula} → 염 + H₂O + CO₂↑`,
            deltaH:       dH,
            deltaS:       dS,
            deltaG:       calcDeltaG(dH, dS),
            heatFlow:     "발열",
            gasProduced:  "CO₂",
            risk:         "높음",
            warning:      "CO₂ 기체 발생! 밀폐 용기에서 압력이 상승할 수 있습니다.",
            dangerous:    true
        });
    }

    // 산 + 황화물 → H₂S (맹독성)
    if ((has(a,"acid") && has(b,"sulfide")) || (has(a,"sulfide") && has(b,"acid"))) {
        const dH = -54.0; // kJ/mol  (2HCl + Na2S → 2NaCl + H2S 기준)
        const dS = 120;   // J/(mol·K)
        reactions.push({
            reactionType: "독성 가스 발생",
            equation:     "2산 + 황화물 → 염 + H₂S↑",
            deltaH:       dH,
            deltaS:       dS,
            deltaG:       calcDeltaG(dH, dS),
            heatFlow:     "발열",
            gasProduced:  "H₂S",
            risk:         "매우 높음",
            warning:      "⚠️ 맹독성 H₂S 가스 발생! 즉시 대피하고 관리자에게 알리세요!",
            dangerous:    true
        });
    }

    // 산 + 차아염소산염(표백제) → Cl₂
    if ((has(a,"acid") && has(b,"bleach")) || (has(a,"bleach") && has(b,"acid"))) {
        const dH = -15.5; // kJ/mol  (2HCl + NaOCl → NaCl + H2O + Cl2 기준 Hess 계산)
        const dS = 110;   // J/(mol·K)
        reactions.push({
            reactionType: "독성 가스 발생",
            equation:     "2HCl + NaOCl → NaCl + H₂O + Cl₂↑",
            deltaH:       dH,
            deltaS:       dS,
            deltaG:       calcDeltaG(dH, dS),
            heatFlow:     "발열",
            gasProduced:  "Cl₂",
            risk:         "매우 높음",
            warning:      "⚠️ 독성 염소(Cl₂) 가스 발생! 절대 혼합하지 마세요!",
            dangerous:    true
        });
    }

    // 산화제 + 유기물 → 화재/폭발
    if ((has(a,"oxidizer") && has(b,"organic")) || (has(a,"organic") && has(b,"oxidizer"))) {
        reactions.push({
            reactionType: "산화 반응 (화재/폭발 위험)",
            equation:     "산화제 + 유기물 → 산화 반응 생성물",
            deltaH:       null, // 유기물 종류에 따라 매우 상이
            deltaS:       200,  // J/(mol·K) — 연소 생성물(기체) 다량 생성
            deltaG:       null,
            heatFlow:     "강한 발열",
            gasProduced:  "CO₂",
            risk:         "매우 높음",
            warning:      "⚠️ 화재·폭발 위험! 산화제와 유기물을 절대 혼합하지 마세요!",
            dangerous:    true
        });
    }

    // 강염기 + 암모늄염 → NH₃ 발생
    if ((has(a,"strong_base") && has(b,"ammonium")) || (has(a,"ammonium") && has(b,"strong_base"))) {
        // NaOH(aq) + NH4Cl(aq) → NaCl(aq) + H2O + NH3(g)
        // 염기 중화(발열) + NH3 기화(흡열) → 전체 약한 흡열
        const dH = 3.0;  // kJ/mol
        const dS = 160;  // J/(mol·K) — 기체 생성
        reactions.push({
            reactionType: "NH₃ 발생 반응",
            equation:     "NaOH + NH₄Cl → NaCl + H₂O + NH₃↑",
            deltaH:       dH,
            deltaS:       dS,
            deltaG:       calcDeltaG(dH, dS),
            heatFlow:     "약한 흡열 (엔트로피 주도 자발 반응)",
            gasProduced:  "NH₃",
            risk:         "높음",
            warning:      "암모니아(NH₃) 가스 발생! 환기를 확보하세요.",
            dangerous:    true
        });
    }

    // 과산화수소 + 유기물
    if ((a.formula === "H2O2" && has(b,"organic")) || (b.formula === "H2O2" && has(a,"organic"))) {
        const dH = -100.0; // kJ/mol (대략적 추정)
        const dS = 100;
        reactions.push({
            reactionType: "과산화 산화 반응",
            equation:     "H₂O₂ + 유기물 → 산화 반응",
            deltaH:       dH,
            deltaS:       dS,
            deltaG:       calcDeltaG(dH, dS),
            heatFlow:     "발열",
            gasProduced:  "O₂",
            risk:         "높음",
            warning:      "과산화수소와 유기물 혼합 시 폭발적 산화 반응 위험!",
            dangerous:    true
        });
    }

    return reactions.length > 0 ? reactions : [{
        reactionType: "무반응",
        equation:     "특이 반응 없음",
        deltaH:       0,
        deltaS:       0,
        deltaG:       0,
        heatFlow:     "없음",
        gasProduced:  null,
        risk:         "낮음",
        warning:      "",
        dangerous:    false
    }];
}

/* ===================================================
   ΔT 계산 (희석 수용액 가정, 비열 4.184 J/g·K)
=================================================== */
function calcDeltaT(dH_kJpermol, nLimiting_mol, totalVol_mL) {
    if (dH_kJpermol === null || nLimiting_mol === null || totalVol_mL <= 0) return null;
    const heatJ    = Math.abs(dH_kJpermol * 1000) * nLimiting_mol;
    const massG    = totalVol_mL * 1.0; // 희석 수용액 ≈ 1 g/mL
    return parseFloat((heatJ / (massG * 4.184)).toFixed(2));
}

/* ===================================================
   관리자 알림 저장소 (인메모리)
=================================================== */
let adminAlerts = [];

/* ===================================================
   API 엔드포인트
=================================================== */

// 화학물질 분류
app.post("/classify", (req, res) => {
    const chem = lookupChem(req.body.name || "");
    if (!chem) return res.json({ found: false });
    res.json({
        found: true,
        formula: chem.formula,
        types: chem.types,
        containerType: getContainerType(chem),
        mw: chem.mw
    });
});

// 반응 분석 (새 물질 + 기존 목록)
// newChem: { name, volume(mL), conc(%) }  또는 string(하위 호환)
// existing: [{ name, volume, conc }]      또는 string[]
app.post("/check-reaction", (req, res) => {
    const { newChem, existing = [] } = req.body;

    const newName = typeof newChem === "string" ? newChem : newChem.name;
    const newVol  = typeof newChem === "object" ? Number(newChem.volume) : null;
    const newConc = typeof newChem === "object" ? Number(newChem.conc)   : null;

    const a = lookupChem(newName);
    if (!a) return res.json({ error: `알 수 없는 물질: ${newName}`, results: [], containerType: "미분류" });

    const results = [];

    for (const item of existing) {
        const existName = typeof item === "string" ? item : item.name;
        const existVol  = typeof item === "object" ? Number(item.volume) : null;
        const existConc = typeof item === "object" ? Number(item.conc)   : null;

        const b = lookupChem(existName);
        if (!b) continue;

        const rxns = analyzeReaction(a, b);
        for (const rxn of rxns) {
            if (rxn.reactionType === "무반응") continue;

            // ΔT 계산 (부피·농도 데이터가 있을 때만)
            let deltaT = null;
            if (newVol && newConc !== null && existVol && existConc !== null && rxn.deltaH !== null) {
                const nA = (newVol  * (newConc  / 100)) / a.mw;
                const nB = (existVol * (existConc / 100)) / b.mw;
                deltaT = calcDeltaT(rxn.deltaH, Math.min(nA, nB), newVol + existVol);
            }

            // 기체 특성 조회
            const gasKey  = getGasKey(rxn.gasProduced);
            const gasInfo = gasKey ? gasDB[gasKey] : null;

            results.push({
                pair:    `${a.formula} + ${b.formula}`,
                chemA:   newName,
                chemB:   existName,
                ...rxn,
                deltaT,
                gasInfo
            });
        }
    }

    // 위험 반응 → 관리자 알림 저장
    const dangerous = results.filter(r => r.dangerous);
    if (dangerous.length > 0) {
        adminAlerts.push({
            id:        Date.now(),
            timestamp: new Date().toISOString(),
            newChem:   `${a.formula} (${newName})`,
            alerts:    dangerous.map(r => ({
                pair:         r.pair,
                reactionType: r.reactionType,
                gasProduced:  r.gasProduced,
                risk:         r.risk,
                warning:      r.warning
            }))
        });
    }

    res.json({ results, containerType: getContainerType(a) });
});

// 관리자 알림 조회
app.get("/admin/alerts", (req, res) => res.json(adminAlerts));

// 관리자 알림 초기화
app.delete("/admin/alerts", (req, res) => {
    adminAlerts = [];
    res.json({ ok: true });
});

app.listen(3000, () => console.log("서버 실행 중: http://localhost:3000"));
