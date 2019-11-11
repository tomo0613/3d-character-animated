// Advance the simulation by this amount of time (ms) in each step
const simulationStep = 1 / 60;
// Count of maximum allowed simulations between each render
const simulationLimit = 120;

let paused = true;
let simulationDepth = 0;
let prevTimeStamp: number;
let simulationCount: number;

let update = (timeStep: number) => {
    console.warn('no update method was specified for physics simulator');
};

export default {
    step,
    start() {
        console.info('start physics simulation');
        paused = false;
        prevTimeStamp = performance.now();
        step();
    },
    stop() {
        console.info('stop physics simulation');
        paused = true;
    },
    set update(updateFunction: typeof update) {
        update = updateFunction;
    },
};

function simulate(elapsedTime: number) {
    simulationCount = 0;
    simulationDepth += elapsedTime;

    while (simulationDepth > simulationStep) {
        update(simulationStep);
        simulationDepth -= simulationStep;

        if (++simulationCount >= simulationLimit) {
            simulationDepth = 0;
            break;
        }
    }
}

function step(timeStamp = performance.now()) {
    if (paused) {
        return;
    }
    simulate((timeStamp - prevTimeStamp) / 1000);

    prevTimeStamp = timeStamp;
}
