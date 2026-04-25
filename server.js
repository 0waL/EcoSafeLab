const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/* =============================
   화학 DB
============================= */
const db = {
    "hydrochloric acid": { formula: "HCl", type: ["acid"] },
    "hcl": { formula: "HCl", type: ["acid"] },

    "sodium hydroxide": { formula: "NaOH", type: ["base"] },
    "naoh": { formula: "NaOH", type: ["base"] },

    "sodium chloride": { formula: "NaCl", type: ["salt"] },
    "nacl": { formula: "NaCl", type: ["salt"] },

    "sodium carbonate": { formula: "Na2CO3", type: ["carbonate","base"] },
    "na2co3": { formula: "Na2CO3", type: ["carbonate","base"] },

    "hydrogen sulfide": { formula: "H2S", type: ["sulfide","toxic"] },
    "h2s": { formula: "H2S", type: ["sulfide","toxic"] },

    "hydrogen peroxide": { formula: "H2O2", type: ["oxidizer"] },
    "h2o2": { formula: "H2O2", type: ["oxidizer"] },

    "ethanol": { formula: "C2H5OH", type: ["organic","flammable"] },
    "c2h5oh": { formula: "C2H5OH", type: ["organic","flammable"] }
};

function normalize(name){
    return db[name.toLowerCase()] || {
        formula: name,
        type: ["unknown"]
    };
}

function has(x,t){ return x.type.includes(t); }

/* =============================
   룰 엔진
============================= */
function react(a,b){

    let A = normalize(a);
    let B = normalize(b);

    if(has(A,"acid") && has(B,"base") || has(A,"base") && has(B,"acid")){
        return { risk:"보통", reaction:"중화 반응", danger:"발열" };
    }

    if(has(A,"acid") && has(B,"carbonate")){
        return { risk:"높음", reaction:"CO2 발생", danger:"압력 상승" };
    }

    if(has(A,"acid") && has(B,"sulfide")){
        return { risk:"매우 높음", reaction:"H2S 발생", danger:"독성 가스" };
    }

    if(has(A,"oxidizer") && has(B,"organic")){
        return { risk:"매우 높음", reaction:"산화 반응", danger:"화재/폭발" };
    }

    return { risk:"낮음", reaction:"특이 반응 없음", danger:"" };
}

/* =============================
   API
============================= */
app.post("/analyze",(req,res)=>{

    let {chemicals} = req.body;
    let results=[];

    for(let i=0;i<chemicals.length;i++){
        for(let j=i+1;j<chemicals.length;j++){

            let r = react(chemicals[i],chemicals[j]);

            results.push({
                pair: `${chemicals[i]} + ${chemicals[j]}`,
                ...r
            });
        }
    }

    res.json(results);
});

app.listen(3000,()=>console.log("SERVER RUNNING"));