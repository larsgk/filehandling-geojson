// @ts-check

const template = document.createElement('template');
template.innerHTML = `
<style>
@import url('https://cdn.jsdelivr.net/npm/ol@v9.0.0/ol.css');
.map {
        width: 100%;
        height: 400px;
}
</style>

<div id="map" class="map"></div>
`;

export class MapView extends HTMLElement {
        #mapEl
        #vectorLayer
        #map

        constructor() {
                super();

                const shadowRoot = this.attachShadow({mode: 'open'});

        }

        connectedCallback() {
                console.log("connectedCallback - MapView");

                this.shadowRoot?.appendChild(template.content.cloneNode(true));

                this.#mapEl = this.shadowRoot?.querySelector('#map');

                this.#vectorLayer = new ol.layer.Vector({
                        // source: vectorSource,
                });

                this.#map = new ol.Map({
                        layers: [
                          new ol.layer.Tile({
                            source: new ol.source.OSM(),
                          }),
                           this.#vectorLayer,
                        ],
                        target: this.#mapEl,
                        view: new ol.View({
                          center: [0, 0],
                          zoom: 2,
                        }),
                });
        }

        plotGeoJSON(obj) {

                const features = new ol.format.GeoJSON({ featureProjection: 'EPSG:3857' }).readFeatures(obj)
                const vectorSource = new ol.source.Vector({ features });

                this.#vectorLayer.setSource(vectorSource);

                setTimeout(() => {
                        this.#map.getView().fit(vectorSource.getExtent(), { duration: 1000 });
                }, 500);
        }

}
customElements.define('map-view', MapView);
