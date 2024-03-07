---
title: Handling files in enterprise web solutions
published: true
description: Using the File Handling API to create file use shortcuts for enterprise
tags: Enterprise, Web, Fugu
cover_image: https://dev-to-uploads.s3.amazonaws.com/uploads/articles/etb4l3kbqfhzioch2hs7.jpeg
published_at: 2024-03-04 18:20 +0100
---

Correct file handling can be cumbersome without proper system integration and selection of which applications can handle what types of files.

Web solutions have previously been disconnected from this because of limitations in the browser to system integration.

This is no longer the case, and this post will cover the key parts of making a solution that works.

To make things more concrete, we will look at how to create a simple [GeoJSON](https://geojson.org/) viewer application that will automatically open and display GeoJSON files when double-clicking them (or selecting the app on "Open with...").

> Note: This feature is [desktop only](https://developer.mozilla.org/en-US/docs/Web/Manifest/file_handlers#browser_compatibility)


## File Handling in manifest.json
In the file manager and the desktop view of most operating systems, there is a file handling UI that directs the user to use a certain app to handle the chosen file.  Previously, this was limited to native app installations, but now, it's possible for web applications to register handlers tied to PWAs that will handle files matching certain extension patterns.

Thomas Steiner has created a great article about this here:

https://developer.chrome.com/docs/capabilities/web-apis/file-handling


## What's needed
1. `file_handlers` entries in manifest.json
2. Code to handle loading the files
3. Installation of the web application

Let's look at these one by one.


### `file_handlers` in manifest.json
> Note: In order to make the web application 'installable', a manifest file needs to be present with minimal information as described [here](https://web.dev/articles/install-criteria).

Inside the manifest file, create a section with the key [`file_handlers`](https://developer.chrome.com/docs/extensions/reference/manifest/file-handlers).  This contains an array of the file types that the application can handle (`accept`), which URL to open (`action`, must be within the scope of the installed PWA), icons and `launch_type`, describing if new instances should be made for each file on "Open with..." selection.

```json
...
"file_handlers": [
  {
    "action": "./?log=y",
    "accept": {
      "application/geo+json": [".geojson"]
    },
    "icons": [
      {
        "src": "./images/treasure-map-256.png",
        "sizes": "256x256",
        "type": "image/png"
      }
    ],
    "launch_type": "multiple-clients"
  }
]
...
```

In our case, we are interested in handling files with the `.geojson` extension and we will send it to our PWA with an additional query parameter to enable debug logging (`log=y`).


### File loading handler(s)
When the PWA is opened by the OS via an "Open with..." action, the file(s) selected will be available through the [`launchQueue`](https://developer.mozilla.org/en-US/docs/Web/API/LaunchQueue) interface:

```javascript
if ('launchQueue' in window && 'files' in LaunchParams.prototype) {
  launchQueue.setConsumer(async (launchParams) => {
    if (!launchParams.files.length) {
      return;
    }
    for (const fileHandle of launchParams.files) {
      // Handle the file.
      const file = await fileHandle.getFile();
      this.loadGeoJSONFile(file);
    }
  });
} else {
  console.log("File Handling API NOT supported");
}
```


### Installation and usage
Open the application in a [supported browser](https://developer.mozilla.org/en-US/docs/Web/Manifest/file_handlers#browser_compatibility) and click the install icon in the address bar.

![Install PWA](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/usvmj4gpu5bxqcp2u0ff.png)

Then go to the file explorer, right click a GeoJSON file (with the `.geojson` extension) and see how the freshly installed PWA is now registered to handle GeoJSON files.

![Open with PWA](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/km8pb387umeqmd8wd21g.png)

On first launch, the user is prompted to check if this should be the default behavior:

![Default open with](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/9ii2l854z9yvsv3hke5b.png)

When the PWA starts, the GeoJSON is loaded, passed to the map and immediately displayed:

![GeoJSON loaded](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/d4cl170c5xenvyslbvj7.png)

> Note: The collapsible activity log in the bottom of the screen is activated because of the additional `log=y` passed to the application.

### Windows and Edge
The section above describes how the flow looks when using Chrome and Ubuntu.  Here we will go through the same flow, but using Edge on Windows.

_Credit: @kennethrohde_

Installation:
![Edge Install PWA](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/26pafpf7ur9024hh0hr5.jpeg)

Open `.geojson` file with the PWA:
![Edge Open With](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/cq2aigbs5tkalndu9c1n.jpeg)

Loading GeoJSON:
![Edge Loading GeoJSON](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/tpblmz7s6f051lnd61k5.jpeg)


## OpenLayers
In order to display the GeoJSON features on a map, we will use [OpenLayers](https://openlayers.org/), which is a very powerful [open-source](https://github.com/openlayers/openlayers) mapping library that is also very simple to use.

In this post, we will not dive into all the details, so I will just show the snippets related to initializing the map and adding the GeoJSON data on top:

```javascript
...
// Init map
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

...

// Load GeoJSON
plotGeoJSON(obj) {
  const features = new ol.format.GeoJSON({
    featureProjection: 'EPSG:3857'
  }).readFeatures(obj);

  const vectorSource = new ol.source.Vector({ features });

  this.#vectorLayer.setSource(vectorSource);

  setTimeout(() => {
    this.#map.getView().fit(vectorSource.getExtent(), { duration: 1000 });
  }, 500);
}
```

## Creating GeoJSON files
Inside the project [repository](https://github.com/larsgk/filehandling-geojson), there are [a few GeoJSON samples](https://github.com/larsgk/filehandling-geojson/tree/main/geojson) generated with the awesome GeoJSON editor here: [geojson.io](https://geojson.io/).  This web application let's you create features by drawing on a map and the features are then immediately reflected in a GeoJSON format on the right side of the screen.

![Screenshot of geojson.io](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/m0kel38tgsqrmgw6e19w.png)


_TIL GitHub has a nice GeoJSON viewer built-in:_

![GitHub GeoJSON](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/qib609vbuky2l32fgr26.png)


## Conclusion
Having the option of adding file handling on a system level is a very powerful feature and also extremely useful, e.g for enterprise tools to optimize workflows.

The effort involved in adding the feature in a PWA is close to nothing and personally I enjoyed experimenting with this very much.

The code is available here:  https://github.com/larsgk/filehandling-geojson

The application is hosted here:  https://larsgk.github.io/filehandling-geojson


Enjoy ;)
