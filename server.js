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
    "sodium carbonate":   { formula: "Na2CO3",   types: ["base","carbonate","inorganic"], mw: 105.99, dhf: -1130.7 },
    "na2co3":             { formula: "Na2CO3",   types: ["base","carbonate","inorganic"], mw: 105.99, dhf: -1130.7 },

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
   반응 분석 엔진
=================================================== */
// Formation enthalpy of common products (kJ/mol)
const productDhf = {
    "H2O": -285.83,
    "NaCl": -411.2,
    "KCl": -436.7,
    "CO2": -393.5,
    "H2S": -20.6,
    "NH3": -46.1,
    "Cl2": 0,
};

function analyzeReaction(a, b) {
    const reactions = [];

    // 강산 + 강염기 → 중화 (HCl + NaOH 기준 ΔH = -57.3 kJ/mol)
    if ((has(a,"acid") && has(b,"base")) || (has(a,"base") && has(b,"acid"))) {
        const acid = has(a,"acid") ? a : b;
        const base = has(a,"base") ? a : b;
        // Hess의 법칙으로 ΔH 계산 (산 + 염기 → 염 + H2O)
        // ΔH = ΔHf(H2O) - ΔHf(acid) - ΔHf(base)  (간략화)
        let dH = productDhf["H2O"] - acid.dhf - base.dhf;
        // 중화 표준값(강산-강염기 기준) 사용
        const isStrong = has(acid,"strong_acid") && has(base,"strong_base");
        dH = isStrong ? -57.3 : -55.0 + (acid.dhf + base.dhf) * 0.0001;

        reactions.push({
            reactionType: "중화 반응",
            equation:     `${acid.formula} + ${base.formula} → 염 + H₂O`,
            deltaH:       parseFloat(dH.toFixed(2)),
            heatFlow:     dH < 0 ? "발열 (열 방출)" : "흡열 (열 흡수)",
            gasProduced:  null,
            risk:         "보통",
            warning:      `발열 반응 (ΔH = ${dH.toFixed(1)} kJ/mol). 급격한 혼합 시 온도 상승에 주의하세요.`,
            dangerous:    false
        });
    }

    // 산 + 탄산염 → CO2 발생
    if ((has(a,"acid") && has(b,"carbonate")) || (has(a,"carbonate") && has(b,"acid"))) {
        const carb = has(a,"carbonate") ? a : b;
        // 2HCl + Na2CO3 → 2NaCl + H2O + CO2  기준 ΔH ≈ -35 kJ/mol
        const dH = -35.0;
        reactions.push({
            reactionType: "CO₂ 발생 반응",
            equation:     `2산 + ${carb.formula} → 염 + H₂O + CO₂↑`,
            deltaH:       dH,
            heatFlow:     "발열",
            gasProduced:  "CO₂",
            risk:         "높음",
            warning:      "CO₂ 기체 발생! 밀폐 용기에서 압력이 상승할 수 있습니다.",
            dangerous:    true
        });
    }

    // 산 + 황화물 → H2S (맹독성)
    if ((has(a,"acid") && has(b,"sulfide")) || (has(a,"sulfide") && has(b,"acid"))) {
        reactions.push({
            reactionType: "독성 가스 발생",
            equation:     "산 + 황화물 → 염 + H₂S↑",
            deltaH:       null,
            heatFlow:     "미계산",
            gasProduced:  "H₂S (맹독성)",
            risk:         "매우 높음",
            warning:      "⚠️ 맹독성 H₂S 가스 발생! 즉시 대피하고 관리자에게 알리세요!",
            dangerous:    true
        });
    }

    // 산 + 차아염소산나트륨(표백제) → Cl2 (독성)
    if ((has(a,"acid") && has(b,"bleach")) || (has(a,"bleach") && has(b,"acid"))) {
        reactions.push({
            reactionType: "독성 가스 발생",
            equation:     "2HCl + NaOCl → NaCl + H₂O + Cl₂↑",
            deltaH:       null,
            heatFlow:     "미계산",
            gasProduced:  "Cl₂ (독성)",
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
            deltaH:       null,
            heatFlow:     "강한 발열",
            gasProduced:  "CO₂, H₂O (연소)",
            risk:         "매우 높음",
            warning:      "⚠️ 화재·폭발 위험! 산화제와 유기물을 절대 혼합하지 마세요!",
            dangerous:    true
        });
    }

    // 강염기 + 암모늄염 → NH3 발생
    if ((has(a,"strong_base") && has(b,"ammonium")) || (has(a,"ammonium") && has(b,"strong_base"))) {
        const dH = productDhf["NH3"] + productDhf["H2O"] - chemDB["naoh"].dhf - chemDB["nh4cl"].dhf;
        reactions.push({
            reactionType: "NH₃ 발생 반응",
            equation:     "NaOH + NH₄Cl → NaCl + H₂O + NH₃↑",
            deltaH:       parseFloat(dH.toFixed(2)),
            heatFlow:     "발열",
            gasProduced:  "NH₃ (자극성)",
            risk:         "높음",
            warning:      "암모니아(NH₃) 가스 발생! 환기를 확보하세요.",
            dangerous:    true
        });
    }

    // 과산화수소 + 유기물
    if ((a.formula === "H2O2" && has(b,"organic")) || (b.formula === "H2O2" && has(a,"organic"))) {
        reactions.push({
            reactionType: "과산화 산화 반응",
            equation:     "H₂O₂ + 유기물 → 산화 반응",
            deltaH:       null,
            heatFlow:     "발열",
            gasProduced:  "O₂ (가속 연소)",
            risk:         "높음",
            warning:      "과산화수소와 유기물 혼합 시 폭발적 산화 반응 위험!",
            dangerous:    true
        });
    }

    return reactions.length > 0 ? reactions : [{
        reactionType: "무반응",
        equation:     "특이 반응 없음",
        deltaH:       0,
        heatFlow:     "없음",
        gasProduced:  null,
        risk:         "낮음",
        warning:      "",
        dangerous:    false
    }];
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
app.post("/check-reaction", (req, res) => {
    const { newChem, existing = [] } = req.body;
    const a = lookupChem(newChem);
    if (!a) return res.json({ error: `알 수 없는 물질: ${newChem}`, results: [], containerType: "미분류" });

    const results = [];

    for (const name of existing) {
        const b = lookupChem(name);
        if (!b) continue;

        const rxns = analyzeReaction(a, b);
        for (const r of rxns) {
            if (r.reactionType !== "무반응") {
                results.push({
                    pair:    `${a.formula} + ${b.formula}`,
                    chemA:   newChem,
                    chemB:   name,
                    ...r
                });
            }
        }
    }

    // 위험 반응 발생 시 관리자 알림 저장
    const dangerous = results.filter(r => r.dangerous);
    if (dangerous.length > 0) {
        adminAlerts.push({
            id:        Date.now(),
            timestamp: new Date().toISOString(),
            newChem:   `${a.formula} (${newChem})`,
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
