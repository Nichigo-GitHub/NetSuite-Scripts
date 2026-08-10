/**
 *    Copyright 2016 NetSuite Inc. User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope Public
 */
define(['N/runtime', 'N/search', './wms_utility', './wms_translator'],

	function (runtime, search, utility, translator) {

		/**
		 * Gets warehouse locations configured for logged in user.
		 *
		 * @param {Object} requestParams - Parameters from HTTP request URL;
		 * @returns {Object} object with array of applicable warehouse
		 * @since 2015.1
		 */
		function doPost(requestBody) {

			var requestParams = '';
			var debugString = '';
			var warehouseListDetails = {};
			try {
				if (utility.isValueValid(requestBody)) {
					var requestParamsObj = requestBody.params;
					var inventoryFromWarehouseLocId = requestParamsObj.inventoryFromWarehouseLocId;
					var processType = requestParamsObj.processType;

					warehouseListDetails['getLanguage'] = utility.getCurrentUserLanguage();
					warehouseListDetails['userAccountId'] = runtime.accountId;
					var vRolebasedLocation = [];
					vRolebasedLocation = utility.getRoleBasedLocation(processType);
					warehouseListDetails['vRolebasedLocation'] = vRolebasedLocation;
					if (vRolebasedLocation.length === 0)
						//oneoworld account case when no location is configured, show all location
						vRolebasedLocation = utility.getAllLocations();
					// Remove source warehouse from destination list during inventory transfer
					if (processType === 'inventoryTransfer' && utility.isValueValid(inventoryFromWarehouseLocId)) {
						var index = vRolebasedLocation.indexOf(inventoryFromWarehouseLocId);
						if (index > -1)
							vRolebasedLocation.splice(index, 1);
					}
					var roleBasedLocationArray = this.getLocationName(vRolebasedLocation, inventoryFromWarehouseLocId);
					debugString += " roleBasedLocationArray : " + JSON.stringify(roleBasedLocationArray);
					warehouseListDetails['roleBasedLocationArray'] = roleBasedLocationArray;
					warehouseListDetails['isValid'] = true;

					if (roleBasedLocationArray.length === 0) {
						warehouseListDetails['errorMessage'] = translator.getTranslationString('PO_WAREHOUSELIST.NOT_CONFIGURED');
						warehouseListDetails['isValid'] = false;
					} else {
						try {
							var dataObj = {
								'bundleName': 'WMS',
								'executionContext': 'FeatureUsage',
								'language': runtime.getCurrentUser().getPreference('LANGUAGE')
							};
							utility.logDatatoELK(dataObj);
						} catch (e) {
							log.error({ title: 'errorMessage in elk datalog', details: e.message + ' Stack :' + e.stack });
						}
					}
				}
				else {
					warehouseListDetails['errorMessage'] = translator.getTranslationString('PO_WAREHOUSELIST.NOT_CONFIGURED');
					warehouseListDetails['isValid'] = false;
				}
			}
			catch (e) {
				warehouseListDetails['isValid'] = false;
				warehouseListDetails['errorMessage'] = e.message;
				log.error({ title: 'errorMessage', details: e.message + " Stack :" + e.stack });
				log.error({ title: 'debugString', details: debugString });
			}
			return warehouseListDetails;
		}

		/**
		 * Get location names and apply transfer restrictions.
		 */
		function getLocationName(vRoleLocation, inventoryFromWarehouseLocId) {
			var locationArray = [];

			var filters = [];
			if (vRoleLocation.length > 0)
				filters.push(search.createFilter({
					name: 'internalid',
					operator: search.Operator.ANYOF,
					values: vRoleLocation
				}));
			var columns = [];
			columns.push(search.createColumn({
				name: 'name'
			}));
			columns.push(search.createColumn({
				name: 'usesbins'
			}));
			var locationNameSearch = search.create({
				type: 'location',
				filters: filters,
				columns: columns
			});

			var locationNames = utility.getSearchResultInJSON(locationNameSearch);

			for (var i in locationNames) {
				var fromLoc = Number(inventoryFromWarehouseLocId);
				var toLoc = Number(locationNames[i]['id']);

				// Restricted transfer combinations
				var isRestrictedTransfer =
					(fromLoc === 866 && toLoc === 869) ||
					(fromLoc === 867 && toLoc === 869) ||
					(fromLoc === 897 && toLoc === 885);

				// Skip restricted destinations
				if (isRestrictedTransfer) {
					continue;
				}

				var locationObj = {};

				locationObj['id'] = locationNames[i]['id'];
				locationObj['name'] = locationNames[i]['name'];
				locationObj['locUseBinsFlag'] = locationNames[i]['usesbins'];
				locationArray.push(locationObj);
			}

			return locationArray;
		}


		return {
			post: doPost,
			getLocationName: getLocationName
		};

	});
	