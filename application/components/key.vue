<template>
  <div
    class="key"
    :class="[uClass, hClass, outlineClass, backKeyClass]"
    :data-label="label"
    :data-u="size.u"
    :data-h="size.h"
    :data-simple="isSimple"
    :data-long="isComplex"
    :style="positioningStyle"
    @mouseover="onMouseOver"
    @mouseleave="onMouseLeave"
  >
    <span
      v-if="behaviour"
      v-text="behaviour.code"
      class="behaviour-binding"
      @click.stop="handleSelectBehaviour"
    />
    <span v-if="showDel" class="deleteKey" @click="handleDelete">X</span>
    <key-paramlist
      :root="true"
      :index="index"
      :params="behaviourParams"
      :values="normalized.params"
      :onSelect="handleSelectCode"
    />
    <modal v-if="editing">
      <value-picker
        :target="editing.target"
        :value="getEditingValue(editing)"
        :param="editing.param"
        :choices="editing.targets"
        :prompt="createPromptMessage(editing.param)"
        searchKey="code"
        @select="handleSelectValue"
        @select-custom="handleSelectCustomValue"
        @cancel="editing = null"
      />
    </modal>
  </div>
</template>

<script>
import cloneDeep from 'lodash/cloneDeep'
import get from 'lodash/get'
import keyBy from 'lodash/keyBy'
import pick from 'lodash/pick'

import { getBehaviourParams } from '../keymap'
import { getKeyStyles } from '../key-units'

import KeyValue from './key-value.vue'
import KeyParamlist from './key-paramlist.vue'
import Modal from './modal.vue'
import ValuePicker from './value-picker.vue'

function makeIndex (tree) {
  const index = []
  ;(function traverse(tree) {
    const params = tree.params || []
    index.push(tree)
    params.forEach(traverse)
  })(tree)

  return index
}

export default {
  props: [
    'position',
    'rotation',
    'size',
    'label',
    'value',
    'params',
    'showDel',
    'fromMacro'
  ],
  emits: ['update', 'delete', 'add-custom-key', 'add-custom-behavior'],
  components: {
    'key-value': KeyValue,
    'key-paramlist': KeyParamlist,
    Modal,
    ValuePicker
  },
  data () {
    const selectedKbLang = localStorage.getItem('selectedKbLang')
    return {
      editing: null,
      selectedKbLang
    }
  },
  inject: ['getSearchTargets', 'getSources'],
  computed: {
    normalized() {
      const { value, params } = this
      const sources = this.getSources()
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
    index() {
      return makeIndex(this.normalized)
    },
    behaviour() {
      const bind = this.value
      const sources = this.getSources()
      var value = get(sources, ['behaviours', bind])
      //If behavior not found, replace with none
      if (!value)
        value = get(sources, ['behaviours', "&none"])
      return value
    },
    behaviourParams() {
      return getBehaviourParams(this.params, this.behaviour)
    },
    uClass() { return `key-${this.size.u}u` },
    hClass() { return `key-${this.size.h}h` },
    outlineClass() {
      if (this.behaviour) {
        if (this.behaviour.code === "&kp" || this.behaviour.code === "&none")
          return 'outlineKP'
        if (this.behaviour.code === "&mo" || this.behaviour.code === "&lt" || this.behaviour.code === "&to" || this.behaviour.code === "&tog")
          return 'outlineLayer'
        else if (this.behaviour.code === "&macro")
          return 'outlineMacro'
        else if (this.behaviour.type === "UD")
        return 'outlineUserDefined'
        else
          return 'outlineOther'
      }
    },
    backKeyClass() {
      const [first] = this.normalized.params;
      const type = get(first, 'source.type', '')
      if (first && (this.behaviour.code === "&kp" || this.behaviour.type === "UD")) {
        if (type === 'EDIT') {
          return 'typeEdit'
        }
        else if (type === 'MEDIA') {
          return 'typeMedia'
        }
        else if (type === 'MOD') {
          return 'typeMod'
        }
        else if (type === 'UD') {
          return 'typeUserDefined'
        }
        else if (type === 'KB' || type === 'KP')
        {
          //leave as is
        }
        else
        {
          return 'typeOther';
        }
      }
    },
    positioningStyle() {
      return getKeyStyles(this.position, this.size, this.rotation)
    },
    isSimple() {
      const [first] = this.normalized.params
      const symbol = get(first, 'source.symbol', get(first, 'source.code', ''))
      const shortSymbol = symbol.length === 1
      const singleParam = this.normalized.params.length === 1
      return singleParam && shortSymbol
    },
    isComplex() {
      const [first] = this.normalized.params
      if (this.selectedKbLang && this.selectedKbLang != "en") {
        var altLang =  get(first, 'source.altLangs', null)
        if (altLang)
          altLang = altLang[this.selectedKbLang];
      }
      const symbol = altLang || get(first, 'source.symbol', get(first, 'value', ''))
      const isLongSymbol = symbol.length > 4
      const isMultiParam = this.behaviourParams.length > 1
      const isNestedParam = get(first, 'params', []).length > 0

      return isLongSymbol || isMultiParam || isNestedParam
    }
  },
  methods: {
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
    getEditingValue(editing) {
      if (this.selectedKbLang && this.selectedKbLang != "en") {
        var altLang;
        if (this.editing.altLangs)
          altLang = editing.altLangs[this.selectedKbLang];

        return altLang || editing.code
      }
      else
        return editing.code
    },
    onMouseOver(event) {
      const old = document.querySelector('.highlight')
      old && old.classList.remove('highlight')
      event.target.classList.add('highlight')
    },
    onMouseLeave(event) {
      event.target.classList.remove('highlight')
    },
    handleSelectCode(event) {
      if (event && event.param == "macro")
      {
        this.editing = pick(event, ['target', 'codeIndex', 'macro', 'param'])
        this.editing.isMacro = true;
        this.editing.targets = this.getSearchTargets(this.editing.param, this.value)
      }
      else
      {
        this.editing = pick(event, ['target', 'codeIndex', 'code', 'altLangs', 'param'])
        this.editing.isMacro = false;
        this.editing.targets = this.getSearchTargets(this.editing.param, this.value)
        
        //Filter search results by language (English + selected keyboard)
        var language = this.selectedKbLang;
        if (language && language != "en") {
          this.editing.targets = this.editing.targets.filter(function(obj) {
            return (obj.langCode === "en") || (obj.langCode === language)
          });
        }
        else
        {
          this.editing.targets = this.editing.targets.filter(function(obj) {
            return (obj.langCode === "en")
          });
        }
      }
    },
    handleSelectBehaviour(event) {
      this.editing = {
        target: event.target,
        targets: this.getSearchTargets('behaviour', this.value),
        codeIndex: 0,
        code: this.value,
        param: 'behaviour'
      }
    },
    handleSelectValue(source) {
      if (this.fromMacro && source.code == "&macro")
      {
        alert('You cannot select a macro behavior here')
        return
      }

      const { normalized } = this
      const { codeIndex } = this.editing
      const updated = cloneDeep(normalized)
      const index = makeIndex(updated)
      const targetCode = index[codeIndex]

      targetCode.value = source.code
      targetCode.params = []
      index.forEach(node => {
        delete node.source
      })

      this.editing = null
      this.$emit('update', pick(updated, ['value', 'params']))
    },
    handleSelectCustomValue(source) {
      if (this.editing.param === "behaviour")
        this.$emit('add-custom-behavior', source)
      else
        this.$emit('add-custom-key', source)
      this.handleSelectValue(source) 
    },
    handleDelete() {
      this.editing = null
      this.$emit('delete')
    }
  }
}
</script>

<style>
.key {
	position: absolute;
	display: flex;
	justify-content: center;
	align-items: center;

	color: #999;
	background-color: whitesmoke;
	font-size: 110%;
	border-radius: 5px;
}
.key:hover {
	background-color: var(--hover-selection);
	transition: 200ms;
	z-index: 1;
}
.key:hover .code, .key:hover .behaviour-binding {
	color: white;
}
.key > .code {
	padding: 5px;
}

.key[data-simple="true"] { font-size: 140%; }
.key[data-long="true"] { font-size: 60%; }

.behaviour-binding {
  position: absolute;
  top: 0;
  left: 0;
  font-size: 10px;
  font-variant: smallcaps;
  padding: 2px;
  opacity: 0.5;
}

.behaviour-binding:hover {
  cursor: pointer;
  color: var(--hover-selection) !important;
  background-color: white;
  border-radius: 5px 0;
  opacity: 1;
}

.deleteKey {
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
.deleteKey:hover,
.deleteKey:focus {
    text-decoration: none;
    cursor: pointer;
    background-color: #ffffff;
}

.outlineKP {
  border: none;
}

.outlineLayer {
  border: blue solid 2px;
}

.outlineMacro {
  border: yellow solid 2px;
}

.outlineOther {
  border: purple solid 2px;
}

.outlineUserDefined {
  border: red solid 2px;
}

.typeMod {
  background-color: #DAF7A6;
}

.typeUserDefined {
  background-color: rgb(145, 88, 88);
}

.typeMedia {
  background-color: #FCFE68;
}

.typeEdit {
  background-color: #BDDCFE;
}

.typeOther {
  background-color: #F6CFFF;
}

</style>