<template>
  <span
    class="code"
    :title="source && `(${source.code}) ${source.description}`"
    @click.stop="onSelect({ target: $event.target, codeIndex: index, code: value, altLangs: source.altLangs, param })"
  >
    <template v-if="source">
      <span v-if="source.faIcon" class="['fa', `fa-${source.faIcon}" />
      <template v-else>{{getCodeValue()}}</template>
    </template>
    <template v-else>⦸</template>
  </span>
</template>

<script>
export default {
  name: 'key-value',
  props: ['param', 'index', 'value', 'source', 'onSelect'],
  data() {
    const selectedKbLang = localStorage.getItem('selectedKbLang')
    return {
      selectedKbLang
    }
  },
  methods: {
    getCodeValue() {
      if (this.selectedKbLang && this.selectedKbLang != "en") {
        var altLang;
        if (this.source.altLangs)
          altLang = this.source.altLangs[this.selectedKbLang];

        return altLang || this.source.symbol || this.source.code
      }
      else
        return this.source.symbol || this.source.code
    }
  }
}
</script>

<style>
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

</style>