`use strict`;

$(document).ready(() => {
    const jq = {
        nextBtn: $(`button[cname="next"]`),
        hintBtn: $(`button[cname="hint"]`),
        giveUp: $(`button[cname="giveUp"]`),
        toTranslate: $(`.card-body > [cname="toTranslate"]`),
        translationInpt: $(`input[cname="translationInpt"]`),
        title: $(`.card-header`),
        input: $(`input[cname='translation']`)
    };

    const f = {
        getNextWord: async () => {
            const response = await api.word.getNext();
            if (!response.status){
                throw(`Oops, something went wrong!`);
            }
            return response.data;
        },
        confirmTranslation: async () => {
            
        },
        getTextToTranslate: (wordObj) => {
            const wordToTranslate = wordObj.translateFromForeign ? wordObj.translation : wordObj.word;
            const articleToTranslate = wordObj.translateFromForeign ? wordObj.articleTranslation : wordObj.article;
            return !articleToTranslate || articleToTranslate == `` ? wordToTranslate : `${articleToTranslate} ${wordToTranslate}`;
        },
        getTextTranslated: (wordObj) => {
            const wordToTranslate = !wordObj.translateFromForeign ? wordObj.translation : wordObj.word;
            const articleToTranslate = !wordObj.translateFromForeign ? wordObj.articleTranslation : wordObj.article;
            return !articleToTranslate || articleToTranslate == `` ? wordToTranslate : `${articleToTranslate} ${wordToTranslate}`;
        },
        updateDomsFromWordObj: (wordObj) => {
            const toTranslateText = f.getTextToTranslate(wordObj);

            jq.toTranslate.text(toTranslateText);
            jq.title.html(`A <strong class="translationDirection">${wordObj.translateFromForeign ? `<span class="text-info">foreign</span>` : `<span class="text-success">native</span>`}</strong> word to translate:`)
        },
        animateBackground: async (oldSimilarity, newSimilarity) => {
            const pJS = pJSDom[0].pJS;
            const moveOffset = 1;
            const successAnimationTime = 200;

            pJS.particles.opacity.value = 1;
            pJS.particles.line_linked.opacity = 1;
            //pJS.particles.line_linked.width = 1;

            const newRgb = f.getRgbForPercentage(newSimilarity);
            pJS.particles.color.rgb = newRgb;
            pJS.particles.line_linked.color_rgb_line = newRgb;
            console.log(pJS.particles.shape.stroke.color);
            pJS.particles.shape.stroke.color = `rgb(${Object.values(newRgb).join(`,`)})`;

            if (newSimilarity === 1){
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
                { pct: 0.0, color: { r: 170, g: 10, b: 10 } },
                { pct: 0.5, color: { r: 170, g: 150, b: 10 } },
                { pct: 1.0, color: { r: 10, g: 150, b: 10 } }
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
        }
    };

    (async () => {
        const wordObj = await f.getNextWord();
        f.updateDomsFromWordObj(wordObj);
        let lastSimilarity = 0;
        jq.input.keyup(function (event) {
            const calculateSimilarityTo = f.getTextTranslated(wordObj);
            const calculateSimilarityFrom = $(this).val();
            const newSimilarity = helpers.similarity(calculateSimilarityFrom, calculateSimilarityTo);

            f.animateBackground(lastSimilarity, newSimilarity);
            lastSimilarity = newSimilarity;
            if (newSimilarity === 1){
                $(this).attr(`disabled`, true);
                jq.nextBtn.effect(`pulsate`, {times: 1}, 400);
                jq.nextBtn.attr(`disabled`, false);
            }
        });
        $(body).keydown(async (event) => {
            if (event.keyCode === 13 && jq.nextBtn.attr(`disabled`)){
                event.preventDefault();
                await f.confirmTranslation();
            }
        });
        jq.nextBtn.click(async () => {
            await f.confirmTranslation();
        });
    })();

});
