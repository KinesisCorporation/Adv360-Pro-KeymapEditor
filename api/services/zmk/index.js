const {
  parseKeyBinding,
  generateKeymap,
} = require('./keymap')

const {
  generateMacro
} = require('./macro')

const {
  generateCustKeycodes
} = require('./custKeycodes')

const {
  generateCustBehaviors
} = require('./custBehaviors')


const {
  loadBehaviors,
  loadKeycodes,
  loadCustomBehaviors,
  loadCustomKeycodes,
  loadLayout,
  loadKeymap,
  loadMacro,
  exportKeymap,
  exportMacro,
  exportCustKeycodes,
  exportCustBehaviors,
  exportVersion
} = require('./local-source')

module.exports = {
  parseKeyBinding,
  generateKeymap,
  generateMacro,
  generateCustKeycodes,
  generateCustBehaviors,
  loadBehaviors,
  loadKeycodes,
  loadCustomBehaviors,
  loadCustomKeycodes,
  loadLayout,
  loadKeymap,
  loadMacro,
  exportKeymap,
  exportMacro,
  exportCustKeycodes,
  exportCustBehaviors,
  exportVersion
}
