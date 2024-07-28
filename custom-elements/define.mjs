import Shortcut from "./shortcut.mjs";
import Window from "./window.mjs";
import Taskbar from "./taskbar/taskbar.mjs";
import Task from "./taskbar/task.mjs";
import Settings from "./settings.mjs";
import AlertDialog from "./alertDialog.mjs";
import Gallery from "./apps/gallery.mjs";
import JSCoder from "./apps/jscoder.mjs";
import Browser from "./apps/browser.mjs";
import Calculator from "./apps/calculator.mjs";
import Recorder from "./apps/recorder.mjs";
import IMH from "./apps/imh.mjs";
import Clock from "./widgets/clock.mjs";

// General
customElements.define("desktop-shortcut", Shortcut);
customElements.define("desktop-window", Window);
customElements.define("desktop-taskbar", Taskbar);
customElements.define("desktop-task", Task);
customElements.define("desktop-settings", Settings);
customElements.define("desktop-alert-dialog", AlertDialog, {
    extends: "dialog",
});

// Windows
customElements.define("desktop-gallery", Gallery);
customElements.define("js-coder", JSCoder);
customElements.define("web-browser", Browser);
customElements.define("web-calculator", Calculator);
customElements.define("web-recorder", Recorder);
customElements.define("web-imh", IMH);

// Widgets
customElements.define("desktop-clock", Clock);
