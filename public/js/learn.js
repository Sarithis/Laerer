"use strict";

$(document).ready(() => {
    const jq = {
        nextBtn: $(`button[cname="next"]`),
        hintBtn: $(`button[cname="hint"]`),
        failedBtn: $(`button[cname="failed"]`),
        toTranslate: $(`.card-body > [cname="toTranslate"]`),
        translationInpt: $(`input[cname="translationInpt"]`),
        title: $(`.card-header`),
        input: $(`input[cname="translation"]`)
    };

    let pJS = null;
    let originalPJSConfig = null;
    const waitForPJS = setInterval(() => {
        if (pJSDom[0].pJS !== undefined){
            pJS = pJSDom[0].pJS;
            originalPJSConfig = JSON.parse(JSON.stringify({
                particles: {
                    opacity: {
                        value: pJS.particles.opacity.value
                    },
                    line_linked: {
                        opacity: pJS.particles.line_linked.opacity,
                        color_rgb_line: pJS.particles.line_linked.color_rgb_line
                    },
                    move: {
                        speed: pJS.particles.move.speed
                    },
                    color: {
                        rgb: pJS.particles.color.rgb
                    },
                    shape: {
                        stroke: {
                            color: pJS.particles.shape.stroke.color
                        }
                    }
                }
            }));
            clearInterval(waitForPJS);
        }
    }, 100);

    const f = {
        getNextWord: async () => {
            const response = await api.word.getNext();
            if (!response.status){
                throw(`Oops, something went wrong!`);
            }
            const wordObj = response.data;
            if (wordObj.translateFromForeign){
                f.speak(f.getTextToTranslate(wordObj), `Norwegian Female`);
            }
            return response.data;
        },
        restorePJSConfig: () => {
            pJS.particles.opacity.value = originalPJSConfig.particles.opacity.value;
            pJS.particles.line_linked.opacity = originalPJSConfig.particles.line_linked.opacity
            pJS.particles.line_linked.color_rgb_line = originalPJSConfig.particles.line_linked.color_rgb_line
            pJS.particles.move.speed = originalPJSConfig.particles.move.speed
            pJS.particles.color.rgb = originalPJSConfig.particles.color.rgb;
            pJS.particles.shape.stroke.color = originalPJSConfig.particles.shape.stroke.color;
        },
        successTranslation: async (wordObj) => {
            try{
                jq.nextBtn.attr(`disabled`, true);
                const updatedWordObj = wordObj;
                updatedWordObj.succeeded += 1;
                updatedWordObj.score = parseFloat(updatedWordObj.score) + 0.1;
                updatedWordObj.translatedTimestamp = Date.now();
                const response = await api.word.update(wordObj._id, updatedWordObj);
                if (!response.status){
                    throw(`Oops, something went wrong! Refresh the page`);
                }
            } catch (error) {
                handleError(error);
            };
        },
        failedTranslation: async (wordObj) => {
            try{
                jq.failedBtn.attr(`disabled`, true);
                const updatedWordObj = wordObj;
                updatedWordObj.failed += 1;
                updatedWordObj.score = (parseFloat(updatedWordObj.score) - 0.3).toFixed(2);
                updatedWordObj.translatedTimestamp = Date.now();
                const response = await api.word.update(wordObj._id, updatedWordObj);
                if (!response.status){
                    throw(`Oops, something went wrong! Refresh the page`);
                }
            } catch (error) {
                handleError(error);
            };
        },
        askedForHint: async (wordObj) => {
            try{
                jq.hintBtn.attr(`disabled`, true);
                const updatedWordObj = wordObj;
                updatedWordObj.score = (parseFloat(updatedWordObj.score) - 0.1).toFixed(2);
                const response = await api.word.update(wordObj._id, updatedWordObj);
                if (!response.status){
                    throw(`Oops, something went wrong! Refresh the page`);
                }
            } catch (error) {
                handleError(error);
            };
        },
        getTextToTranslate: (wordObj) => {
            const wordToTranslate = !wordObj.translateFromForeign ? wordObj.translation : wordObj.word;
            const articleToTranslate = !wordObj.translateFromForeign ? wordObj.articleTranslation : wordObj.article;
            return !articleToTranslate || articleToTranslate == `` ? wordToTranslate : `${articleToTranslate} ${wordToTranslate}`;
        },
        getTextTranslated: (wordObj) => {
            const wordToTranslate = wordObj.translateFromForeign ? wordObj.translation : wordObj.word;
            const articleToTranslate = wordObj.translateFromForeign ? wordObj.articleTranslation : wordObj.article;
            return !articleToTranslate || articleToTranslate == `` ? wordToTranslate : `${articleToTranslate} ${wordToTranslate}`;
        },
        updateDomsFromWordObj: (wordObj) => {
            const toTranslateText = f.getTextToTranslate(wordObj);

            jq.toTranslate.text(toTranslateText);
            jq.title.html(`A <strong class="translationDirection">${wordObj.translateFromForeign ? `<span class="text-info">foreign</span>` : `<span class="text-success">native</span>`}</strong> word to translate:`);
            jq.failedBtn.attr(`disabled`, false);
            jq.hintBtn.attr(`disabled`, false);
            jq.input.val(``);
            jq.input.attr(`disabled`, false);
            jq.input.focus();
        },
        animateBackground: async (oldSimilarity, newSimilarity, failed = false) => {
            const moveOffset = 1;
            const successAnimationTime = 200;

            pJS.particles.opacity.value = 1;
            pJS.particles.line_linked.opacity = 1;

            const newRgb = f.getRgbForPercentage(newSimilarity);
            pJS.particles.color.rgb = newRgb;
            pJS.particles.line_linked.color_rgb_line = newRgb;
            pJS.particles.shape.stroke.color = `rgb(${Object.values(newRgb).join(`,`)})`;

            if (newSimilarity === 1 || failed){
                pJS.particles.move.speed = 200;
                await helpers.wait(200);
                pJS.particles.move.speed = 1;
            } else if (newSimilarity > oldSimilarity){
                pJS.particles.move.speed += moveOffset;
            } else if (pJS.particles.move.speed - moveOffset > 1){
                pJS.particles.move.speed -= moveOffset;
            } else {
                pJS.particles.move.speed = 1;
            }
            pJS.particles.opacity.value = 0.5;
        },
        getRgbForPercentage: (pct) => {
            const percentColors = [
                { pct: 0.0, color: { r: 220, g: 53, b: 69 } },
                { pct: 0.5, color: { r: 211, g: 158, b: 0 } },
                { pct: 1.0, color: { r: 40, g: 167, b: 69 } }
            ];
            let i = 0;
            for (i = 1; i < percentColors.length - 1; i++) {
                if (pct < percentColors[i].pct) {
                    break;
                }
            }
            const lower = percentColors[i - 1];
            const upper = percentColors[i];
            const range = upper.pct - lower.pct;
            const rangePct = (pct - lower.pct) / range;
            const pctLower = 1 - rangePct;
            const pctUpper = rangePct;
            const color = {
                r: Math.floor(lower.color.r * pctLower + upper.color.r * pctUpper),
                g: Math.floor(lower.color.g * pctLower + upper.color.g * pctUpper),
                b: Math.floor(lower.color.b * pctLower + upper.color.b * pctUpper)
            };
            return color;
        },
        speak: (text, language, pitch, rate) => {
            responsiveVoice.speak(text, language, {rate: 0.9});
        },
    };

    (async () => {
        let wordObj = await f.getNextWord();
        f.updateDomsFromWordObj(wordObj);
        let lastSimilarity = 0;
        jq.input.keyup(function (event) {
            if (!(event.which >= 65 && event.which <= 120) && event.which !== 229 && (![32, 0, 8, 46].includes(event.which))){
                return;
            }
            const calculateSimilarityTo = f.getTextTranslated(wordObj);
            const calculateSimilarityFrom = $(this).val();
            const newSimilarity = helpers.similarity(calculateSimilarityFrom, calculateSimilarityTo);

            f.animateBackground(lastSimilarity, newSimilarity);
            lastSimilarity = newSimilarity;
            if (newSimilarity === 1){
                if (!wordObj.translateFromForeign){
                    f.speak(f.getTextTranslated(wordObj), `Norwegian Female`);
                }
                $(this).attr(`disabled`, true);
                jq.nextBtn.effect(`pulsate`, {times: 1}, 400);
                jq.nextBtn.attr(`disabled`, false);
            }
        });
        $(window).keydown((event) => {
            if (event.ctrlKey && event.which === 13 && jq.failedBtn.attr(`disabled`) !== false){
                jq.failedBtn.trigger(`click`);
            } else if (event.ctrlKey && event.shiftKey && jq.hintBtn.attr(`disabled`) !== false){
                jq.hintBtn.trigger(`click`);
            } else if (event.shiftKey && event.which === 219){
                event.preventDefault();
                jq.input.val(jq.input.val() + `å`);
            } else if (event.shiftKey && event.which === 186){
                event.preventDefault();
                jq.input.val(jq.input.val() + `ø`);
            } else if (event.shiftKey && event.which === 222){
                event.preventDefault();
                jq.input.val(jq.input.val() + `æ`);
            } else if ($(event.target).get(0) == jq.input.get(0)){
                return;
            } else if (event.which === 13 && jq.nextBtn.attr(`disabled`) !== false){
                jq.nextBtn.trigger(`click`);
            }
        });
        jq.nextBtn.click(async () => {
            lastSimilarity = 0;
            await f.successTranslation(wordObj);
            wordObj = await f.getNextWord();
            f.restorePJSConfig();
            f.updateDomsFromWordObj(wordObj);
        });
        jq.failedBtn.click(async () => {
            lastSimilarity = 0;
            await f.failedTranslation(wordObj);
            jq.input.val(f.getTextTranslated(wordObj));
            jq.input.attr(`disabled`, true);
            jq.hintBtn.attr(`disabled`, true);
            f.animateBackground(0, 0, true);
            jq.nextBtn.attr(`disabled`, false);
            if (!wordObj.translateFromForeign){
                f.speak(f.getTextTranslated(wordObj), `Norwegian Female`);
            }
        });
        jq.hintBtn.click(async () => {
            lastSimilarity = 0;
            await f.askedForHint(wordObj);
            const translatedText = f.getTextTranslated(wordObj);
            if ((wordObj.translateFromForeign && wordObj.article.length > 0) || (!wordObj.translateFromForeign && wordObj.articleTranslation.length)){
                jq.input.val(translatedText.substr(0, 4));
            } else {
                jq.input.val(translatedText.substr(0, Math.floor(translatedText.length / 3)));
            }
            jq.input.focus();
        });
    })();
});
