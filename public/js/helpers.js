`use strict`;
/* global DotObject */

Number.prototype.pad = function(size) {
    let s = String(this);
    while (s.length < (size || 2)) {s = `0` + s;}
    return s;
};

Array.prototype.last = function(){
    return this[this.length - 1];
};

const helpers = {
    dotObj: DotObject(),
    getCurrentIsoDateString: () => {
        const date = new Date();
        return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString();
    },
    copyToClipboard:(str) => {
        var $temp = $(`<input>`);
        $(`body`).append($temp);
        $temp.val(str).select();
        document.execCommand(`copy`);
        $temp.remove();
    },
    asyncForEach: async (iterable, callback) => {
        if (Array.isArray(iterable)){
            for (let index = 0; index < iterable.length; index++){
                await callback(iterable[index], index, iterable);
            }
        } else if (iterable instanceof Object){
            for (let prop in iterable){
                await callback(iterable[prop], prop, iterable);
            }
        }
    },
    openInNewTab: (url) => {
        const win = window.open(url, `_blank`);
        win.focus();
    },
    parseJson: (json) => {
        if (typeof json === `string`) {
            try{
                const decoded = decodeURIComponent(json);
                return JSON.parse(decoded);
            } catch (error){
                return JSON.parse(json);
            }
        } else {
            return json;
        }
    },
    isNumeric: (arg) => {
        return !isNaN(parseFloat(arg)) && isFinite(arg);
    },
    wait: (ms) => {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    },
};
