import Window from "../window.mjs";
import readFileContents from "../../utils/readFileContents.js";

export default class IMH extends Window {
    #map;
    #mapContainer;

    constructor() {
        super();
        this._defaultWindowSize = {
            width: "500px",
            height: "380px"
        }
    }

    async connectedCallback() {
        this.iconSrc = "/media/imh-icon.png";

        await super.connectedCallback();

        this._content.classList.add("imh-content");

        const style = document.createElement("style");
        style.innerHTML = await readFileContents(
            "/custom-elements/apps/imh.css"
        );

        this.#mapContainer = document.createElement("div");
        this.#mapContainer.className = "imh";
        this.#mapContainer.id = `${this.id}-map`;

        this.customTaskPreview = document.createElement("span");
        this.customTaskPreview.innerHTML = "No preview available";
        this.customTaskPreview.style.cssText = `
            color: white;
            padding-bottom: 1rem;
        `;

        if (navigator.geolocation) {
            this.#showMap.bind(this)();
        } else {
            alert("Geolocation is not supported by this browser.");
        }

        this.append(style, this.#mapContainer);
    }

    #showMap() {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = position.coords;

                this.#map = window.L.map(`${this.id}-map`, {
                    dragging: false,
                    scrollWheelZoom: "center",
                    minZoom: 4,
                    maxZoom: 17,
                    doubleClickZoom: false,
                }).setView([location.latitude, location.longitude], 17);

                window.L.tileLayer(
                    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
                    {
                        tileSize: 512,
                        zoomOffset: -1,
                        attribution:
                            '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                        crossOrigin: true,
                        noWrap: true,
                    }
                ).addTo(this.#map);

                this.#map.on("zoom", () => {
                    this.#map.panTo([location.latitude, location.longitude]);
                });
                this.#map.fitBounds(this.#map.getBounds());

                window.L.marker([
                    position.coords.latitude,
                    position.coords.longitude,
                ]).addTo(this.#map).bindPopup("I aM Here!");;

                
                this.onResize = () => {
                    this.#map.invalidateSize();
                };
                
                this.onToggleFullscreen = () => {
                    const intervalId = setInterval(() => {
                        this.#map.invalidateSize();
                    }, 10);
                    
                    setTimeout(() => {
                        clearInterval(intervalId);
                    }, 300);
                };
                
                this.#mapContainer.style.display = "block";
                this.#map.invalidateSize();
            },
            (error) => {
                if (error.code === error.PERMISSION_DENIED) {
                    const permissionsNotification =
                        document.createElement("span");
                    permissionsNotification.innerHTML =
                        "Permissions for Geo-Location must be enabled.\n";
                    permissionsNotification.className = "permissions";

                    const permissionsClarification =
                        document.createElement("span");
                    permissionsClarification.innerHTML =
                        "If there is no update after granting permissions, the window must be reopened";

                    permissionsNotification.append(permissionsClarification);
                    this.append(permissionsNotification);
                }
            }
        );
    }
}
