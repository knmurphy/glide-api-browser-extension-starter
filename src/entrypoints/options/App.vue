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
        <label for="columns">Table Columns (JSON)</label>
        <input
          id="columns"
          v-model="settings.columns"
          type="text"
          placeholder='{"name": {"type": "string", "name": "Name"}, "description": {"type": "string", "name": "Description"}}'
        />
        <div class="help-text">
          Enter columns as valid JSON with double quotes. Example:<br>
          {"name": {"type": "string", "name": "Name"}}
        </div>
        <div v-if="columnsError" class="error">
          {{ columnsError }}
        </div>
      </div>

      <button type="submit" class="button" :disabled="saving">
        {{ saving ? 'Saving...' : 'Save Settings' }}
      </button>

      <div v-if="status" :class="['status', status.type]">
        {{ status.message }}
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storage } from 'wxt/storage'

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
  const savedSettings = await storage.local.get(['apiToken', 'appId', 'tableId', 'columns'])
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
    // Convert the more relaxed format to strict JSON
    const jsonStr = `{${columnsStr}}`
      .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // Add quotes to property names
      .replace(/\s*([{,])\s*/g, '$1') // Remove spaces around braces and commas
      
    const parsed = JSON.parse(jsonStr)
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Columns must be an object')
    }
    
    // Validate the structure of each column
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value !== 'object' || !value.type || !value.name) {
        columnsError.value = 'Each column must have "type" and "name" properties'
        return false
      }
    }
    
    // Store the properly formatted JSON
    settings.value.columns = JSON.stringify(parsed)
    return true
  } catch (error) {
    columnsError.value = 'Invalid format. Example: name: { type: "string", name: "Name" }'
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
    await storage.local.set({
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
