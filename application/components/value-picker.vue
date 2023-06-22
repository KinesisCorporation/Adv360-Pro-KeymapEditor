<script>
import fuzzysort from 'fuzzysort'
import InputDialog from './input-dialog.vue'

const cycle = (array, index, step=1) => {
  const next = (index + step) % array.length
  return next < 0 ? array.length + next : next
}

export default {
  name: 'value-picker',
  emits: ['cancel', 'select', 'select-custom'],
  components: {
    InputDialog
  },
  props: {
    target: Object,
    choices: Array,
    param: [String, Object],
    value: String,
    prompt: String,
    searchKey: String,
    searchThreshold: {
      type: Number,
      default: 999
    },
    showAllThreshold: {
      type: Number,
      default: 50,
      validator: value => value >= 0
    }
  },
  data() {
    return {
      query: null,
      highlighted: null,
      showAll: false,
      addCustom: false,
      customKeyBehavior: ""
    }
  },
  mounted() {
    document.body.addEventListener('click', this.handleClickOutside, true)

    if (this.$refs.searchBox) {
      this.$refs.searchBox.focus()
    }
  },
  unmounted() {
    document.body.removeEventListener('click', this.handleClickOutside, true)
  },
  computed: {
    results() {
      const { query, choices } = this
      const options = { key: this.searchKey, limit: 30 }
      const filtered = fuzzysort.go(query, choices, options)
      const showAll = this.showAll || (choices && this.searchThreshold > choices.length)

      if (!query)
        return choices

      return filtered.map(result => ({
        ...result.obj,
        search: result
      }))
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
    highlight(result) {
      return fuzzysort.highlight(result)
    },
    handleClickResult(result) {
      this.$emit('select', result)
    },
    handleKeyPress(event) {
      setTimeout(() => {
        this.query = event.target.value
      })
    },
    handleKeyDown(event) {
      if (event.keyCode === 8) {
        setTimeout(() => {
          this.query = event.target.value
        })
      }
    },
    handleSelectActive() {
      if (this.results.length > 0 && this.highlighted !== null) {
        this.handleClickResult(this.results[this.highlighted])
      }
    },
    handleHighlightNext() {
      this.setHighlight(0, 1)
    },
    handleHighlightPrev() {
      this.setHighlight(this.results.length - 1, -1)
    },
    setHighlight(initial, offset) {
      if (this.results.length === 0) {
        this.highlighted = null
        return
      }
      if (offset === undefined) {
        this.highlighted = initial
        return
      }

      this.highlighted = this.highlighted === null ? initial : cycle(this.results, this.highlighted, offset)
      this.scrollIntoViewIfNeeded(this.$el.querySelector(`.results li[data-result-index="${this.highlighted}`), false)
    },
    handleClickOutside(event) {
      if (!this.$el.contains(event.target)) {
        this.cancel()
      }
    },
    cancel() {
      this.$emit('cancel', 'select')
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
    handleAddCustom(customVal) {
      let found = false
      let keyToAdd = customVal

      for (let key in this.choices) {
        if (this.choices[key].code.toUpperCase() == keyToAdd.toUpperCase()) {
          found = true
          break
        }
      }
      if (!found) {
        if (confirm("Do you really want to add this custom " + this.param + ": " + keyToAdd + " ?")) {
          let customKey = new Object()
          customKey.code = keyToAdd
          customKey.description = keyToAdd
          customKey.name = keyToAdd
          customKey.params = []
          customKey.isModifier = false
          customKey.isNew = true
          customKey.type = "UD"
          if (this.param === "behaviour")
            customKey.params = ["code"]
          this.$emit('select-custom', customKey)
        }
        else
          return "";
      }
      else
        alert(keyToAdd + " already exists")
    },
    addCustomClick() {
      this.addCustom = true
      if (this.$refs.customBox) {
        setTimeout(() => {
          this.$refs.customBox.focus()
        }, 200)      
      }
    },
    cancelCustom() {
      this.addCustom = false
      if (this.$refs.searchBox) {
        setTimeout(() => {
          this.$refs.searchBox.focus()
        }, 200)   
      }
    },
    customInput(e) {
        return this.customKeyBehavior = e.target.value.toUpperCase()
    },
    checkIfExists() {
      if (this.query) {
        var search = this.query.toUpperCase()
        var filteredList = this.choices.filter(function(obj) {
            return (obj.code.toUpperCase() === search)
        });
        return filteredList.length > 0;
      }
      else
        return true;
    }

  }
}
</script>

<template>
  <div
    class="dialog"
    :style="style"
    @keydown.down.prevent="handleHighlightNext"
    @keydown.up.prevent="handleHighlightPrev"
    @keydown.enter.prevent="handleSelectActive"
    @keydown.esc.prevent="cancel"
  >
    <p v-show="!addCustom">{{prompt}}</p>
    <div class="flexContainer" v-show="!addCustom">
      <div class="formSearch">
        <input  
          ref="searchBox"
          type="text"
          class="inputSearch"
          :value="query !== null ? query : value"
          @keypress="handleKeyPress"
          @keydown="handleKeyDown"
        />
        <button v-show="!checkIfExists()" class="buttonCustom" @click="handleAddCustom(this.query)">Apply custom {{this.param}}</button>
      </div>  
    </div>   
    <ul class="results" v-show="!addCustom">
      <li
        :key="`result-${i}`"
        :class="{ highlighted: highlighted === i }"
        :title="result.description"
        :data-result-index="i"
        v-for="(result, i) in results"
        @click="handleClickResult(result)"
        @mouseover="setHighlight(i)"
      >
        <span v-if="result.search" v-html="highlight(result.search)" />
        <span v-else v-text="result[searchKey]" />
      </li>
    </ul>
    <!-- <div>
      <button @click="addCustomClick" v-show="!addCustom">
          Add Custom Behavior/Code
      </button>
      <div v-show="addCustom">
        <p>Add Custom Key/Behavior</p>
        <input  
          ref="customBox"
          type="text"
          @input="customInput"
          v-model="this.customKeyBehavior"
        />
        <button @click="handleAddCustom(this.customKeyBehavior)">Add</button>
        <button @click="cancelCustom">Cancel</button>
      </div>
    </div> -->
    <div
      v-show="choices.length > searchThreshold && !addCustom"
      class="choices-counter"
    >
      Total choices: {{choices.length}}.
      <a
        v-if="enableShowAllButton"
        v-text="`Show all`"
        @click.stop="showAll = true"
      />
    </div>
    <!-- <modal v-if="addCustom">
      <input-dialog
        :prompt="'Enter new key/behavior'"
        :btnText="'Add'"
        :btnHint="'Add new key/behavior'"
        :forceUpper="true"
        @acceptInput="handleAddCustom"
        @cancelInput="addCustom = false"
      />
    </modal> -->
  </div>
</template>

<style scoped>

.formSearch {
  display:flex;
  flex-direction:row;
  padding:1px;
  width: 100%;
  border:1px solid;
  border-radius: 4px;
  background-color: white;
}

.dialog {
  width: 450px;
}
.dialog p {
	margin: 0;
	font-size: 90%;
	font-weight: bold;
}
.dialog input {
	height: 30px;
	line-height: 30px;
  flex-grow:2;
  font-size: 120%;
  border:none;
  outline: none;
}
ul.results {
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
.results li {
	cursor: pointer;
	padding: 5px;
}
.results li:hover, .results li.highlighted {
	background: var(--hover-selection);
	color: white;
}
.results li b { color: red; }

.choices-counter {
  font-size: 10px;
}

.choices-counter a {
  color: var(--selection);
  border-bottom: 1px dotted var(--selection);
  cursor: pointer;
}

.flexContainer {
    display: flex;
}

.inputField {
    flex: 1;
}

button {
  cursor: pointer;
  background-color: var(--hover-selection);
  color: white;

  font-size: 14px;
  border: none;
  border-radius: 5px;
  padding: 5px;
  margin: 2px;
} 

button[disabled] {
  background-color: #ccc;
  cursor: not-allowed;
}

</style>