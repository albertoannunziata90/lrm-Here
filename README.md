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
    router: new L.Routing.Here('your Here api key', { 
        routeRestriction: {
            transportMode: 'truck'
        },
        truckRestriction: {
            height: 300
        },
        urlParameters: { 
            avoid: {
                tollTransponders: 'all'
            }
        } 
    }),
}).addTo(map);
```

Note that you will need to pass a valid Here apiKey to the constructor.

## Options
| Property                | Type                         | Default      | Options |
| ------------------------| ---------------------------- | -------------| ------- |
| alternatives            | number                       | 0            | |
| noticesTypeAsRouteError | string['critical', 'info']   | ['critical'] | |
| routeRestriction        | object<RouteRestriction>     |              | |
| truckRestriction        | object<TruckRestriction>     |              | |
| urlParameters           | object<any>                  | {}           | [Available options](https://developer.here.com/documentation/routing-api/api-reference-swagger.html) |

## RouteRestriction `routeRestriction`

| Property      | Type    | Default | Options |
| ------        | -----   | ------- | ------- |
| avoidHighways | boolean | false   | |
| avoidTolls    | boolean | false   | |
| avoidFerries  | boolean | false   | |
| avoidDirtRoad | boolean | false   | |
| trafficMode   | boolean | false   | |
| transportMode | string  | car     |  [Available options](https://developer.here.com/documentation/routing-api/api-reference-swagger.html) |
| routingMode   | string  | fast    |  [Available options](https://developer.here.com/documentation/routing-api/api-reference-swagger.html) |

## TruckRestriction `truckRestriction`

| Property               | Type      | HumanType | Min | Max |
| ------                 | ----      | --------- | --- | --- |
| height                 | int       | centimeters | 0   | -   |
| width                  | int       | centimeters | 0   | -   |
| length                 | int       | centimeters | 0   | -   |
| grossWeight            | int       | kilograms | 0   | -   |
| weightPerAxle          | int       | kilograms | 0   | -   |
| shippedHazardousGoods  | array [Available options](https://developer.here.com/documentation/routing-api/api-reference-swagger.html)  | | | |
| trailerCount           | int       | count     | 0   | 4   |

This is forked version based on [trailbehind](https://github.com/trailbehind/lrm-Here)
