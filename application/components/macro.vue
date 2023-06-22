<script>
import filter from 'lodash/filter'
import get from 'lodash/get'
import keyBy from 'lodash/keyBy'
import fuzzysort from 'fuzzysort'
import { getKeyStyles } from '../key-units'

import { getBehaviourParams } from '../keymap'
import { getKeyBoundingBox } from '../key-units'
import Modal from './modal.vue'
import ValuePicker from './value-picker.vue'
import InputDialog from './input-dialog.vue'
import Key from './key.vue'
import isEmpty from 'lodash/isEmpty'

export default {
  name: 'macro',
  emits: ['macroupdate'],
  components: {
    Modal,
    ValuePicker,
    InputDialog,
    'key-thing': Key,
  },
  props: {
    target: Object,
    choices: Array,
    param: [String, Object],
    params: Object,
    value: String,
    prompt: String,
    searchKey: String,
    searchThreshold: {
      type: Number,
      default: 10
    },
    showAllThreshold: {
      type: Number,
      default: 50,
      validator: value => value >= 0
    },
    keymap: Object,
  },
  emits: ['cancel', 'done'],
  inject: [
    'keycodes',
    'behaviours',
    'indexedKeycodes',
    'indexedBehaviours'
  ],
  provide() {
    return {
      getSearchTargets: this.getSearchTargets,
      getSources: this.sources
    }
  },
  data() {
    return {
      query: null,
      highlighted: null,
      showAll: false,
      selectedMacro: null,
      selectedIdx: -1,
      editing: null,
      editingMacro: false,
      saving: false,
      addMacro: false,
      macroMax: 15
    }
  },
computed: {
  availableLayers() {
    if (isEmpty(this.keymap)) {
      return []
    }

    return this.keymap.layers.map((_, i) => ({
      code: i,
      description: this.keymap.layer_names[i] || `Layer ${i}`
    }))
  },
  normalized() {
    const { value, params } = this
    const sources = this.sources()
    const commands = keyBy(this.behaviour.commands, 'code')

    function getSourceValue(value, as) {
      if (as === 'command') return commands[value]
      if (as === 'raw' || as.enum) return { code: value }
      if (as === 'macro') return { code: value }
      return sources[as][value]
    }

    function normalize(node, as) {
      if (!node) {
        return { value: undefined, params: [] }
      }
      const { value, params } = node
      const source = getSourceValue(value, as)

      return {
        value,
        source,
        params: get(source, 'params', []).map((as, i) => (
          normalize(params[i], as)
        ))
      }
    }

    return {
      value,
      source: this.behaviour,
      params: this.behaviourParams.map((as, i) => (
        normalize(params[i], as)
      ))
    }
  },
  behaviour() {
    const bind = this.value
    const sources = this.sources()
    var value = get(sources, ['behaviours', bind])
    //If behavior not found, replace with none
    if (!value)
      value = get(sources, ['behaviours', "&none"])
    return value
  },
  behaviourParams() {
    return getBehaviourParams(this.params, this.behaviour)
  },
  macro() {
    const { query, choices } = this

    return choices
  },
  key() {
    return this.selectedMacro.keys
  },
  enableShowAllButton() {
      return (
        !this.showAll &&
        this.choices.length > this.searchThreshold &&
        this.choices.length <= this.showAllThreshold
      )
    },
    style() {
      const rect = this.target.getBoundingClientRect()
      return  {
        // display: 'block',
        // top: `${window.scrollY + (rect.top + rect.bottom) / 2}px`,
        // left: `${window.scrollX + (rect.left + rect.right) / 2}px`
      }
    }
  },
  methods: {
    sources() {
      return {
        kc: this.indexedKeycodes,
        code: this.indexedKeycodes,
        mod: keyBy(filter(this.keycodes, 'isModifier'), 'code'),
        macro: this.macro,
        behaviours: this.indexedBehaviours,
        layer: keyBy(this.availableLayers, 'code')
      }
    },
    isReady() {
      return (
        Object.keys(this.macro).length > 0
      )
    },
    highlightMacro(result) {
      return fuzzysort.highlight(result)
    },
    handleClickResult(result, idx) {
      this.selectMacro(result, idx)
    },
    handleKeyPress(event) {
      setTimeout(() => {
        this.query = event.target.value
      })
    },
    handleSelectActive() {
      if (this.macro.length > 0 && this.highlighted !== null) {
        this.handleClickResult(this.macro[this.highlighted])
      }
    },
    selectMacro(result, idx) {
      this.selectedMacro = result 
      this.selectedIdx = idx
      this.setHighlight(idx)
    },
    setHighlight(initial, offset) {
      if (this.macro.length === 0) {
        this.highlighted = null
        return
      }
      if (offset === undefined) {
        this.highlighted = initial
        return
      }

      this.highlighted = this.highlighted === null ? initial : cycle(this.macro, this.highlighted, offset)
      this.scrollIntoViewIfNeeded(this.$el.querySelector(`.macro li[data-result-index="${this.highlighted}`), false)
    },
    scrollIntoViewIfNeeded (element, alignToTop) {
      const scroll = element.offsetParent.scrollTop
      const height = element.offsetParent.offsetHeight
      const top = element.offsetTop
      const bottom = top + element.scrollHeight

      if (top < scroll || bottom > scroll + height) {
        element.scrollIntoView(alignToTop)
      }
    },
    getSearchTargets(param, behaviour) {
      // Special case for behaviour commands which can dynamically add another
      // parameter that isn't defined at the root level of the behaviour.
      // Currently this is just `&bt BT_SEL` and is only represented as an enum.
      if (param.enum) {
        return param.enum.map(v => ({ code: v }))
      }

      switch (param) {
        case 'behaviour':
          return this.behaviours
        case 'layer':
          return this.availableLayers
        case 'macro':
          return this.macro
        case 'mod':
          return filter(this.keycodes, 'isModifier')
        case 'command':
          return get(this.sources, ['behaviours', behaviour, 'commands'], [])
        case 'kc':
        default:
          return this.keycodes
      }
    },
    boundingBox() {
      return this.layout.map(key => getKeyBoundingBox(
        { x: key.x, y: key.y },
        { u: key.u || key.w || 1, h: key.h || 1 },
        { x: key.rx, y: key.ry, a: key.r }
      )).reduce(({ x, y }, { max }) => ({
        x: Math.max(x, max.x),
        y: Math.max(y, max.y)
      }), { x: 0, y: 0 })
    },
    getWrapperStyle() {
      const bbox = this.boundingBox()
      return {
        width: `${bbox.x}px`,
        height: `${bbox.y}px`,
        margin: '0 auto',
        padding: '40px'
      }
    },
    uClass() { return `key-${this.size.u}u` },
    hClass() { return `key-${this.size.h}h` },
    positioningStyle() {
      return getKeyStyles(this.position, this.size, this.rotation)
    },
    position(key) {
      const { x, y } = key
      return { x, y }
    },
    rotation(key) {
      const { rx, ry, r } = key
      return { x: rx, y: ry, a: r }
    },
    size(key) {
      const { w = 1, u = w, h = 1 } = key
      return { u, h }
    },
    onMouseOver(event) {
      const old = document.querySelector('.highlight')
      old && old.classList.remove('highlight')
      event.target.classList.add('highlight')
    },
    onMouseLeave(event) {
      event.target.classList.remove('highlight')
    },
    addNewMacro(event) {
      this.addMacro = true
    },
    addKey(event) {
      const newObject = { value: "&kp", params: []};
      this.selectedMacro.textArray.push('')
      this.selectedMacro.keys.push(newObject)
    },
    insertKey(idx) {
      const newObject = { value: "&kp", params: []};
      this.selectedMacro.textArray.splice(idx, 0, '')
      this.selectedMacro.keys.splice(idx, 0, newObject)
    },
    createPromptMessage(param) {
      const promptMapping = {
        layer: 'Select layer',
        mod: 'Select modifier',
        behaviour: 'Select behaviour',
        command: 'Select command',
        keycode: 'Select key code'
      }

      if (param.name) {
        return `Select ${param.name}`
      }

      return promptMapping[param] || promptMapping.keycode
    },
    deleteKey(idx) {
      this.selectedMacro.textArray.splice(idx, 1)
      this.selectedMacro.keys.splice(idx, 1)

      this.$emit('macroupdate')
    },
    getSourceValue(value, as) {
      if (as === 'command') return commands[value]
      if (as === 'raw' || as.enum) return { code: value }
      if (as === 'macro') return { code: value }
      const sources = this.sources()

      return sources[as][value]
    },
    normalize(node, as) {
      if (!node) {
        return { value: undefined, params: [] }
      }
      const { value, params } = node
      const source = this.getSourceValue(value, as)

      return {
        value,
        source,
        params: get(source, 'params', []).map((as, i) => (
         this.normalize(params[i], as)
        ))
      }
    },
    handleAddMacro(macroName) {
      var exists = false

      this.macro.filter(function(value) {
        if (value.code.toLowerCase() == macroName.toLowerCase()) {
          alert('This macro name already exists')
          exists = true;
        }
      })

      if (!exists)
      {
        var newMacro = {}
        newMacro.code = macroName.toLowerCase().trim().replace(/ /g, "_").substring(0, this.macroMax)
        newMacro.label = "macro_" + newMacro.code
        newMacro.keys = [];
        newMacro.textArray = [];
        this.macro.unshift(newMacro)
        this.selectMacro(newMacro, 0)

        this.addMacro = false
        this.$emit('macroupdate')
      }
    },
    handleUpdateBind(keyIndex, updatedBinding) {
      this.key[keyIndex] = updatedBinding
      this.$emit('macroupdate')
    },
    deleteMacro(macro) {
      if (confirm("Do you really want to delete " + macro.label + " ?")) {
          var index = this.macro.indexOf(macro);
          if (index !== -1) {
            this.macro.splice(index, 1);
            this.$emit('macroupdate')
          }
      }     
    }
  }
}
</script>

<template>
  <div id="editMacro">
    <span>
      Macros
    </span>
    <button
      @click="addNewMacro"
      :disabled="this.editingMacro"
      title="Add a new macro">
      Add macro
    </button>
    <div class="container">
      <div id="macroList">
          <ul class="macro">
              <li
                  :key="`result-${i}`"
                  :class="{ highlighted: highlighted === i, empty: result.keys.length === 0 }"
                  :title="result.label"
                  :data-result-index="i"
                  v-for="(result, i) in macro"
                  @click="handleClickResult(result, i);">
                  <span v-if="result.search" v-html="highlight(result.search)" />
                  <span v-else v-text="result[searchKey]" />
                  <span class="deleteMacro" @click="deleteMacro(result)" title="Delete this macro">X</span>
              </li>
          </ul>
      </div>
      <div id="macroItems" ref="items">
          <div v-if="selectedMacro" id="macroContainer">
            <div v-for="(item, i) in selectedMacro.keys" :key="`item-key-${i}`" class="macroKeyContainer">
              <span class="addKey" @click="insertKey(i)" title="Insert key here"> + </span>
                  <key-thing
                    :key="item"
                    :position="position(item)"
                    :rotation="rotation(item)"
                    :size="size(item)"
                    :label="item.label"
                    :value="item.value"
                    :params="item.params"
                    :showDel="true"
                    :fromMacro="true"
                    @update="handleUpdateBind(i, $event)"
                    @delete="deleteKey(i)"
                  />
            </div>
            <span class="addKey" @click="addKey" title="Add key here"> + </span>
          </div>
      </div>
    </div>
    <modal v-if="addMacro">
      <input-dialog
        :prompt="'Enter new macro name'"
        :btnText="'Add'"
        :btnHint="'Add new macro'"
        @acceptInput="handleAddMacro"
        @cancelInput="addMacro = false"
      />
    </modal>
  </div>
</template>

<style scoped>

#editMacro {
  margin: 20px;
  width: 80%;
  position: absolute;
  bottom: 5px;
}
.container {
    display: flex;
    align-items: stretch;
}
#macroList {
    width: 300px;
    flex-shrink: 0;
    flex-grow: 0;
}
#macroItems {
    margin-left: 10px;
    flex-grow: 3;
    padding: 5px;
    border: black solid 1px;
    border-radius: 10px;
    background-color: white;
}
#macroContainer {
  display: flex;
  flex-wrap: wrap;
}
.dialog input {
	display: block;
	width: 100%;
	height: 30px;
	line-height: 30px;

	font-size: 120%;
	margin: 0;
	padding: 4px;
	border: none;
	border-radius: 4px;
  box-sizing: border-box;
}
ul.macro {
	font-family: monospace;
	list-style-position: inside;
	list-style-type: none;
	max-height: 200px;
	overflow: scroll;
	padding: 4px;
  margin: 4px 0;
	background: whitesmoke;
  color: black;
	border-radius: 4px;
}
.macro li {
	cursor: pointer;
	padding: 5px;
}
.macro li:hover, .macro li.highlighted {
  background: var(--hover-selection);
	color: white;
}
.macro li b { color: red; }

.choices-counter {
  font-size: 10px;
}

.choices-counter a {
  color: var(--selection);
  border-bottom: 1px dotted var(--selection);
  cursor: pointer;
}

.macroText {
  width: 100%;
  height: 200px;
}
.macroKeyContainer {
  display: flex;
}
.key {
  position: relative !important;
  margin-bottom: 5px;
}

button {
  cursor: pointer;
  background-color: var(--hover-selection);
  color: white;

  font-size: 16px;
  border: none;
  border-radius: 5px;
  padding: 5px;
  margin: 2px;
}

button[disabled] {
  background-color: #ccc;
  cursor: not-allowed;
}

.close {
  position: absolute;
  top: 1px;
  right: 1px;
  z-index:9999;
  font-size: 10px;
  font-weight: bold;
  transition: 0.3s;
  border: 1px solid;
  border-radius: 50%;
  padding-left: 3px;
  padding-right: 3px;
}

/* Change cursor when pointing on button */
.close:hover,
.close:focus {
    text-decoration: none;
    cursor: pointer;
    background-color: #ffffff;
}

.code {
	cursor: pointer;
	display: inline-block;
	box-sizing: content-box;
	min-width: 0.5em;
	text-align: center;
	border-radius: 4px;
}
.code.highlight {
	background-color: white !important;
	color: var(--hover-selection) !important;
}

.addKey {
  position: relative;
  top: 15px;
  height: 15px;
  margin-right: 5px;
  font-size: 15px;
  transition: 0.3s;
  border: 1px solid;
  border-radius: 50%;
  padding-left: 5px;
  padding-right: 5px;
  padding-bottom: 4px;
}

/* Change cursor when pointing on button */
.addKey:hover,
.addKey:focus {
    text-decoration: none;
    cursor: pointer;
    color: white;
    background-color: var(--hover-selection);
}

.deleteMacro {
  float: right;
  top: 1px;
  right: 1px;
  z-index:9999;
  font-size: 10px;
  font-weight: bold;
  transition: 0.3s;
  border: 1px solid;
  border-radius: 50%;
  padding-left: 3px;
  padding-right: 3px;
}

/* Change cursor when pointing on button */
.deleteMacro:hover,
.deleteMacro:focus {
    text-decoration: none;
    cursor: pointer;
    color: white;
    background-color: var(--hover-selection);
}

.empty
{
  background-color: red;
}
</style>