import Shortcut from "./shortcut.mjs";
import Window from "./window.mjs";
import JSCoder from "./jscoder.mjs";
import Taskbar from "./taskbar/taskbar.mjs";
import Task from "./taskbar/task.mjs";

customElements.define("desktop-shortcut", Shortcut);
customElements.define("desktop-window", Window);
customElements.define("js-coder", JSCoder);
customElements.define("desktop-taskbar", Taskbar);
customElements.define("desktop-task", Task);
