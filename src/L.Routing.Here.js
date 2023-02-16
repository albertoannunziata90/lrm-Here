(function () {
	'use strict';

	const L = require('leaflet');
	const corslite = require('corslite');
	const flexiblePolyline = require('@liberty-rider/flexpolyline');
	const objectToFormData = require('object-to-formdata');
	const merge = require('deepmerge');

	L.Routing = L.Routing || {};

	L.Routing.Here = L.Class.extend({
		options: {
			serviceUrl: 'https://router.hereapi.com/v8/routes',
			timeout: 30 * 1000,
			noticesTypeAsRouteError: ['critical'], 
			alternatives: 0,
			urlParameters: {},
			routeRestriction: {
				transportMode: 'car',
				routingMode: 'fast'
			}
		},

		initialize: function (apiKey, options) {
			this._apiKey = apiKey;
			L.Util.setOptions(this, merge(options, this.options));
			this.options.urlParameters.return = ['polyline,summary,turnByTurnActions', this.options.urlParameters.return].filter(t => t).join(',');
		},

		route: function (waypoints, callback, context, options) {
			var timedOut = false,
				wps = [],
				url,
				timer;

			options = options || {};
			url = this.buildRouteUrl(waypoints, options);

			timer = setTimeout(function () {
				timedOut = true;
				callback.call(context || callback, {
					status: -1,
					message: 'Here request timed out.'
				});
			}, this.options.timeout);

			// Let reference here, problem when reverse geocoding point took to long, didnt have name here
			wps = waypoints;

			return corslite(url, L.bind(function (err, resp) {
				var data;

				clearTimeout(timer);
				if (!timedOut) {
					if (!err) {
						data = JSON.parse(resp.responseText);
						this._routeDone(data, wps, callback, context);
					} else {
						callback.call(context || callback, {
							status: -1,
							message: 'HTTP request failed: ' + err,
							type: err.type
						});
					}
				}
			}, this));
		},

		_routeDone: function (response, inputWaypoints, callback, context) {
			context = context || callback;
			if (!response.routes || response.routes.length === 0) {
				callback.call(context, {
					// TODO: include all errors
					status: response.type,
					message: response.details
				});
				return;
			}

			if (this.options.noticesTypeAsRouteError) {
				const routeCriticalNotices = [];

				response.routes.forEach((route) =>
					route.sections.forEach((section) =>
						(section.notices || []).forEach((notice) => {
							if (this.options.noticesTypeAsRouteError.includes(notice.severity)) {
								routeCriticalNotices.push(notice);
							}
						})
					)
				);

				if (routeCriticalNotices.length > 0) {
					callback.call(context, {
						status: 'routeCriticalNotice',
						message: routeCriticalNotices.map(notice => notice.title).join(';')
					});

					return;
				}
			}

			const roadsLabels = [];

			const callbackData = response.routes.map((route) => {
				const defaultValue = {
					name: '',
					longestRoadLabels: [],
					coordinates: [],
					instructions: [],
					summary: {
						totalDistance: 0,
						totalTime: 0,
					},
					inputWaypoints,
					waypoints: [],
					originalRouteObject: route,
				};

				return route.sections.reduce((acc, section, index) => {
					let offsetPadding = acc.coordinates.length;
					acc.coordinates.push(...flexiblePolyline.decode(section.polyline).polyline);
					acc.summary.totalDistance += section.summary.length;
					acc.summary.totalTime += section.summary.duration;

					if (index === 0) {
						const waypoint = section.arrival.place.location;
						acc.waypoints.push(new L.LatLng(waypoint.lat, waypoint.lng));
					}
					
					if (index === route.sections.length - 1 || index !== 0) {
						const waypoint = section.departure.place.location;
						acc.waypoints.push(new L.LatLng(waypoint.lat, waypoint.lng));
					}

					const { instructions, roadLabels } = this._parseInstructions(section.turnByTurnActions, offsetPadding, roadsLabels);

					acc.instructions.push(...instructions);
					const roadNameSegments = roadLabels.map(label => label.text);
					acc.name = roadNameSegments.join(', ');
					roadsLabels.push(roadNameSegments);

					return acc;
				}, defaultValue);
			});

			callback.call(context, null, callbackData);
		},

		buildRouteUrl: function (waypoints, options) {
			const vehicleRestrictions = this._attachVehicleRestrictions(this.options);
			const mode = Object.keys(vehicleRestrictions).length > 0 ? 'truck' : this.options.routeRestriction.transportMode ?? 'car';

			const params = merge({
				apiKey: this._apiKey,
				transportMode: mode,
				routingMode: this.options.routeRestriction.routeMode || 'fast',
				departureTime: this.options.routeRestriction.hasOwnProperty('departureTime') ? this.options.routeRestriction.departureTime : 'any',
				avoid: {
					features: this._buildAvoidFeatures(this.options)
				},
				alternatives: this.options.alternatives,
				vehicle: vehicleRestrictions
			}, this.options.urlParameters);
			
			const locs = waypoints.reduce((acc, waypoint, i) => {
				const paramName = i === 0 ? 'origin' : i === waypoints.length - 1 ? 'destination' : 'via';
				acc.push(paramName + '=' + waypoint.latLng.lat + ',' + waypoint.latLng.lng);

				return acc;
			}, []);

			const baseUrl = this.options.serviceUrl + '?' + locs.join('&');
			const formData = objectToFormData.serialize(params);
			[...formData.keys()].forEach((key) => {
				if (!formData.get(key)) {
					formData.delete(key);
				}
			});

			return baseUrl + '&' + new URLSearchParams(formData).toString();
		},

		_buildAvoidFeatures: function (options) {
			const features = [];

			if (!options.hasOwnProperty('routeRestriction')) {
				return null;
			}

			if (options.routeRestriction.avoidHighways === true) {
				features.push('controlledAccessHighway');
			}

			if (options.routeRestriction.avoidTolls === true) {
				features.push('tollRoad');
			}

			if (options.routeRestriction.avoidFerries === true) {
				features.push('ferry');
			}

			if (options.routeRestriction.avoidDirtRoad === true) {
				features.push('dirtRoad');
			}

			return features.join(',');
		},

		_attachVehicleRestrictions: function (options) {
			const _truckRestrictions = {};
			const allowedParameters = ['height', 'width', 'length', 'grossWeight', 'weightPerAxle', 'shippedHazardousGoods', 'trailerCount'];

			if (!options.hasOwnProperty('routeRestriction')
				|| !options.hasOwnProperty('truckRestriction')
				|| options.routeRestriction.transportMode !== 'truck') {
				return _truckRestrictions;
			}

			if (options.truckRestriction.hasOwnProperty('shippedHazardousGoods')) {
				if (Array.isArray(options.truckRestriction['shippedHazardousGoods'])) {
					options.truckRestriction['shippedHazardousGoods'] = options.truckRestriction['shippedHazardousGoods'].join();
				}
			}

			for (const property in options.truckRestriction) {
				if (!options.truckRestriction.hasOwnProperty(property)
					|| allowedParameters.indexOf(property) === -1
					|| options.truckRestriction[property] === ''
					|| options.truckRestriction[property] === null) {
					continue;
				}

				_truckRestrictions[property] = options.truckRestriction[property];
			}
			_truckRestrictions.type = 'straightTruck';


			return _truckRestrictions;
		},

		_parseInstructions: function (instructions, offsetPadding, existingRoadNameSegments) {
			return instructions.reduce((acc, instruction) => {
				if (instruction.nextRoad && (instruction.nextRoad.name || instruction.nextRoad.number)) {
					const roadLabel = {
						index: instruction.offset + offsetPadding,
						length: instruction.length,
						text: this._getInstructionRoadLabel(instruction)
					}
					const labelExists = acc.roadLabels.find(label => label.text === roadLabel.text);

					if (!labelExists && acc.roadLabels.length < 2) {
						if (!acc.roadLabels[0] || !this._labelCombinationSegmentExists(existingRoadNameSegments, [acc.roadLabels[0].text, roadLabel.text])) {
							acc.roadLabels.push(roadLabel)
						}
					} else if (!labelExists) {
						const shortestInstructionIndex = acc.roadLabels.findIndex((i) => i.length < instruction.length);
						const newLabels = [...acc.roadLabels.filter((_, index) => index !== shortestInstructionIndex).map((i) => i.text), roadLabel.text];
						const combinationExists = this._labelCombinationSegmentExists(existingRoadNameSegments, newLabels);

						if (shortestInstructionIndex >= 0 && !combinationExists) {
							acc.roadLabels[shortestInstructionIndex] = roadLabel;
							acc.roadLabels.sort((a, b) => a.index - b.index);
						}
					}
				}

				acc.instructions.push({
					text: `${instruction.action} ${instruction.direction ?? ''}`,
					distance: instruction.length,
					time: instruction.duration,
					index: offsetPadding + instruction.offset,
					type: instruction.action,
				});

				return acc;
			}, { instructions: [], roadLabels: [] })
		},

		_getInstructionRoadLabel(instruction) {
			const r = instruction.nextRoad.number ?? instruction.nextRoad.name;
			return r ? r[0].value : '';
		},

		_labelCombinationSegmentExists(segments, combinationSegments) {
			return segments.some(roadSegment =>
				roadSegment.every(segment => {
					return combinationSegments.includes(segment);
				})
			);
		}
	});

	L.Routing.here = function (apiKey, options) {
		return new L.Routing.Here(apiKey, options);
	};

	module.exports = L.Routing.Here;
})();
