<template>
  <loader :inline="true" :load="initialize" @loaded="onInitialized">
    <template v-slot:loading>
      <spinner />
    </template>
    
    <button v-if="!isGitHubAuthorized()" @click="login">
      <i class="fab fa-github" /> Login with GitHub
    </button>

    <button v-else-if="!isAppInstalled()" @click="install">
      <i class="fab fa-github" /> Add Repository
    </button>

    <span v-else>
      <selector
        id="repo"
        label="Repository"
        :choices="repositoryChoices"
        v-model.number="repoId"
      />

      <spinner v-if="loadingBranches" />
      <selector
        v-else
        v-model="branchName"
        id="branch"
        label="Branch"
        :choices="branchChoices"
      />

      <spinner v-if="loadingKeyboard" />
      <validation-errors
        v-if="loadKeyboardError"
        :title="loadKeyboardError.name"
        :errors="loadKeyboardError.errors"
        :otherRepoOrBranchAvailable="repositoryChoices.length > 0 || branchChoices.length > 0"
        @dismiss="clearSelection"
      />
      <validation-errors
        v-if="loadKeyboardWarnings"
        title="Warning"
        :errors="loadKeyboardWarnings"
        @dismiss="loadKeyboardWarnings = null"
      />

      <button v-else-if="isGitHubAuthorized()" @click="logout">
        <i class="fab fa-github"></i> Logout
      </button>
      
      <button
        v-if="branchName && !loadingKeyboard"
        @click="loadKeyboard"
        title="Load keyboard">
        <i class="fa fa-sync"></i>
      </button>
      <button
        v-if="branchName && !loadingKeyboard"     
        @click="browseRepository"
        title="Open GitHub repository">
        <i class="fa-brands fa-square-github"></i>
      </button>
      <button
        v-if="branchName && !loadingKeyboard"
        :disabled="loadingUrl"
        @click="getFirmware"
        title="Get firmware files">
        <i v-if="!loadingUrl" class="fa-regular fa-circle-play"></i>
        <spinner v-if="loadingUrl" />
      </button></span>
  </loader>
</template>

<script>
import find from 'lodash/find'
import map from 'lodash/map'

import github from './api'
import * as storage from './storage'
import InvalidRepo from './invalid-repo.vue'
import ValidationErrors from './validation-errors.vue'
import Loader from '../loader.vue'
import Selector from '../selector.vue'
import Spinner from '../spinner.vue'

export default {
  name: 'GithubPicker',
  components: { InvalidRepo, Loader, Selector, Spinner, ValidationErrors },
  emits: ['select'],
  data() {
    return {
      repoId: null,
      branchName: null,
      branches: [],
      loadingBranches: false,
      loadingKeyboard: false,
      loadKeyboardError: null,
      loadKeyboardWarnings: null,
      loadingUrl: false
    }
  },
  created() {
    github.on('authentication-failed', () => {
      github.beginLoginFlow()
    })
    github.on('repo-validation-error', err => {
      this.loadKeyboardError = err
      this.loadingKeyboard = false
    })
  },
  watch: {
    repoId(value) {
      this.branchName = null
      if (value) {
        storage.setPersistedRepository(value)
        this.loadBranches()
      }
    },
    branchName(value) {
      if (value) {
        storage.setPersistedBranch(this.repoId, value)
        this.loadKeyboard()
      }
    }
  },
  methods: {
    initialize() {
      // TODO: figure out the Vue equivalent of Higher Order Components so that
      // I can use lifecycle hooks properly.
      return github.init()
    },
    onInitialized() {
      const selectedRepository = storage.getPersistedRepository()
      const repositories = github.repositories || []

      if (repositories.length === 1) {
        this.repoId = repositories[0].id
        this.loadBranches()
      } else if (find(repositories, { id: selectedRepository })) {
        this.repoId = selectedRepository
        this.loadBranches()
      }
    },
    isGitHubAuthorized() {
      return github.isGitHubAuthorized()
    },
    isAppInstalled() {
      return github.isAppInstalled()
    },
    login() {
      github.beginLoginFlow()
    },
    logout() {
      github.beginLogoutFlow()
      this.clearSelection()
      window.location.reload()
    },
    install() {
      github.beginInstallAppFlow()
    },
    getRepositories() {
      return github.repositories
    },
    async loadBranches() {
      this.loadingBranches = true
      this.branches = []

      const repository = find(github.repositories, { id: this.repoId })
      const branches = await github.fetchRepoBranches(repository)

      this.loadingBranches = false
      this.branches = branches

      const available = map(branches, 'name')
      const defaultBranch = repository.default_branch
      const currentBranch = this.branchName
      const previousBranch = storage.getPersistedBranch(this.repoId)
      const onlyBranch = branches.length === 1 ? branches[0].name : null

      for (let branch of [onlyBranch, currentBranch, previousBranch, defaultBranch]) {
        if (available.includes(branch)) {
          this.branchName = branch
          break
        }
      }
    },
    async loadKeyboard() {
      const available = this.getRepositories()
      const repository = find(available, { id: this.repoId })?.full_name
      const branch = this.branchName

      this.loadingKeyboard = true
      this.loadKeyboardError = null

      const response = await github.fetchLayoutAndKeymap(repository, branch)

      this.loadingKeyboard = false
      this.lintKeyboard(response)

      this.$emit('select', { github: { repository, branch }, ...response })
    },
    lintKeyboard({ layout }) {
      const noKeyHasPosition = layout.every(key => (
        key.row === undefined &&
        key.col === undefined
      ))

      if (noKeyHasPosition) {
        this.loadKeyboardWarnings = [
          'Layout in info.json has no row/col definitions. Generated keymap files will not be nicely formatted.'
        ]
      }
    },
    clearSelection() {
      this.branchName = null
      this.loadKeyboardError = null
      this.loadKeyboardWarnings = null
    },
    browseRepository() {
      const available = this.getRepositories()
      const repository = find(available, { id: this.repoId })
      window.open(repository.html_url, '_blank');
    },
    async getFirmware() {
      this.loadingUrl = true;
      const available = this.getRepositories()
      const repository = find(available, { id: this.repoId })
      const runs =  await github.fetchRuns(repository)
      var url = ''

      if (runs && runs.length > 0) {
        var workflows = runs[0]
        if (workflows.length > 0) {
          var lastWorkflow = workflows[0]
          url = lastWorkflow.html_url
        }
      }

      //var git = github
      if (url !== '')
      {
        window.open(url, '_blank');
      }
      else
        alert('No firmware generated yet, commit changes first')

      this.loadingUrl = false;
    }
  },
  computed: {
    repositoryChoices() {
      return this.getRepositories()
      .filter(repo => !repo.full_name.toLowerCase().includes("adv360-pro-keymapeditor"))
      .map(repo => ({
        id: repo.id,
        name: repo.full_name
      }))
    },
    branchChoices() {
      return this.branches.map(branch => ({
        id: branch.name,
        name: branch.name
      }))
    }
  }
}
</script>

<style scoped>

button {
  cursor: pointer;
  margin-left: 5px;
}

button:active {
  cursor: wait;
}

</style>