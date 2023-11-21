const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')
const { parseKeymap } = require('./keymap')
const { parseMacro } = require('./macro')

const ZMK_PATH = path.join(__dirname, '..', '..', '..', 'zmk-config')
const KEYBOARD = 'dactyl'

const EMPTY_KEYMAP = {
  keyboard: 'unknown',
  keymap: 'unknown',
  layout: 'unknown',
  layer_names: ['default'],
  layers: [[]]
}

const EMPTY_MACRO = {
}

const EMPTY_CUSTOM = []


function loadBehaviors() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'zmk-behaviors.json')))
}

function loadCustomBehaviors() {
  const filePath = path.join(ZMK_PATH, 'config', 'cust_behaviors.json')
  const content = fs.existsSync(filePath)
    ? JSON.parse(fs.readFileSync(filePath))
    : EMPTY_CUSTOM
    
  return content;
}

function loadKeycodes() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'zmk-keycodes.json')))
}

function loadCustomKeycodes() {
  const filePath = path.join(ZMK_PATH, 'config', 'cust_keycodes.json')
  const content = fs.existsSync(filePath)
    ? JSON.parse(fs.readFileSync(filePath))
    : EMPTY_CUSTOM
    
  return content;
}

function loadLayout (layout = 'LAYOUT') {
  const layoutPath = path.join(ZMK_PATH, 'config', 'info.json')
  var layout = JSON.parse(fs.readFileSync(layoutPath)).layouts[layout].layout
  return layout;
}

function loadKeymap () {
  const keymapPath = path.join(ZMK_PATH, 'config', 'keymap.json')
  const keymapContent = fs.existsSync(keymapPath)
    ? JSON.parse(fs.readFileSync(keymapPath))
    : EMPTY_KEYMAP

  var keymap = parseKeymap(keymapContent)
  return keymap
}

function loadMacro () {
  const macroPath = path.join(ZMK_PATH, 'config', 'macros.dtsi')
  const macroContent = fs.existsSync(macroPath)
     ? fs.readFileSync(macroPath, {encoding:'utf8'})
     : EMPTY_MACRO
    
  return parseMacro(macroContent)
}

function findKeymapFile () {
  const files = fs.readdirSync(path.join(ZMK_PATH, 'config'))
  return files.find(file => file.endsWith('.keymap'))
}

function exportKeymap (generatedKeymap, flash, callback) {
  const keymapPath = path.join(ZMK_PATH, 'config')
  const keymapFile = findKeymapFile()

  fs.existsSync(keymapPath) || fs.mkdirSync(keymapPath)
  fs.writeFileSync(path.join(keymapPath, 'keymap.json'), generatedKeymap.json)
  fs.writeFileSync(path.join(keymapPath, keymapFile), generatedKeymap.code)

  // Note: This isn't really helpful. In the QMK version I had this actually
  // calling `make` and piping the output in realtime but setting up a ZMK dev
  // environment proved to be more complex than I had patience for, so for now
  // I'm writing changes to a zmk-config repo and counting on the predefined
  // GitHub action to actually compile.
  return childProcess.execFile('git', ['status'], { cwd: ZMK_PATH }, callback)
}

function exportMacro(macroJSON, flash, callback) {
  const macroPath = path.join(ZMK_PATH, 'config')

  fs.existsSync(macroPath) || fs.mkdirSync(macroPath)
  fs.writeFileSync(path.join(macroPath, 'macros.dtsi'), macroJSON)

  return childProcess.execFile('git', ['status'], { cwd: ZMK_PATH }, callback)
}

function exportCustKeycodes(customJson, flash, callback) {
  const filePath = path.join(ZMK_PATH, 'config')

  fs.existsSync(filePath) || fs.mkdirSync(filePath)
  fs.writeFileSync(path.join(filePath, 'cust_keycodes.json'), customJson)

  return childProcess.execFile('git', ['status'], { cwd: ZMK_PATH }, callback)
}

function exportCustBehaviors(customJson, flash, callback) {
  const filePath = path.join(ZMK_PATH, 'config')

  fs.existsSync(filePath) || fs.mkdirSync(filePath)
  fs.writeFileSync(path.join(filePath, 'cust_behaviors.json'), customJson)

  return childProcess.execFile('git', ['status'], { cwd: ZMK_PATH }, callback)
}

function exportVersion(versionJSON, flash, callback) {
  const versionPath = path.join(ZMK_PATH, 'config')

  fs.existsSync(versionPath) || fs.mkdirSync(versionPath)
  fs.writeFileSync(path.join(versionPath, 'version.dtsi'), versionJSON)

  return childProcess.execFile('git', ['status'], { cwd: ZMK_PATH }, callback)
}

module.exports = {
  loadBehaviors,
  loadKeycodes,
  loadCustomBehaviors,
  loadCustomKeycodes,
  loadLayout,
  loadKeymap,
  exportKeymap,
  loadMacro,
  exportMacro,
  exportCustBehaviors,
  exportCustKeycodes,
  exportVersion
}
