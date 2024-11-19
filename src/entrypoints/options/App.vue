<template>
  <div class="container">
    <h1>Glide API Extension Settings</h1>
    
    <!-- List of Saved Configurations -->
    <div class="configs-list" v-if="savedConfigs.length > 0">
      <h2>Saved Configurations</h2>
      <div v-for="(config, index) in savedConfigs" :key="index" class="config-item">
        <div class="config-header">
          <h3>{{ config.name }}</h3>
          <div class="config-actions">
            <button @click="editConfig(index)" class="secondary">Edit</button>
            <button @click="deleteConfig(index)" class="danger">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Configuration Form -->
    <div class="form-container">
      <h2>{{ isEditing ? 'Edit Configuration' : 'Add New Configuration' }}</h2>

      <form @submit.prevent="saveConfig">
        <!-- 1. Configuration Name -->
        <div class="form-group">
          <label for="configName">Configuration Name</label>
          <input 
            id="configName"
            v-model="currentConfig.name"
            type="text"
            placeholder="e.g., Customer Feedback Form"
            required
          />
          <div class="help-text">A friendly name to identify this configuration</div>
        </div>

        <!-- 2. API Token -->
        <div class="form-group">
          <label for="apiToken">API Token</label>
          <input
            id="apiToken"
            v-model="currentConfig.apiToken"
            type="password"
            required
          />
          <div class="help-text">Your Glide API token</div>
        </div>

        <!-- 3. Paste Glide Code -->
        <div class="form-group" v-if="!isEditing">
          <label for="glideCode">Paste Glide Code (Optional)</label>
          <textarea
            id="glideCode"
            v-model="glideCode"
            placeholder="Paste your Glide table configuration code here..."
            rows="8"
          ></textarea>
          <div class="help-text">
            Paste your Glide table configuration code here to automatically fill the fields below.
            The code should look like: glide.table({ app: "...", table: "...", columns: {...} })
          </div>
          <button type="button" @click="parseGlideCode" class="secondary">
            Parse Code
          </button>
        </div>

        <!-- 4. App ID -->
        <div class="form-group">
          <label for="appId">App ID</label>
          <input
            id="appId"
            v-model="currentConfig.appId"
            type="text"
            required
          />
          <div class="help-text">Your Glide app ID</div>
        </div>

        <!-- 5. Table ID -->
        <div class="form-group">
          <label for="tableId">Table ID</label>
          <input
            id="tableId"
            v-model="currentConfig.tableId"
            type="text"
            required
          />
          <div class="help-text">Your Glide table ID</div>
        </div>

        <!-- 6. Column Configuration -->
        <div class="form-group">
          <label for="columns">Column Configuration</label>
          <textarea
            id="columns"
            v-model="currentConfig.columns"
            rows="6"
            required
          ></textarea>
          <div class="help-text">
            Column configuration in JSON format. Will be automatically filled if you paste Glide code above.
          </div>
        </div>

        <div class="button-group">
          <button type="submit">{{ isEditing ? 'Update' : 'Save' }}</button>
          <button type="button" @click="resetForm" class="secondary">Cancel</button>
        </div>
      </form>
    </div>

    <div v-if="status" :class="['status', status.type]">
      {{ status.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { browser } from 'wxt/browser'

// Initialize as an empty array
const savedConfigs = ref([])
const currentConfig = ref({
  name: '',
  apiToken: '',
  appId: '',
  tableId: '',
  columns: ''
})
const glideCode = ref('')
const status = ref(null)
const isEditing = ref(false)
const editingIndex = ref(-1)

onMounted(async () => {
  try {
    console.log('Options: Loading configs from storage')
    const result = await browser.storage.local.get('glideConfigs')
    console.log('Options: Loaded configs:', JSON.stringify(result, null, 2))
    
    // Convert object to array if needed
    let loadedConfigs = result.glideConfigs || []
    if (loadedConfigs && typeof loadedConfigs === 'object' && !Array.isArray(loadedConfigs)) {
      loadedConfigs = Object.values(loadedConfigs)
    }
    
    savedConfigs.value = Array.isArray(loadedConfigs) ? loadedConfigs : []
    console.log('Options: Saved configs after load:', JSON.stringify(savedConfigs.value, null, 2))
  } catch (error) {
    console.error('Options: Failed to load configs:', error)
    savedConfigs.value = []
  }

  // Listen for storage changes
  browser.storage.onChanged.addListener((changes) => {
    console.log('Options: Storage changed:', JSON.stringify(changes, null, 2))
    if (changes.glideConfigs) {
      let newConfigs = changes.glideConfigs.newValue || []
      if (newConfigs && typeof newConfigs === 'object' && !Array.isArray(newConfigs)) {
        newConfigs = Object.values(newConfigs)
      }
      savedConfigs.value = Array.isArray(newConfigs) ? newConfigs : []
      console.log('Options: Updated saved configs:', JSON.stringify(savedConfigs.value, null, 2))
    }
  })
})

function parseGlideCode() {
  try {
    const code = glideCode.value

    // Extract app ID
    const appMatch = code.match(/app:\s*["']([^"']+)["']/)
    if (appMatch) {
      currentConfig.value.appId = appMatch[1]
    }

    // Extract table ID
    const tableMatch = code.match(/table:\s*["']([^"']+)["']/)
    if (tableMatch) {
      currentConfig.value.tableId = tableMatch[1]
    }

    // Extract columns object with all its properties
    const columnsMatch = code.match(/columns:\s*({(?:{[^}]*}|[^}])*})/)
    if (columnsMatch) {
      // Get the raw columns object string
      currentConfig.value.columns = columnsMatch[1].trim()
      
      // Extract column names using regex
      const columnNames = currentConfig.value.columns
        .match(/\w+(?=\s*:)/g) // matches words followed by colon
        ?.filter(name => name !== 'type' && name !== 'name') // filter out property names
        ?.join(', ') || ''
      
      // Generate a name if not set
      if (!currentConfig.value.name && columnNames) {
        currentConfig.value.name = `${columnNames} Form`
      }
      
      status.value = {
        type: 'success',
        message: 'Code parsed successfully!'
      }
    } else {
      throw new Error('Could not find columns configuration in the code')
    }
  } catch (error) {
    console.error('Parse error:', error)
    status.value = {
      type: 'error',
      message: `Failed to parse code: ${error.message}`
    }
  }
}

async function saveConfig() {
  try {
    // Make sure all required fields are filled
    if (!currentConfig.value.name || !currentConfig.value.apiToken || 
        !currentConfig.value.appId || !currentConfig.value.tableId || 
        !currentConfig.value.columns) {
      throw new Error('All fields are required')
    }

    // Clean up the columns string and convert to valid JSON
    let columnsStr = currentConfig.value.columns.trim()
    
    // Convert the Glide format to valid JSON
    columnsStr = columnsStr
      // Ensure property names are quoted
      .replace(/(\s*)(\w+):/g, '$1"$2":')
      // Convert any remaining single quotes to double quotes
      .replace(/'/g, '"')
      // Remove trailing commas
      .replace(/,(\s*})/g, '$1')
    
    try {
      // Validate the converted JSON
      JSON.parse(columnsStr)
    } catch (jsonError) {
      console.error('Options: JSON parse error:', jsonError, columnsStr)
      throw new Error('Could not process columns format')
    }
    
    const newConfig = {
      name: currentConfig.value.name,
      apiToken: currentConfig.value.apiToken,
      appId: currentConfig.value.appId,
      tableId: currentConfig.value.tableId,
      columns: columnsStr
    }
    
    console.log('Options: Saving new config:', JSON.stringify(newConfig, null, 2))
    
    // Ensure savedConfigs is an array before pushing
    if (!Array.isArray(savedConfigs.value)) {
      console.log('Options: Initializing savedConfigs as empty array')
      savedConfigs.value = []
    }
    
    if (isEditing.value) {
      savedConfigs.value[editingIndex.value] = newConfig
    } else {
      savedConfigs.value.push(newConfig)
    }
    
    // Ensure we're saving an array
    const configsToSave = Array.from(savedConfigs.value)
    console.log('Options: About to save configs:', JSON.stringify(configsToSave, null, 2))
    await browser.storage.local.set({ glideConfigs: configsToSave })
    console.log('Options: Saved to storage successfully')
    
    status.value = {
      type: 'success',
      message: `Configuration ${isEditing.value ? 'updated' : 'saved'} successfully!`
    }
    
    resetForm()
  } catch (error) {
    console.error('Options: Save error:', error)
    status.value = {
      type: 'error',
      message: error.message || 'Failed to save configuration. Please ensure all fields are valid.'
    }
  }
}

function editConfig(index) {
  const config = savedConfigs.value[index]
  currentConfig.value = {
    ...config,
    columns: JSON.stringify(JSON.parse(config.columns), null, 2)
  }
  isEditing.value = true
  editingIndex.value = index
}

function deleteConfig(index) {
  if (confirm('Are you sure you want to delete this configuration?')) {
    // Ensure savedConfigs is an array before splicing
    if (!Array.isArray(savedConfigs.value)) {
      savedConfigs.value = []
      return
    }
    
    savedConfigs.value.splice(index, 1)
    browser.storage.local.set({ glideConfigs: savedConfigs.value })
    status.value = {
      type: 'success',
      message: 'Configuration deleted successfully!'
    }
  }
}

function resetForm() {
  currentConfig.value = {
    name: '',
    apiToken: '',
    appId: '',
    tableId: '',
    columns: ''
  }
  glideCode.value = ''
  isEditing.value = false
  editingIndex.value = -1
  status.value = null
}
</script>

<style>
.configs-list {
  margin-bottom: var(--spacing-xl);
}

.config-item {
  padding: var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: var(--spacing-md);
  background-color: var(--bg-color);
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.config-header h3 {
  margin: 0;
  font-size: var(--text-md);
}

.config-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.button-group {
  display: flex;
  gap: var(--spacing-sm);
}

button.secondary {
  background-color: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-color);
}

button.secondary:hover {
  background-color: var(--border-color);
  border-color: var(--border-color-dark);
}

button.danger {
  background-color: var(--error-color);
  border-color: var(--error-color);
}

button.danger:hover {
  background-color: #E63535;
  border-color: #E63535;
}

@media (prefers-color-scheme: dark) {
  .config-item {
    background-color: var(--container-bg-dark);
  }
  
  button.secondary {
    color: var(--text-color-light);
  }
}
</style>
