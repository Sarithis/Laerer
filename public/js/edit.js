"use strict";


$(document).ready(() => {
    const jq = {
        addWordBtn: $(`#addWordBtn`),
        deleteWordBtn: $(`#deleteWordBtn`),
        editWordBtn: $(`#editWordBtn`),
        resetScoreBtn: $(`#resetScoreBtn`),
        saveWordBtn: $(`#saveWordBtn`),
        wordTable: $(`#wordTable`),
    };
    const f = {
        editWordDom: (jqTr) => {
            jqTr.find(`td.editable`).each((index, td) => {
                $(td).html(`<input type="text" class="form-control" style="max-width: ${$(td).width()}; min-width: ${$(td).width()}" value="${$(td).text()}"></input>`);
            });
            jqTr.find(`td.editable:first`).find(`input`).focus();
            jqTr.addClass(`editing`);
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
        buildWordObjFromJq: (jqTr) => {
            const result = {};
            jqTr.find(`td.saveable`).toArray().forEach((td) => {
                result[$(td).attr(`cname`)] = $(td).text();
            });
            result._id = jqTr.data(`id`);
            return result;
        }
    };

    const dt = jq.wordTable.DataTable({
        paging: true,
        responsive: true,
        data: WORDS,
        ordering: true,
        order: [0, `asc`],
        info: false,
        searching: true,
        processing: true,
        scroller: false,
        lengthMenu: [ [10, 20, 50, -1], [10, 20, 50, `All`] ],
        iDisplayLength: 10,
        columnDefs: [{
            className: `editable saveable text-center`,
            targets: [1, 2, 3, 4, 5, 6]
        }, {
            className: `text-center`,
            targets: `_all`
        }],
        createdRow: (row, data, dataIndex) => {
            $(row).attr(`data-id`, data._id);
        },
        columns: [{
            title: `ID`,
            type: `num`,
            data: (row, type, set, meta) => {
                return parseInt(meta.row) + 1;
            },
            createdCell: (td, cellData, rowData, row, col) => {
                $(td).attr(`cname`, `index`);
            }
        }, {
            title: `Article`,
            data: `article`,
            createdCell: (td, cellData, rowData, row, col) => {
                $(td).attr(`cname`, `article`);
            }
        }, {
            title: `Word`,
            data: `word`,
            createdCell: (td, cellData, rowData, row, col) => {
                $(td).attr(`cname`, `word`);
            }
        }, {
            title: `Context`,
            data: `context`,
            createdCell: (td, cellData, rowData, row, col) => {
                $(td).attr(`cname`, `context`);
            }
        }, {
            title: `Art. tr.`,
            data: `articleTranslation`,
            createdCell: (td, cellData, rowData, row, col) => {
                $(td).attr(`cname`, `articleTranslation`);
            }
        }, {
            title: `Word translation`,
            data: `translation`,
            createdCell: (td, cellData, rowData, row, col) => {
                $(td).attr(`cname`, `translation`);
            }
        }, {
            title: `Foreign context`,
            data: `contextTranslation`,
            createdCell: (td, cellData, rowData, row, col) => {
                $(td).attr(`cname`, `contextTranslation`);
            }
        }, {
            title: `Score`,
            data: `score`,
            type: `num`,
            render: $.fn.dataTable.render.number(`,`, `.`, 2),
            createdCell: (td, cellData, rowData, row, col) => {
                $(td).attr(`cname`, `score`);
            }
        }]
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
            const newRow = dt.row.add(response.data).draw(false).node();
            dt.page(`last`).draw(`page`);
            f.editWordDom($(newRow));
            $(this).attr(`disabled`, false);
        } catch (error) {
            $(this).attr(`disabled`, false);
            handleError(error);
        }
    });

    jq.resetScoreBtn.click(async () => {
        try{
            const selectedRowNode = dt.row(`.selected`).node()
            if (!selectedRowNode || selectedRowNode === null){
                $.notify(`You need to select a row first`, `warn`);
                return false;
            }
            const jqTr = $(selectedRowNode);
            const wordIndex = jqTr.find(`td[cname="index"]`).text();
            if (isNaN(wordIndex)){
                $.notify(`Wrong word index value, canceling this operation`, `error`);
                return;
            } else {
                const response = await api.word.resetScore(jqTr.data(`id`));
                if (!response.status){
                    throw(`Oops, something went wrong!`);
                }
            }
            window.location.reload();
        } catch (error){
            handleError(error);
        }
    });


    jq.deleteWordBtn.click(async (event) => {
        try{
            const selectedRowNode = dt.row(`.selected`).node()
            if (!selectedRowNode || selectedRowNode === null){
                $.notify(`You need to select a row first`, `warn`);
                return false;
            }
            const jqTr = $(selectedRowNode);
            const wordId = jqTr.data(`id`);
            const wordIndex = jqTr.find(`td[cname="index"]`).text();
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
            dt.row(jqTr).remove().draw(false);
            $.notify(`Word ${wordIndex} removed`, `success`);
        } catch (error) {
            handleError(error);
        }
    });

    jq.editWordBtn.click((event) => {
        try{
            const selectedRowNode = dt.row(`.selected`).node()
            if (!selectedRowNode || selectedRowNode === null){
                $.notify(`You need to select a row first`, `warn`);
                return false;
            }
            const jqTr = $(selectedRowNode);
            f.editWordDom(jqTr);
        } catch (error) {
            handleError(error);
        }
    });

    jq.saveWordBtn.click(async function () {
        try{
            const editedRows = dt.rows(`.editing`).nodes();
            if (!editedRows || editedRows === null || editedRows.length === 0){
                $.notify(`You need to edit a row first`, `warn`);
                return false;
            }
            const updatedWordArr = [];
            for (let editedRow of Array.from(editedRows)){
                const jqTr = $(editedRow);
                f.saveWordDom(jqTr);
                const updatedWordObj = f.buildWordObjFromJq(jqTr);
                updatedWordArr.push(updatedWordObj);
            }
            const response = await api.word.updateMany(updatedWordArr);
            if (!response.status){
                throw(`Oops, something went wrong!`);
            }
            response.data.forEach((data) => {
                const jqTr = $(`tr[data-id="${data._id}"]`);
                dt.row(jqTr).data(data).draw(false);
            });
            $.notify(`Words saved!`, `success`);
            $(this).attr(`disabled`, false);
        } catch (error) {
            handleError(error);
        }
    });

    jq.wordTable.on(`keydown`, `input`, function (event) {
        if (event.which === 13){
            jq.saveWordBtn.trigger(`click`);
        }

    });

    jq.wordTable.find(`tbody`).on(`click`, `tr`, function() {
        if ($(this).hasClass(`selected`)) {
            $(this).removeClass(`selected`);
        } else {
            dt.$(`tr.selected`).removeClass(`selected`);
            $(this).addClass(`selected`);
        }
    });

    $(`body`).keydown((event) => {
        if (event.ctrlKey && event.which === 48){
            jq.addWordBtn.trigger(`click`);
        }
    });
});
