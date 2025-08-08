// keywordAnalysis.js

// キーワードを分析して結果を表示する関数
function analyzeKeyword(keyword, nodes, languages) {
    const results = {};
    const all_ids = [];

    // idごとに結果を用意する準備
    languages.forEach(lang => {
        if (nodes[lang]) {
            nodes[lang].forEach(entry => {
                if (entry.title.toLowerCase().includes(keyword.toLowerCase())) {
                    if (!all_ids.includes(entry.id)) {
                        all_ids.push(entry.id);
                    }
                }
            });
        }
    });

    all_ids.sort();

    // idごとに結果を用意
    all_ids.forEach(_id => {
        results[_id] = [];
        languages.forEach(lang => {
            nodes[lang].forEach(entry => {
                if (entry.id == _id) {
                    results[_id].push({
                        lang: lang,
                        title: highlightKeyword(entry.title, keyword, lang, entry.id)
                    });
                }
            });
        });
    });

    // 結果を表示
    displayResults(keyword, results, all_ids);
}

// キーワードをタイトル内でハイライトする関数
/*
function highlightKeyword(title, keyword) {
    const regex = new RegExp(`(${keyword})`, 'gi');
    return title.replace(regex, '<span class="highlight">$1</span>');
}
*/

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightKeyword(title, keyword, lang, propositionId) {
    const lowerKeyword = keyword.toLowerCase();
    const keywordEntry = keywordResults[lowerKeyword];
    if (!keywordEntry || !keywordEntry[propositionId]) return title;

    const target = keywordEntry[propositionId][lang];
    if (!target) return title;

    const regex = new RegExp(`\\b(${escapeRegExp(target)})\\b`, 'gi');
    return title.replace(regex, '<span class="highlight">$1</span>');
}

function displayResults(keyword, results, all_ids) {
    const overlay = document.createElement('div');
    overlay.id = 'resultOverlay';

    // 閉じるボタン
    const closeButton = document.createElement('button');
    closeButton.className = 'close';
    closeButton.textContent = '✖︎';
    closeButton.addEventListener('click', () => {
        document.body.removeChild(overlay);
    });
    overlay.appendChild(closeButton);

    // タイトル
    const title = document.createElement('h2');
    title.textContent = `Results for "${keyword}"`;
    overlay.appendChild(title);

    // IDごとの結果表示
    all_ids.forEach(_id => {
        const idTitle = document.createElement('h3');
        idTitle.textContent = _id;
        overlay.appendChild(idTitle);

        const resultList = document.createElement('ul');
        results[_id].forEach(result => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<strong>${result.lang}</strong>: ${result.title}`;
            resultList.appendChild(listItem);
        });
        overlay.appendChild(resultList);

        // === 評価データの表示 ===
        // 小文字化して比較して、正しいキーを取得
        const matchedKey = Object.keys(evaluationResults).find(k => k.toLowerCase() === keyword.toLowerCase());
        const evalData = matchedKey ? evaluationResults[matchedKey]?.[_id] : undefined;
        //const evalData = evaluationResults?.[keyword]?.[_id]; // keyword.toLowerCase()
        console.log(keyword)
        console.log(_id)
        console.log(evaluationResults)
        if (evalData) {
            const bar = document.createElement('div');
            bar.className = "evaluation-bar";
            const fill = document.createElement('div');
            fill.className = "evaluation-bar-fill";
            fill.style.width = `${evalData.significant_percent}%`;
            fill.textContent = `${evalData.significant_percent}%`;
            bar.appendChild(fill);
            overlay.appendChild(bar);

            const toggleBtn = document.createElement('button');
            toggleBtn.className = "toggle-button";
            toggleBtn.textContent = "Show Evaluation Reason";

            const reasonBox = document.createElement('div');
            reasonBox.className = "reason-text";
            reasonBox.innerHTML = `
                <strong>Minor:</strong> ${evalData.minor_reason}<br>
                <strong>Significant:</strong> ${evalData.significant_reason}
            `;

            toggleBtn.addEventListener("click", () => {
                const show = reasonBox.style.display === "none";
                reasonBox.style.display = show ? "block" : "none";
                toggleBtn.textContent = show ? "Hide Evaluation Reason" : "Show Evaluation Reason";
            });

            overlay.appendChild(toggleBtn);
            overlay.appendChild(reasonBox);
        }
    });

    document.body.appendChild(overlay);
}

let keywordResults = {}; // keyword → proposition list

fetch("output_grouped.json")
    .then(response => response.json())
    .then(data => {
        data.forEach(item => {
            const keyword = Object.keys(item)[0];
            keywordResults[keyword.toLowerCase()] = item[keyword];
        });

        // 下線の処理
        document.querySelectorAll('.clickable').forEach(el => {
            const k = el.innerText.toLowerCase();
            if (keywordResults[k]) {
                el.classList.add("has-result");
            }
        });
    });

let evaluationResults = {}; // keyword → proposition → evaluation json

fetch("translation_analysis_result.json")
    .then(response => response.json())
    .then(data => {
        for (const keyword in data) {
            for (const pid in data[keyword]) {
                if (!evaluationResults[keyword]) {
                    evaluationResults[keyword] = {};
                }
                evaluationResults[keyword][pid] = data[keyword][pid];
            }
        }
    });

// キーワードクリック時のイベント設定
function setupKeywordAnalysis(nodes, languages) {
    document.querySelectorAll('.clickable').forEach(wordElement => {
        wordElement.addEventListener('click', () => {
            const keyword = wordElement.innerText;
            analyzeKeyword(keyword, nodes, languages);
        });
    });
}
