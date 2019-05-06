"use strict";
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
    editDistance: (s1, s2) => {
        s1 = s1.toLowerCase();
        s2 = s2.toLowerCase();

        const costs = new Array();
        for (let i = 0; i <= s1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= s2.length; j++) {
                if (i == 0)
                    costs[j] = j;
                else {
                    if (j > 0) {
                        let newValue = costs[j - 1];
                        if (s1.charAt(i - 1) != s2.charAt(j - 1))
                            newValue = Math.min(Math.min(newValue, lastValue),
                                costs[j]) + 1;
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
            }
            if (i > 0)
                costs[s2.length] = lastValue;
        }
        return costs[s2.length];
    },
    similarity: (s1, s2) => {
        let longer = s1;
        let shorter = s2;
        if (s1.length < s2.length) {
            longer = s2;
            shorter = s1;
        }
        const longerLength = longer.length;
        if (longerLength == 0) {
            return 1.0;
        }
        return (longerLength - helpers.editDistance(longer, shorter)) / parseFloat(longerLength);
    }
};
