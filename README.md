Leaflet Routing Machine / HERE
=====================================

Extends [Leaflet Routing Machine](https://github.com/perliedman/leaflet-routing-machine) with support for [Here](https://developer.here.com/rest-apis/documentation/routing/topics/overview.html) routing API.

Some brief instructions follow below, but the [Leaflet Routing Machine tutorial on alternative routers](http://www.liedman.net/leaflet-routing-machine/tutorials/alternative-routers/) is recommended.

## Installing

```sh
npm install --save leaflet-routing-machine-here
```

## Using

There's a single class exported by this module, `L.Routing.Here`. It implements the [`IRouter`](http://www.liedman.net/leaflet-routing-machine/api/#irouter) interface. Use it to replace Leaflet Routing Machine's default OSRM router implementation:

```javascript
var L = require('leaflet');
require('leaflet-routing-machine');
require('lrm-here'); // This will tack on the class to the L.Routing namespace

L.Routing.control({
    router: new L.Routing.Here('your Here app id', 'your Here app code'),
}).addTo(map);
```

Note that you will need to pass a valid Here app code and app id to the constructor.


This is forked version based on [trailbehind](https://github.com/trailbehind/lrm-Here)

## RouteRestriction `routeRestriction`
Since the 1.1.0 version, you can calculate the route witch attributes of the route. To achieve this set `generateMode: true` and fill options under `routeRestriction` object using properties from below.

  | Property     | Type    | Default | Options |
  | ------       | -----   | ------- | ------- |
  | avoidHighways| boolean | | |  
  | avoidTolls   | boolean | | |
  | avoidFerries | boolean | | |
  | vehicleType  | string  | car |  [Available options](https://developer.here.com/documentation/routing/topics/resource-param-type-routing-mode.html#type-transport-mode) |
  | routeType    | string  | fastest | [Available options](https://developer.here.com/documentation/routing/topics/resource-param-type-routing-mode.html#type-routing-type) |

### WARNING
`generateMode` is by default `false` - Leaflet will calculate route using manually inserted mode (default `fastest;car;`)
