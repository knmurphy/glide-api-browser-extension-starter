<template>
  <div class="container">
    <!-- Configuration Selector -->
    <div class="form-group" v-if="configs.length > 0">
      <label for="configSelect">Select Configuration</label>
      <select id="configSelect" v-model="selectedConfigIndex" @change="loadSelectedConfig">
        <option value="" disabled>Choose a configuration</option>
        <option v-for="(config, index) in configs" :key="index" :value="index">
          {{ config.name }}
        </option>
      </select>
    </div>

    <div v-if="!configs.length" class="no-configs">
      <p>No configurations found. Please add one in the extension options.</p>
      <button @click="openOptions">Open Options</button>
    </div>

    <!-- Dynamic Form based on selected configuration -->
    <form v-if="selectedConfig" @submit.prevent="submitForm" class="add-row-form">
      <h2>{{ selectedConfig.name }}</h2>
      
      <div v-for="(column, key) in parsedColumns" :key="key" class="form-group">
        <label :for="key">{{ column.name }}</label>
        <input
          :id="key"
          v-model="formData[key]"
          :type="getInputType(column.type)"
          :required="true"
        />
      </div>

      <div class="button-group">
        <button type="submit" :disabled="submitting">
          {{ submitting ? 'Adding...' : 'Add Row' }}
        </button>
      </div>

      <div v-if="status" :class="['status', status.type]">
        {{ status.message }}
      </div>
    </form>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { browser } from 'wxt/browser'
import { GlideApiClient, type GlideTableConfig } from '~/lib/glideApi'

interface ColumnConfig {
  type: string
  name: string
}

const configs = ref([])
const selectedConfigIndex = ref('')
const selectedConfig = ref(null)
const formData = ref<Record<string, any>>({})
const submitting = ref(false)
const status = ref(null)

const parsedColumns = computed(() => {
  if (!selectedConfig.value?.columns) return {}
  try {
    return JSON.parse(selectedConfig.value.columns)
  } catch {
    return {}
  }
})

onMounted(async () => {
  try {
    console.log('Popup: Loading configs from storage')
    const result = await browser.storage.local.get('glideConfigs')
    console.log('Popup: Loaded configs:', JSON.stringify(result, null, 2))
    
    // Convert object to array if needed
    let loadedConfigs = result.glideConfigs || []
    if (loadedConfigs && typeof loadedConfigs === 'object' && !Array.isArray(loadedConfigs)) {
      loadedConfigs = Object.values(loadedConfigs)
    }
    
    configs.value = Array.isArray(loadedConfigs) ? loadedConfigs : []
    console.log('Popup: Configs after load:', JSON.stringify(configs.value, null, 2))
  } catch (error) {
    console.error('Popup: Failed to load configs:', error)
    configs.value = []
  }

  // Listen for storage changes
  browser.storage.onChanged.addListener((changes) => {
    console.log('Popup: Storage changed:', JSON.stringify(changes, null, 2))
    if (changes.glideConfigs) {
      let newConfigs = changes.glideConfigs.newValue || []
      if (newConfigs && typeof newConfigs === 'object' && !Array.isArray(newConfigs)) {
        newConfigs = Object.values(newConfigs)
      }
      configs.value = Array.isArray(newConfigs) ? newConfigs : []
      console.log('Popup: Updated configs:', JSON.stringify(configs.value, null, 2))
      
      // Reset selection if the current config was deleted
      if (selectedConfig.value && !configs.value.length) {
        console.log('Popup: Resetting selection due to empty configs')
        selectedConfig.value = null
        selectedConfigIndex.value = ''
      }
    }
  })
})

function loadSelectedConfig() {
  console.log('Popup: Loading selected config, index:', selectedConfigIndex.value)
  selectedConfig.value = configs.value[selectedConfigIndex.value]
  console.log('Popup: Selected config:', JSON.stringify(selectedConfig.value, null, 2))
  formData.value = {}
  status.value = null
}

function getInputType(columnType: string): string {
  const typeMap = {
    string: 'text',
    number: 'number',
    date: 'date',
    boolean: 'checkbox',
    email: 'email',
    url: 'url'
  }
  return typeMap[columnType] || 'text'
}

async function submitForm() {
  if (!selectedConfig.value) {
    status.value = {
      type: 'error',
      message: 'Please select a configuration first.'
    }
    return
  }

  submitting.value = true
  status.value = {
    type: 'info',
    message: 'Submitting...'
  }

  try {
    const config = selectedConfig.value
    
    // Log config details safely
    console.log('Config details:', {
      name: config.name,
      appId: config.appId,
      tableId: config.tableId,
      hasToken: !!config.apiToken,
      tokenLength: config.apiToken?.length,
      columns: typeof config.columns
    })

    // Create API config with columns
    const apiConfig = {
      apiToken: config.apiToken,
      appId: config.appId,
      tableId: config.tableId,
      columns: config.columns // Pass the columns configuration
    }
    
    // Log API config details safely
    console.log('API config details:', {
      appId: apiConfig.appId,
      tableId: apiConfig.tableId,
      hasToken: !!apiConfig.apiToken,
      tokenLength: apiConfig.apiToken?.length,
      columns: typeof apiConfig.columns
    })
    
    const client = new GlideApiClient(apiConfig)
    console.log('Form data to submit:', formData.value)
    
    const result = await client.addRow(formData.value)
    console.log('API response:', result)
    
    status.value = {
      type: 'success',
      message: 'Row added successfully!'
    }
    
    // Clear form
    formData.value = {}
  } catch (error) {
    console.error('Form submission error:', error)
    status.value = {
      type: 'error',
      message: error.message || 'Failed to add row. Please try again.'
    }
  } finally {
    submitting.value = false
  }
}

function openOptions() {
  chrome.runtime.openOptionsPage()
}
</script>

<style>
.no-configs {
  text-align: center;
  padding: var(--spacing-lg);
}

.no-configs p {
  margin-bottom: var(--spacing-md);
  color: var(--text-secondary);
}

select {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: var(--text-md);
  font-family: inherit;
  background-color: var(--bg-color);
  color: var(--text-color);
  cursor: pointer;
}

select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: var(--shadow-sm), 0 0 0 4px rgba(105, 65, 198, 0.1);
}

.add-row-form {
  margin-top: var(--spacing-lg);
}

@media (prefers-color-scheme: dark) {
  select {
    background-color: var(--container-bg-dark);
    border-color: var(--border-color-dark);
    color: var(--text-color-light);
  }
}
</style>
