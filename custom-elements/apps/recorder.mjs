import readFileContents from "../../utils/readFileContents.js";
import Window from "../window.mjs";
import PictureStorage, {
    createPictureShortcut,
} from "../../utils/pictureStorage.js";
import playAudioSnapshot from "../../utils/playAudioSnapshot.js";
import downloadFromHref from "../../utils/downloadFromHref.js";

const MODES = Object.freeze({
    pic: Symbol("PIC"),
    vid: Symbol("VID"),
    mic: Symbol("MIC"),
});

export default class Recorder extends Window {
    /** @type {symbol} */
    #mode;

    /** @type {MediaRecorder} */
    #mediaRecorder;

    /** @type {HTMLVideoElement} */
    #cameraPreview;

    /** @type {HTMLDialogElement} */
    #outputDialog;

    /** @type {HTMLCanvasElement} */
    #outputCanvas;

    /** @type {HTMLVideoElement} */
    #outputVideo;

    /** @type {MediaStream} */
    #outputAudioStream;

    /** @type {HTMLAudioElement} */
    #outputAudio;

    /** @type {HTMLSourceElement} */
    #outputAudioSource;

    /** @type {HTMLButtonElement} */
    #saveOutputButton;

    /** @type {HTMLButtonElement} */
    #startStopButton;

    /** @type {AudioContext} */
    #audioCtx;

    /** @type {HTMLCanvasElement} */
    #microphonePreview;

    constructor() {
        super();
        this._defaultWindowSize = {
            width: "31.25rem",
            height: "28.75rem",
        };
        this.#mode = MODES.pic;
    }

    async connectedCallback() {
        this.headerTitle = "Recorder";
        this.iconSrc = "/media/images/app-icons/recorder.png";

        await super.connectedCallback();

        this._content.classList.add("recorder-content");
        this._content.dataset.mode = "pic";

        // Previews
        const previewsWrapper = document.createElement("div");
        previewsWrapper.className = "previews";

        this.#cameraPreview = document.createElement("video");
        this.#cameraPreview.className = "camera-preview";

        this.#microphonePreview = document.createElement("canvas");
        this.#microphonePreview.className = "microphone-preview";

        previewsWrapper.append(this.#cameraPreview, this.#microphonePreview);

        // Buttons
        const buttonsWrapper = document.createElement("div");
        buttonsWrapper.className = "buttons";

        const modeButtonsWrapper = document.createElement("div");
        modeButtonsWrapper.className = "mode-buttons";

        const modeButtons = [];

        let i = 0;

        for (const mode in MODES) {
            const modeRadio = document.createElement("input");
            modeRadio.type = "radio";
            modeRadio.id = `${this.id}-mode-${mode}`;
            modeRadio.hidden = true;
            modeRadio.name = `${this.id}`;
            modeRadio.checked = i === 0;

            const label = document.createElement("label");
            label.htmlFor = modeRadio.id;
            label.innerHTML = mode;
            label.append(modeRadio);
            label.onclick = () => this.#changeMode(mode);

            modeButtons.push(label);

            i++;
        }

        modeButtonsWrapper.append(...modeButtons);

        this.#startStopButton = document.createElement("button");
        this.#startStopButton.className = "start-stop-button";
        this.#startStopButton.innerHTML = "capture";
        this.#startStopButton.onclick = this.#record.bind(this);

        buttonsWrapper.append(modeButtonsWrapper, this.#startStopButton);

        this.#outputDialog = document.createElement("dialog");
        this.#outputDialog.className = "output-dialog";

        const dialogButtons = document.createElement("div");
        dialogButtons.className = "dialog-buttons";

        this.#saveOutputButton = document.createElement("button");
        this.#saveOutputButton.innerHTML = "Save";
        this.#saveOutputButton.onclick = this.#saveMediaToDesktop.bind(this);

        const discardButton = document.createElement("button");
        discardButton.innerHTML = "Discard";
        discardButton.onclick = this.#discardMedia.bind(this);

        dialogButtons.append(this.#saveOutputButton, discardButton);

        this.#outputCanvas = document.createElement("canvas");
        this.#outputVideo = document.createElement("video");
        this.#outputVideo.controls = true;

        this.#outputAudioSource = document.createElement("source");
        this.#outputAudioSource.type = "audio/ogg";

        this.#outputAudio = document.createElement("audio");
        this.#outputAudio.controls = true;
        this.#outputAudio.append(this.#outputAudioSource);

        this.#outputDialog.append(
            this.#outputCanvas,
            this.#outputVideo,
            this.#outputAudio,
            dialogButtons
        );

        const style = document.createElement("style");
        style.innerHTML = await readFileContents(
            "/custom-elements/apps/recorder.css"
        );

        const permissionsNotification = document.createElement("span");
        permissionsNotification.innerHTML =
            "Permissions for Camera & Microphone must be enabled.\n";
        permissionsNotification.className = "permissions";

        const permissionsClarification = document.createElement("span");
        permissionsClarification.innerHTML =
            "If there is no update after granting permissions, the window must be reopened";

        permissionsNotification.append(permissionsClarification);
        this.append(style, permissionsNotification);

        try {
            const videoStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true,
            });
            this.#cameraPreview.srcObject = videoStream;
            this.#cameraPreview.muted = true;

            await this.#cameraPreview.play();

            const audioStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });

            this.#outputAudioStream = audioStream;

            permissionsNotification.style.display = "none";

            this.append(previewsWrapper, buttonsWrapper, this.#outputDialog);
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * @param {string} mode
     */
    #changeMode(mode) {
        this._content.dataset.mode = mode;
        this.#mode = MODES[mode];

        if (MODES[mode] === MODES.mic) {
            this.#visualize();
        }

        if (MODES[mode] === MODES.pic) {
            this.#startStopButton.innerHTML = "capture";
        } else {
            this.#startStopButton.innerHTML = "record";
        }

        playAudioSnapshot("/media/audio/recorder/recorder-mode-select.wav");
    }

    async #record() {
        switch (this.#mode) {
            case MODES.pic: {
                this.#outputCanvas.width = this.#cameraPreview.videoWidth;
                this.#outputCanvas.height =
                    this.#cameraPreview.videoHeight ||
                    this.#outputCanvas.width / (4 / 3);

                const ctx = this.#outputCanvas.getContext("2d");
                ctx.drawImage(
                    this.#cameraPreview,
                    0,
                    0,
                    this.#outputCanvas.width,
                    this.#outputCanvas.height
                );

                this.#saveOutputButton.innerHTML = globalThis.isMobile
                    ? "Download"
                    : "Save";

                this.#outputVideo.style.display = "none";
                this.#outputAudio.style.display = "none";
                this.#outputCanvas.style.display = "unset";
                this.#outputDialog.show();

                playAudioSnapshot("/media/audio/recorder/camera.wav");

                break;
            }
            case MODES.vid: {
                if (this.#mediaRecorder) {
                    this.#mediaRecorder.stop();
                    this.#mediaRecorder = null;
                    this.#startStopButton.innerHTML = "record";
                    delete this._content.dataset.recording;

                    return;
                }

                this._content.dataset.recording = "";
                this.#startStopButton.innerHTML = "stop";

                this.#mediaRecorder = new MediaRecorder(
                    this.#cameraPreview.srcObject
                );

                const data = [];

                this.#mediaRecorder.ondataavailable = (event) =>
                    data.push(event.data);

                this.#mediaRecorder.onstop = async () => {
                    const recordedBlob = new Blob(data, { type: "video/webm" });
                    this.#outputVideo.src = URL.createObjectURL(recordedBlob);

                    this.#saveOutputButton.innerHTML = "Download";

                    this.#outputAudio.style.display = "none";
                    this.#outputCanvas.style.display = "none";
                    this.#outputVideo.style.display = "unset";

                    this.#outputDialog.show();

                    await this.#outputVideo.play();
                };

                this.#mediaRecorder.start();

                playAudioSnapshot("/media/audio/recorder/record-video.wav");

                break;
            }
            case MODES.mic: {
                if (this.#mediaRecorder) {
                    this.#mediaRecorder.stop();
                    this.#mediaRecorder = null;
                    this.#startStopButton.innerHTML = "record";
                    delete this._content.dataset.recording;

                    return;
                }

                this._content.dataset.recording = "";
                this.#startStopButton.innerHTML = "stop";

                this.#mediaRecorder = new MediaRecorder(
                    this.#outputAudioStream
                );

                const data = [];

                this.#visualize();

                this.#mediaRecorder.ondataavailable = (event) =>
                    data.push(event.data);

                this.#mediaRecorder.onstop = async () => {
                    const recordedBlob = new Blob(data, {
                        type: "audio/ogg; codecs=opus",
                    });

                    this.#outputAudioSource.src =
                        URL.createObjectURL(recordedBlob);

                    this.#saveOutputButton.innerHTML = "Download";

                    this.#outputVideo.style.display = "none";
                    this.#outputCanvas.style.display = "none";
                    this.#outputAudio.style.display = "unset";

                    this.#outputDialog.show();
                    this.#outputAudio.load();

                    await this.#outputAudio.play();
                };

                this.#mediaRecorder.start();

                playAudioSnapshot("/media/audio/recorder/record-audio.wav");
            }
        }
    }

    #saveMediaToDesktop() {
        switch (this.#mode) {
            case MODES.pic: {
                const src = this.#outputCanvas.toDataURL("image/jpeg");

                if (globalThis.isMobile) {
                    downloadFromHref(
                        src,
                        `picture-${new Date().toISOString()}.jpeg`
                    );
                } else {
                    const pictureInfo = PictureStorage.addPicture(src);
                    createPictureShortcut(pictureInfo);
                }

                this.#saveOutputButton.style.color = "greenyellow";

                setTimeout(() => {
                    this.#outputDialog.style.opacity = 0;

                    setTimeout(() => {
                        this.#outputDialog.close();

                        this.#outputDialog.style.opacity = 1;
                        this.#saveOutputButton.style.color = "white";
                    }, 300);
                }, 800);

                break;
            }
            case MODES.vid: {
                downloadFromHref(
                    this.#outputVideo.src,
                    `video-${new Date().toISOString()}.webm`
                );
                break;
            }
            case MODES.mic: {
                downloadFromHref(
                    this.#outputAudioSource.src,
                    `audio-${new Date().toISOString()}.ogg`
                );
            }
        }
    }

    #discardMedia() {
        this.#outputDialog.style.opacity = 0;

        setTimeout(() => {
            this.#outputDialog.close();

            this.#outputDialog.style.opacity = 1;
        }, 300);
    }

    /**
     * Credit to https://github.com/mdn/dom-examples/blob/main/media/web-dictaphone/scripts/app.js
     */
    #visualize() {
        if (!this.#audioCtx) {
            this.#audioCtx = new AudioContext();
        }

        const source = this.#audioCtx.createMediaStreamSource(
            this.#cameraPreview.srcObject
        );

        const analyser = this.#audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        source.connect(analyser);

        let animationId = -1;
        const ctx = this.#microphonePreview.getContext("2d");

        draw.call(this);

        function draw() {
            const WIDTH = this.#microphonePreview.width;
            const HEIGHT = this.#microphonePreview.height;

            if (this.#mode !== MODES.mic) {
                cancelAnimationFrame(animationId);
            }

            animationId = requestAnimationFrame(draw.bind(this));

            analyser.getByteTimeDomainData(dataArray);

            ctx.clearRect(0, 0, WIDTH, HEIGHT);

            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgb(255, 255, 255)";

            ctx.beginPath();

            let sliceWidth = (WIDTH * 1.0) / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                let v = dataArray[i] / 128.0;
                let y = (v * HEIGHT) / 2;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            ctx.lineTo(
                this.#microphonePreview.width,
                this.#microphonePreview.height / 2
            );
            ctx.stroke();
        }
    }
}
