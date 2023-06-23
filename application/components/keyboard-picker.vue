<template>
  <div>
    <img :src="getImgUrl()" alt="Advantage 360 Professional" class="productImg"/>  
    <selector
      v-model="source"
      label="Source"
      :id="source"
      :choices="sourceChoices"
    />

    <github-picker
      v-if="source == 'github'"
      @select="handleKeyboardSelected"
    />

  </div>
  
</template>

<style scoped>

  .productImg {
    margin-left: 10px;
    margin-top: 5px;
    height: 60px;
  }
  
</style>

<script>
import compact from 'lodash/compact'

import * as config from '../config'
import { loadLayout } from '../layout.js'
import { loadKeymap } from '../keymap.js'
import { loadMacro } from '../macro.js'
import keyBy from 'lodash/keyBy'
import { loadCustomKeycodes } from '../keycodes.js'

import GithubPicker from './github/picker.vue'
import Selector from './selector.vue'
import { loadCustomBehaviors } from '../api'

export default {
  name: 'KeyboardPicker',
  components: { GithubPicker, Selector },
  emits: ['select'],
  inject: [
    'keycodes',
    'behaviours',
    'customKeycodes',
    'customBehaviours',
    'indexedKeycodes',
    'indexedBehaviours'
  ],
  data() {
    const sourceChoices = compact([
      config.enableLocal ? { id: 'local', name: 'Local' } : null,
      config.enableGitHub ? { id: 'github', name: 'GitHub' } : null
    ])

    const selectedSource = localStorage.getItem('selectedSource')
    const onlySource = sourceChoices.length === 1 ? sourceChoices[0].id : null

    return {
      sourceChoices,
      source: onlySource || (
        sourceChoices.find(source => source.id === selectedSource)
          ? selectedSource.id
          : null
      )
    }
  },
  mounted() {
    if (this.source === 'local') {
      this.fetchLocalKeyboard()
    }
  },
  watch: {
    source(value) {
      localStorage.setItem('selectedSource', value)
      if (value === 'local') {
        this.fetchLocalKeyboard()
      }
    }
  },
  methods: {
    async fetchLocalKeyboard() {
      const { source } = this
      const [layout, keymap, macro, custKeycodes, custBehaviors] = await Promise.all([
        loadLayout(),
        loadKeymap(),
        loadMacro(),
        loadCustomKeycodes(),
        loadCustomBehaviors(),
      ])

      this.handleKeyboardSelected({ source, layout, keymap, macro, custKeycodes, custBehaviors })
    },
    handleKeyboardSelected(event) {
      const { source } = this
      const { layout, keymap, macro, custKeycodes, custBehaviors, ...rest } = event

      const layerNames = keymap.layer_names || keymap.layers.map((_, i) => `Layer ${i}`)
      Object.assign(keymap, {
        layer_names: layerNames
      })

      //Reload custom keycodes and behaviors and re-assign indexed values
      this.customKeycodes.splice(0, this.customKeycodes.length, ...custKeycodes)
      this.customBehaviours.splice(0, this.customBehaviours.length, ...custBehaviors) 
      Object.assign(this.indexedKeycodes, keyBy(this.keycodes.concat(this.customKeycodes), 'code'))
      Object.assign(this.indexedBehaviours, keyBy(this.behaviours.concat(this.customBehaviours), 'code'))

      this.$emit('select', { source, layout, keymap, macro, custKeycodes, custBehaviors, ...rest })
    },
    getImgUrl() { 
      return require('../assets/product.png')
    }
  }
}
</script>
