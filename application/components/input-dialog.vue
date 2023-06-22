<script>
export default {
  name: 'InputDialog',
  emits: ['acceptInput', 'cancelInput'],
  props: {
    prompt: String,
    btnText: String,
    btnHint: String,
    forceUpper: Boolean
  },
  data() {
    return {
      inputVal: "",
      macroMax: 15
    }
  },
  mounted() {
    this.focusInput();
    document.body.addEventListener('click', this.handleClickOutside, true)

    if (this.$refs.searchBox) {
      this.$refs.searchBox.focus()
    }
  },
  unmounted() {
    document.body.removeEventListener('click', this.handleClickOutside, true)
  },
  methods: {
    accept() {     
      this.$emit('acceptInput', this.inputVal)
    },
    handleClickOutside(event) {
      if (!this.$el.contains(event.target)) {
        this.cancel()
      }
    },
    cancel() {
      this.$emit('cancelInput')
    },
    focusInput() {
      this.$refs.inputBox.focus();
    },
    inputText(e) {
      if (this.forceUpper) {
        return this.inputVal = e.target.value.toUpperCase()
      }
      else
        return this.inputVal = e.target.value 
    }

  }
}
</script>

<template>
  <div class="dialog">
    <span>{{prompt}}</span>
    <div>
      <input
        ref="inputBox"
        type="text"
        v-model="this.inputVal"   
        @input="inputText"
        :maxlength="this.macroMax"   
      />
    </div>
    <button
      @click="accept"
      :disabled="this.inputVal === ''"
      title="{{btnHint}}">
      {{btnText}}
    </button>
    &nbsp;
    <button
      @click="cancel">
      Cancel
    </button>
  </div>
</template>

<style scoped>
.dialog {
  background-color: white;
  padding: 20px 40px;
  margin: 40px;
  max-width: 500px;
  box-shadow: 0px 10px 25px rgba(0, 0, 0, 0.4);
}

.dismiss {
  display: block;
  margin: 0 auto;
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
</style>
