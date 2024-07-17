import Shortcut from "./shortcut.mjs";
import Window from "./window.mjs";
import JSCoder from "./apps/jscoder.mjs";
import Taskbar from "./taskbar/taskbar.mjs";
import Task from "./taskbar/task.mjs";
import Browser from "./apps/browser.mjs";
import Calculator from "./apps/calculator.mjs";
import Recorder from "./apps/recorder.mjs";
import Gallery from "./apps/gallery.mjs";
import Clock from "./widgets/clock.mjs";
import IMH from "./apps/imh.mjs";

// General
customElements.define("desktop-shortcut", Shortcut);
customElements.define("desktop-taskbar", Taskbar);
customElements.define("desktop-task", Task);

// Windows
customElements.define("desktop-window", Window);
customElements.define("desktop-gallery", Gallery);
customElements.define("js-coder", JSCoder);
customElements.define("web-browser", Browser);
customElements.define("web-calculator", Calculator);
customElements.define("web-recorder", Recorder);
customElements.define("web-imh", IMH);

// Widgets
customElements.define("desktop-clock", Clock);

