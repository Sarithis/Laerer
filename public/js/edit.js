`use strict`;


$(document).ready(() => {
    const jq = {
        addWordBtn: $(`#addWordBtn`),
        wordTable: $(`#wordTable`),
        wordTableTbody: $(`#wordTable tbody`),
    };

    const f = {
        editWordDom: (jqTr) => {
            jqTr.find(`td.editable`).each((index, td) => {
                $(td).html(`<input type="text" class="form-control" style="max-width: ${$(td).width()}; min-width: ${$(td).width()}" value="${$(td).text()}"></input>`);
            });
            jqTr.find(`td:first`).find(`input`).focus();
            const jqButton = jqTr.find(`button[cname="edit"]`);
            jqButton.removeClass(`btn-primary`).addClass(`btn-success`);
            jqButton.attr(`cname`, `save`);
            jqButton.text(`Save`);
        },
        saveWordDom: (jqTr) => {
            jqTr.find(`td.editable`).each((index, td) => {
                $(td).html($(td).find(`input`).val());
            });
            const jqButton = jqTr.find(`button[cname="save"]`);
            jqButton.removeClass(`btn-success`).addClass(`btn-primary`);
            jqButton.attr(`cname`, `edit`);
            jqButton.text(`Edit`);
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
                    <td cname="article" class="editable saveable">${wordObj.article}</td>
                    <td cname="word" class="editable saveable">${wordObj.word}</td>
                    <td cname="articleTranslation" class="editable saveable">${wordObj.articleTranslation}</td>
                    <td cname="translation" class="editable saveable">${wordObj.translation}</td>
                    <td cname="score">${wordObj.score}</td>
                    <td cname="action">
                        <button class="btn btn-small btn-primary actionButton" cname="edit">Edit</button>
                        <button class="btn btn-small btn-danger actionButton" cname="delete">Delete</button>
                    </td>
                </tr>
            `);
            jq.wordTableTbody.append(jqNewWord);
            return jqNewWord;
        },
        buildWordObjFromJq: (jqTr) => {
            const result = {};
            jqTr.find(`td.saveable`).toArray().forEach((tr) => {
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
            $(this).attr(`disabled`, true);
            const newWordObj = {
                word: ``,
                article: ``,
                articleTranslation: ``,
                translation: ``
            };
            const response = await api.word.add(newWordObj);
            if (!response.status){
                throw(`Oops, something went wrong!`);
            }
            const jqAddedWord = f.addWordToTableFromObj(response.data);
            f.editWordDom(jqAddedWord);
            $(this).attr(`disabled`, false);
        } catch (error) {
            $(this).attr(`disabled`, false);
            handleError(error);
        }
    });

    jq.wordTableTbody.on(`click`, `.actionButton[cname="delete"]`, async function (event) {
        event.stopPropagation();
        try{
            const jqTr = $(this).closest(`tr`);
            const wordId = jqTr.data(`id`);
            const wordIndex = jqTr.find(`th[cname="index"]`).text();
            if (typeof wordId !== `string`){
                throw(`Wrong word ID`);
            }
            const decision = confirm(`Are you sure you want to delete word ${wordIndex}? Its score wont be recoverable`);
            if (!decision){
                return;
            }
            const response = await api.word.delete(wordId);
            if (!response.status){
                throw(`Oops, something went wrong!`);
            }
            $(this).closest(`tr`).remove();
            $.notify(`Word ${wordIndex} removed`, `success`);
        } catch (error) {
            handleError(error);
        }
    });

    jq.wordTableTbody.on(`click`, `.actionButton[cname="edit"]`, function (event) {
        event.stopPropagation();
        try{
            f.editWordDom($(this).closest(`tr`));
        } catch (error) {
            handleError(error);
        }
    });

    jq.wordTableTbody.on(`click`, `.actionButton[cname="save"]`, async function (event) {
        event.stopPropagation();
        try{
            $(this).attr(`disabled`, true);
            const jqTr = $(this).closest(`tr`);
            const wordId = jqTr.data(`id`);
            f.saveWordDom(jqTr);
            const updatedWordObj = f.buildWordObjFromJq(jqTr);
            const response = await api.word.update(wordId, updatedWordObj);
            if (!response.status){
                throw(`Oops, something went wrong!`);
            }
            $.notify(`Word saved!`, `success`);
            $(this).attr(`disabled`, false);
        } catch (error) {
            handleError(error);
        }
    });

    jq.wordTableTbody.on(`keydown`, `input`, function (event) {
        if (event.which === 13){
            const jqTr = $(this).closest(`tr`);
            jqTr.find(`button[cname="save"]`).trigger(`click`);
        }

    });
    $(`body`).keydown((event) => {
        if (event.ctrlKey && event.which === 48){
            jq.addWordBtn.trigger(`click`);
        }
    });
});
