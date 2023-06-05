/**
 * Get the internal ID of a sublist in NetSuite
 * @param {N/record.Record} record - The NetSuite record object
 * @param {string} sublistName - The name of the sublist
 * @returns {string} The internal ID of the sublist
 */
function getSublistId(record, sublistName) {
    var sublistObj = record.getSublist({
      sublistId: sublistName
    })
    if (sublistObj) {
      return sublistObj.id
    }
    return null
  }
  