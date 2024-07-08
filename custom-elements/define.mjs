import Shortcut from "./shortcut.mjs";
import Window from "./window.mjs";
import JSCoder from "./apps/jscoder.mjs";
import Taskbar from "./taskbar/taskbar.mjs";
import Task from "./taskbar/task.mjs";
import Browser from "./apps/browser.mjs";

customElements.define("desktop-shortcut", Shortcut);
customElements.define("desktop-window", Window);
customElements.define("js-coder", JSCoder);
customElements.define("desktop-taskbar", Taskbar);
customElements.define("desktop-task", Task);
customElements.define("web-browser", Browser)
