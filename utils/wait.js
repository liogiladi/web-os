export default function wait(durationMS) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, durationMS);
    })
}