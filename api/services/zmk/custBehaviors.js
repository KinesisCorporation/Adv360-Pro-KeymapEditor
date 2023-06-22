const fs = require('fs')
const path = require('path')
const filter = require('lodash/filter')
const flatten = require('lodash/flatten')
const get = require('lodash/get')
const keyBy = require('lodash/keyBy')
const map = require('lodash/map')
const uniq = require('lodash/uniq')

const { INSPECT_MAX_BYTES } = require('buffer')

class CustBehaviorsValidationError extends Error {
  constructor (errors) {
    super()
    this.name = 'CustBehaviorsValidationError'
    this.errors = errors
  }
}

function parseCustBehaviors(custBehaviors){
  if (custBehaviors)
    return custBehaviors
  else
    return []
}

function generateCustBehaviors(custBehaviors) {
  return JSON.stringify(generateText(custBehaviors), null, '\t')//
}

function generateText (custBehaviors) {
  var items = [];

  if (custBehaviors && custBehaviors.length > 0) {
    custBehaviors.map(item => {
      if (item.isNew) {
        var newKey = {}
        newKey.code = item.code
        newKey.name = item.name
        newKey.params = item.params
        newKey.type = "UD"

        items.push(newKey)
      }
      else
        items.push(item)
    })
  }
  return items
}

function validateCustBehaviorsJson(custBehaviors) {
  const errors = []

  if (errors.length) {
    throw new CustBehaviorsValidationError(errors)
  }
}

module.exports = {
  CustBehaviorsValidationError,
  parseCustBehaviors,
  generateCustBehaviors,
  validateCustBehaviorsJson
}
