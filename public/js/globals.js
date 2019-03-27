`use strict`;

const handleError = (error) => {
    $.notify(`Error: ${JSON.stringify(error)}`, `error`);
    console.error(error);
}

$(document).ready(() => {
    particlesJS.load(`background`, `assets/particles.json`, () => {
      console.log(`callback - particles.js config loaded`);
    });
});
