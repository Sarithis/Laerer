`use strict`;


$(document).ready(() => {
    const jq = {
        addWordBtn: $(`#addWordBtn`),
        wordTable: $(`#wordTable`),
        wordTableTbody: $(`#wordTable tbody`)
    };

    const f = {
        editWord: (jqTr) => {

        },
        getLastWordIndex: () => {
            try{
                if (jq.wordTableTbody.find(`tr`).length > 0){
                    console.log(jq.wordTableTbody.find(`tr`).last().find(`th[cname="index"]`));
                    return parseInt(jq.wordTableTbody.find(`tr`).last().find(`th[cname="index"]`).text());
                } else {
                    return 0; //First word in the table
                }
            } catch (error) {
                throw `Failed to find the last word index`;
            }
        },
        addWordToTableFromObj: (wordObj) => {
            const jqNewWord = $(`
                <tr data-id="${wordObj._id}">
                    <th scope="row" cname="index">${f.getLastWordIndex() + 1}</th>
                    <td cname="article" class="editable">${wordObj.article}</td>
                    <td cname="word" class="editable">${wordObj.word}</td>
                    <td cname="articleTranslation" class="editable">${wordObj.articleTranslation}</td>
                    <td cname="translation" class="editable">${wordObj.translation}</td>
                    <td cname="score">${wordObj.score}</td>
                </tr>
            `);
            jq.wordTableTbody.append(jqNewWord);
            return jqNewWord;
        },
        buildWordObjFromJq: (jqTr) => {
            const result = {};
            jqTr.find(`td`).toArray().forEach((tr) => {
                result[$(tr).attr(`cname`)] = $(tr).text();
            });
            return result;
        }
    };

    WORDS.forEach((wordObj) => {
        f.addWordToTableFromObj(wordObj);
    });

    jq.addWordBtn.click(async () => {
        try{
            const newWordObj = {
                word: ``,
                article: ``,
                articleTranslation: ``,
                translation: ``
            };
            const jqAddedWord = f.addWordToTableFromObj(newWordObj);
            const response = await api.word.add(newWordObj);
            if (!response.status){
                throw(`Oops, something went wrong!`);
                console.log(response);
            }
        } catch (error) {
            handleError(error);
        }
    });
});
