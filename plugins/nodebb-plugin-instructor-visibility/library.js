'use strict';

const Plugin = {};

console.log('[instructor-visibility] library.js loaded');

Plugin.testHook = async function (hookData) {
    console.log('[instructor-visibility] testHook fired', hookData?.data);
    return hookData;
};

module.exports = Plugin;
