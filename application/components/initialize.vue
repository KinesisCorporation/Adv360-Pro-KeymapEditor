<script>
import keyBy from 'lodash/keyBy'

import { healthcheck, loadBehaviours, loadCustomBehaviors } from '../api'
import { loadKeycodes, loadCustomKeycodes } from '../keycodes'

import Loader from './loader.vue'

export default {
  name: 'Initialize',
  components: { Loader },
  data () {
    return {
      keycodes: [],
      behaviours: [],
      indexedKeycodes: {},
      indexedBehaviours: {},
      customKeycodes: [],
      customBehaviours: []
    }
  },
  provide() {
    return {
      keycodes: this.keycodes,
      behaviours: this.behaviours,
      indexedKeycodes: this.indexedKeycodes,
      indexedBehaviours: this.indexedBehaviours,
      customKeycodes: this.customKeycodes,
      customBehaviours: this.customBehaviours
    }
  },
  methods: {
    async doReadyCheck() {
      await healthcheck()
      await this.loadAppData()
    },
    async loadAppData () {
      const [ keycodes, behaviours, customKeycodes, customBehaviours ] = await Promise.all([
        loadKeycodes(),
        loadBehaviours(),
        loadCustomKeycodes(),
        loadCustomBehaviors()    
      ])

      this.keycodes.splice(0, this.keycodes.length, ...keycodes)
      this.behaviours.splice(0, this.behaviours.length, ...behaviours)   
      this.customKeycodes.splice(0, this.customKeycodes.length, ...customKeycodes)
      this.customBehaviours.splice(0, this.customBehaviours.length, ...customBehaviours) 
      Object.assign(this.indexedKeycodes, keyBy(this.keycodes.concat(this.customKeycodes), 'code'))
      Object.assign(this.indexedBehaviours, keyBy(this.behaviours.concat(this.customBehaviours), 'code'))
    }
  }
}
</script>

<template>
  <loader :load="doReadyCheck">
    <slot />
  </loader>
</template>
