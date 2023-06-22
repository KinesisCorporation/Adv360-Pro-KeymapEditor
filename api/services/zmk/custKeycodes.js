const fs = require('fs')
const path = require('path')
const filter = require('lodash/filter')
const flatten = require('lodash/flatten')
const get = require('lodash/get')
const keyBy = require('lodash/keyBy')
const map = require('lodash/map')
const uniq = require('lodash/uniq')

const { INSPECT_MAX_BYTES } = require('buffer')

class CustKeycodesValidationError extends Error {
  constructor (errors) {
    super()
    this.name = 'CustKeycodesValidationError'
    this.errors = errors
  }
}

function shortestAlias (aliases) {
  return [...aliases]
    .sort((a, b) => a.length - b.length)[0]
    .replace(/^KC_/, '')
}

function parseCustKeycodes (custKeycodes) {
  var parse = []
  if (custKeycodes) {
    const fnPattern = /^(.+?)\((code)\)$/

    parse = custKeycodes.reduce((keycodes, keycode) => {
        const { description, context, symbol, type } = keycode
        const aliases = keycode.names.filter(name => !name.match(fnPattern))
        const fnCode = keycode.names.map(name => name.match(fnPattern)).filter(v => !!v)[0]
        const base = { aliases, description, context, symbol: symbol || shortestAlias(aliases), type: type, params: [] }

        for (let code of aliases) {
          keycodes.push(Object.assign({}, base, {
            code,
            isModifier: !!fnCode
          }))
        }

        if (fnCode) {
          keycodes.push(Object.assign({}, base, {
            code: fnCode[1],
            params: fnCode[2].split(',')
          }))
        }

        return keycodes
      }, [])
  }
  return parse
}

function generateCustKeycodes(custKeycodes) {
  return JSON.stringify(generateText(custKeycodes), null, '\t')//
}

function generateText (custKeycodes) {
  var items = [];

  if (custKeycodes && custKeycodes.length > 0) {
    custKeycodes.map(item => {
        var newKey = {}
        newKey.names = []
        newKey.names.push(item.code)
        newKey.description = item.description
        newKey.clarify = false
        newKey.documentation = ""
        newKey.os = {
            "windows": true,
            "linux": true,
            "android": true,
            "macos": true,
            "ios": true
        }
        newKey.footnotes = {}
        newKey.type = item.type

        items.push(newKey)
    })
  }
  
  return items
}

function validateCustKeycodesJson(custKeycodes) {
  const errors = []

  if (errors.length) {
    throw new CustKeycodesValidationError(errors)
  }
}

module.exports = {
  CustKeycodesValidationError,
  parseCustKeycodes,
  generateCustKeycodes,
  validateCustKeycodesJson
}
