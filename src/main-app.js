// @ts-check

import { MapView } from './map-view.js';

const template = document.createElement('template');
template.innerHTML = `
<style>
.flex-container {
        display: flex;
        font-family: sans-serif;
        font-optical-sizing: auto;
        font-weight: 400;
        font-style: normal;

        padding-bottom: 100px;
}

.activity-container {
        position: fixed;
        width: 100vw;
        bottom: 10px;
        display: flex;
        height: auto;

        font-family: sans-serif;
        font-optical-sizing: auto;
        font-weight: 400;
        font-style: normal;
}

.content {
        margin: auto;
        position: relative;
        width: 90%;
        max-width: 700px;
}

.col {
        display: flex;
        flex-direction: column;
        gap: 10px;
}

.row {
        display: flex;
        flex-direction: row;
        gap: 10px;
        align-items: center
}

input {
        display: none;
}

label {
        display: block;
        position: relative;
        box-sizing: border-box;
        min-width: 5.14em;
        width: 100%;
        background: transparent;
        text-align: center;
        font: inherit;
        text-transform: uppercase;
        outline: none;
        border: 0;
        border-radius: 5px;
        user-select: none;
        cursor: pointer;
        z-index: 0;
        padding: 0.7em 0.57em;
        box-shadow: 3px 3px 6px 3px gray;
        background-color: var(--background-color, );
        color: black;
        transition: box-shadow 0.1s ease-out;
}

.textbox {
        box-sizing: border-box;
        border: 1px solid darkgray;

        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur;
        box-shadow: 3px 3px 6px 3px lightgray;

        height: 5em;
        overflow-y: auto;
        white-space: pre-line;
        font-family: monospace;
        font-size: smaller;
        transition: height 0.2s ease-out;
}

@media(hover: hover) and (pointer: fine) {
        .textbox:hover {
                height: 30em;
        }

        button:hover:not([disabled]) {
                background-color: #F0F0F0;
        }
}

.textbox.expanded {
        height: 30em;
}

.textbox.expanded {
        border: 2px solid black;
}

img {
        max-height: 150px;
}

.credits {
        font-style: italic;
        font-size: 80%;
        color: gray;
}

</style>

<div class="flex-container">
<div class="content">
<div class="col">
<div class="row">
<img src="./images/treasure-map-256.png">
<h2>GeoJSON Web Viewer</h2>
</div>

<div class="row">
<input id="loadfile" name="loadfile" type="file" accept=".geojson"/>
<label for="loadfile">Load GeoJSON</label>
</div>

<map-view></map-view>

<a class="credits" href="https://www.flaticon.com/free-icons/parchment" title="parchment icons">Parchment icons created by Freepik - Flaticon</a>
</div>
</div>
</div>

<div class="activity-container">
<div class="content">
<div class="col">
<div id="activity" class="textbox"></div>
</div>
</div>
</div>
`;

export class MainApp extends HTMLElement {
        #pageState
        #inputEl
        #activityLog
        #mapView

        constructor() {
                super();

                this.#pageState = new Map();

                for (let [name, value] of new URLSearchParams(location.search).entries()) {
                        this.#pageState.set(name, value);

                        console.log("STATE", name, value);
                }

                const shadowRoot = this.attachShadow({mode: 'open'});

                this.handleFileInput = this.handleFileInput.bind(this);
        }

        addToLog (logMsg) {
                // Default impl only outputs to console
                console.log(logMsg);
        }

        initializeLogging(el) {
                if (!(el instanceof HTMLElement)) {
                        return;
                }

                const addToLogImpl = logStr => {
                        // TBD: Change the crude prepend if performing bad on large content
                        const ts = (new Date()).toISOString().substring(11,23);
                        el.textContent = `[${ts}] ${logStr}\n` + el.textContent;
                        console.log(logStr);
                }

                this.addToLog = addToLogImpl.bind(this);

                el.addEventListener('click', () => {
                        el.classList.toggle('expanded');
                });
        }

        connectedCallback() {
                console.log("connectedCallback - MainApp");

                this.shadowRoot?.appendChild(template.content.cloneNode(true));

                this.#inputEl = this.shadowRoot?.querySelector('#loadfile');
                this.#mapView = this.shadowRoot?.querySelector('map-view');

                const activityLog = this.shadowRoot?.querySelector('#activity');
                if (this.#pageState.get('log') === 'y') {
                        this.initializeLogging(activityLog);
                } else {
                        activityLog?.remove();
                }

                // Print all url params
                for (var [key, value] of this.#pageState) {
                        this.addToLog(key + " = " + value);
                }


                // Input file
                this.#inputEl.addEventListener('change', this.handleFileInput);

                // Check for File Handling launch queue
                if ('launchQueue' in window && 'files' in LaunchParams.prototype) {
                        this.addToLog("File Handling API supported");
                        launchQueue.setConsumer(async (launchParams) => {
                                // Nothing to do when the queue is empty.
                                this.addToLog(`Files in queue: ${launchParams.files?.length}`);
                                if (!launchParams.files.length) {
                                        return;
                                }
                                for (const fileHandle of launchParams.files) {
                                        // Handle the file.
                                        this.addToLog(`[${fileHandle.kind}] ${fileHandle.name}`);

                                        const file = await fileHandle.getFile();

                                        this.loadGeoJSONFile(file);

                                }
                        });
                } else {
                        this.addToLog("File Handling API NOT supported");
                }
        }

        handleFileInput(evt) {
                const [file] = evt.target.files;

                this.loadGeoJSONFile(file);
        }

        loadGeoJSONFile(file) {
                const reader = new FileReader();

                reader.addEventListener(
                        "load",
                        () => {
                                console.log('file text',reader.result);
                                try {
                                        const geoJson = JSON.parse(reader.result);
                                        this.#mapView.plotGeoJSON(geoJson);
                                        this.addToLog(`${file.name} is valid JSON, trying to display on map...`);
                                } catch (err) {
                                        this.addToLog(`Error parsing file: ${file.name}`);
                                }
                        },
                        false);

                reader.readAsText(file);
        }

}
customElements.define('main-app', MainApp);
