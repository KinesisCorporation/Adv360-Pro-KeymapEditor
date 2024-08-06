import * as api from './api'

export function loadBehaviours () {
  return api.loadBehaviours()
}

export function loadKeycodes () {
  return api.loadKeycodes().then(normalizeZmkKeycodes)
}

export function loadMacro () {
  return api.loadMacro()
}

export function loadCustomBehaviors () {
  return api.loadCustomBehaviors()
}

export function loadCustomKeycodes () {
  return api.loadCustomKeycodes().then(normalizeZmkKeycodes)
}

function shortestAlias (aliases) {
  return [...aliases]
    .sort((a, b) => a.length - b.length)[0]
    .replace(/^KC_/, '')
}

function normalizeZmkKeycodes (keycodes) {
  const fnPattern = /^(.+?)\((code)\)$/

  return keycodes.reduce((keycodes, keycode) => {
    const { description, context, symbol, type, altLangs } = keycode
    const aliases = keycode.names.filter(name => !name.match(fnPattern))
    const fnCode = keycode.names.map(name => name.match(fnPattern)).filter(v => !!v)[0]
    const base = { aliases, description, context, symbol: symbol || shortestAlias(aliases), altLangs: altLangs, type: type, params: [] }

    for (let code of aliases) {
      keycodes.push(Object.assign({}, base, {
        code,
        langCode: "en",
        altLang: "",      
        isModifier: !!fnCode
      }))
    }

    if (altLangs)
    {
      for(var lang in altLangs){
        keycodes.push(Object.assign({}, base, {
          code: aliases[0],
          langCode: lang,
          altLang: altLangs[lang],        
          isModifier: !!fnCode
        }))
      }
    }

    if (fnCode) {
      keycodes.push(Object.assign({}, base, {
        code: fnCode[1],
        langCode: "en",
        altLang: "",     
        params: fnCode[2].split(',')
      }))
    }

    return keycodes
  }, [])
}
