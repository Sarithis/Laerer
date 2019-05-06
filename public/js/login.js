"use strict";

$(document).ready(() => {
    $(`.message a`).click(() => {
        $(`form`).animate({
            height: `toggle`,
            opacity: `toggle`
        }, `slow`);
    });
});
