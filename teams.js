// teams.js

let teamRed = [];
let teamYellow = [];
let teamBench = [];

export function getTeams() {
    return { teamRed, teamYellow, teamBench };
}

export function setTeams(red, yellow, bench) {
    teamRed = red;
    teamYellow = yellow;
    teamBench = bench;
}