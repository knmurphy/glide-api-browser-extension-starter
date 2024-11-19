<template>
  <div class="container">
    <h1>Glide API Settings</h1>
    
    <form @submit.prevent="saveSettings">
      <div class="form-group">
        <label for="apiToken">API Token</label>
        <input
          id="apiToken"
          v-model="settings.apiToken"
          type="password"
          placeholder="Enter your Glide API token"
          required
        />
      </div>

      <div class="form-group">
        <label for="appId">App ID</label>
        <input
          id="appId"
          v-model="settings.appId"
          type="text"
          placeholder="Enter your Glide app ID"
          required
        />
      </div>

      <div class="form-group">
        <label for="tableId">Table ID</label>
        <input
          id="tableId"
          v-model="settings.tableId"
          type="text"
          placeholder="Enter your Glide table ID"
          required
        />
      </div>

      <div class="form-group">
        <label for="columns">Table Columns</label>
        <textarea
          id="columns"
          v-model="settings.columns"
          rows="6"
          placeholder="name: { type: 'string', name: 'Name' },
email: { type: 'string', name: 'Email' },
age: { type: 'number', name: 'Age' }"
        ></textarea>
        <div class="help-text">
          Enter columns in the format shown above. Valid types are: string, number, boolean, date
        </div>
        <div v-if="columnsError" class="error">
          {{ columnsError }}
        </div>
      </div>

      <div class="button-row">
        <button type="submit" class="button" :disabled="saving">
          {{ saving ? 'Saving...' : 'Save Settings' }}
        </button>
        <div v-if="status" :class="['status-message', status.type]">
          {{ status.message }}
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Settings {
  apiToken: string
  appId: string
  tableId: string
  columns: string
}

const settings = ref<Settings>({
  apiToken: '',
  appId: '',
  tableId: '',
  columns: '',
})

const saving = ref(false)
const columnsError = ref('')
const status = ref<{ type: 'success' | 'error'; message: string } | null>(null)

onMounted(async () => {
  // Load saved settings
  const savedSettings = await chrome.storage.local.get(['apiToken', 'appId', 'tableId', 'columns'])
  settings.value = {
    apiToken: savedSettings.apiToken || '',
    appId: savedSettings.appId || '',
    tableId: savedSettings.tableId || '',
    columns: savedSettings.columns || '',
  }
})

const validateColumns = (columnsStr: string): boolean => {
  if (!columnsStr) return true // Empty is valid
  try {
    // Remove any outer braces if they exist
    const trimmed = columnsStr.trim().replace(/^{|}$/g, '').trim()
    console.log('Trimmed:', trimmed)

    // Split by commas that aren't inside nested objects
    const columnEntries = trimmed.split(/,(?![^{]*})/g)
    console.log('Split entries:', columnEntries)

    const columnObj: Record<string, any> = {}
    
    for (const entry of columnEntries) {
      // Skip empty entries
      if (!entry.trim()) continue

      // Extract key and value
      const [key, value] = entry.split(/:(?![^{]*})/).map(s => s.trim())
      if (!key || !value) {
        throw new Error('Invalid column format')
      }

      // Clean up the key (remove quotes if present)
      const cleanKey = key.replace(/^["']|["']$/g, '')

      try {
        // Try to parse the value as JSON first
        const parsedValue = JSON.parse(value)
        columnObj[cleanKey] = parsedValue
      } catch {
        // If JSON.parse fails, try to parse the relaxed format
        const relaxedValue = value
          .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
          .replace(/'/g, '"')
        try {
          columnObj[cleanKey] = JSON.parse(relaxedValue)
        } catch {
          throw new Error(`Invalid value format for column "${cleanKey}"`)
        }
      }
    }

    // Validate the structure of each column
    for (const [key, value] of Object.entries(columnObj)) {
      if (typeof value !== 'object' || !value.type || !value.name) {
        columnsError.value = `Column "${key}" must have "type" and "name" properties`
        return false
      }
      
      // Validate type is one of the allowed values
      const validTypes = ['string', 'number', 'boolean', 'date']
      if (!validTypes.includes(value.type)) {
        columnsError.value = `Column "${key}" has invalid type. Valid types are: ${validTypes.join(', ')}`
        return false
      }
    }

    // Store the properly formatted JSON
    settings.value.columns = JSON.stringify(columnObj)
    return true
  } catch (error) {
    console.error('Validation error:', error)
    columnsError.value = error instanceof Error ? error.message : 'Invalid format'
    return false
  }
}

const saveSettings = async () => {
  columnsError.value = ''
  status.value = null
  
  if (!validateColumns(settings.value.columns)) {
    return
  }

  saving.value = true
  try {
    await chrome.storage.local.set({
      apiToken: settings.value.apiToken,
      appId: settings.value.appId,
      tableId: settings.value.tableId,
      columns: settings.value.columns,
    })
    
    status.value = {
      type: 'success',
      message: 'Settings saved successfully!',
    }
  } catch (error) {
    status.value = {
      type: 'error',
      message: 'Failed to save settings. Please try again.',
    }
  } finally {
    saving.value = false
  }
}
</script>

<style>
.button-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.button {
  flex-shrink: 0;
  width: auto;
  min-width: 120px;
}

.status-message {
  padding: 0.5rem;
  border-radius: 0.25rem;
  flex-grow: 1;
}

.status-message.success {
  background-color: #e6ffe6;
  color: #006600;
  border: 1px solid #b3ffb3;
}

.status-message.error {
  background-color: #ffe6e6;
  color: #cc0000;
  border: 1px solid #ffb3b3;
}
</style>
