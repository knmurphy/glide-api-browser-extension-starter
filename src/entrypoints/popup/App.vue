<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { GlideApiClient, type GlideTableConfig } from '~/lib/glideApi'

interface ColumnConfig {
  type: string
  name: string
}

const columns = ref<Record<string, ColumnConfig>>({})
const formData = ref<Record<string, any>>({})
const error = ref<string | null>(null)
const loading = ref(false)
const success = ref(false)

onMounted(async () => {
  try {
    console.log('Popup mounted, fetching settings...');
    const savedSettings = await chrome.storage.local.get(['apiToken', 'appId', 'tableId', 'columns'])
    console.log('Saved settings:', {
      ...savedSettings,
      apiToken: savedSettings.apiToken ? '***' : undefined,
      columns: savedSettings.columns || 'not set'
    });

    if (!savedSettings.columns) {
      console.log('No columns found in settings');
      error.value = 'Please configure table columns in extension settings first.'
      return
    }
    
    console.log('Raw columns string:', savedSettings.columns);
    columns.value = JSON.parse(savedSettings.columns)
    console.log('Parsed columns:', columns.value);

    // Initialize form data with empty values
    formData.value = Object.keys(columns.value).reduce((acc, key) => {
      const column = columns.value[key]
      console.log(`Initializing field ${key} with type ${column.type}`);
      switch (column.type) {
        case 'boolean':
          acc[key] = false
          break
        case 'number':
          acc[key] = null
          break
        default:
          acc[key] = ''
      }
      return acc
    }, {} as Record<string, any>)
    console.log('Initialized form data:', formData.value);
  } catch (err) {
    console.error('Error in popup initialization:', err);
    error.value = 'Failed to load column configuration'
  }
})

function getInputType(columnType: string): string {
  switch (columnType) {
    case 'number':
      return 'number'
    case 'boolean':
      return 'checkbox'
    case 'date':
      return 'date'
    default:
      return 'text'
  }
}

async function handleSubmit() {
  loading.value = true
  error.value = null
  success.value = false

  try {
    const savedSettings = await chrome.storage.local.get(['apiToken', 'appId', 'tableId', 'columns'])
    if (!savedSettings.apiToken || !savedSettings.appId || !savedSettings.tableId) {
      throw new Error('Please configure API settings in extension options first.')
    }

    console.log('Saved settings:', {
      ...savedSettings,
      apiToken: '***' // Hide the token in logs
    });

    const config: GlideTableConfig = {
      apiToken: savedSettings.apiToken,
      appId: savedSettings.appId,
      tableId: savedSettings.tableId,
      columns: JSON.parse(savedSettings.columns)
    }

    console.log('Form data before submission:', formData.value);
    const client = new GlideApiClient(config)
    await client.addRow(formData.value)
    
    // Reset form on success
    success.value = true
    formData.value = Object.keys(columns.value).reduce((acc, key) => {
      const column = columns.value[key]
      switch (column.type) {
        case 'boolean':
          acc[key] = false
          break
        case 'number':
          acc[key] = null
          break
        default:
          acc[key] = ''
      }
      return acc
    }, {} as Record<string, any>)

    // Clear success message after 3 seconds
    setTimeout(() => {
      success.value = false
    }, 3000)
  } catch (err) {
    console.error('Failed to add row:', err)
    error.value = err instanceof Error ? err.message : 'Failed to add row'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="container">
    <h2>Add New Row</h2>
    
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="success" class="success">Row added successfully!</div>

    <form v-if="Object.keys(columns).length" @submit.prevent="handleSubmit" class="form">
      <div v-for="(config, field) in columns" :key="field" class="form-group">
        <label :for="field">{{ config.name }}</label>
        <input
          :id="field"
          v-model="formData[field]"
          :type="getInputType(config.type)"
          :placeholder="config.name"
          class="form-input"
        >
      </div>
      <button type="submit" class="submit-button" :disabled="loading">
        {{ loading ? 'Adding...' : 'Add Row in Glide' }}
      </button>
    </form>

    <div v-else class="message">
      Please configure table columns in extension settings first.
    </div>
  </div>
</template>

<style>
.container {
  min-width: 320px;
  max-width: 400px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.error {
  padding: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: var(--error-color);
}

.success {
  padding: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  background-color: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 8px;
  color: var(--success-color);
}

.message {
  text-align: center;
  color: var(--help-text-color);
  padding: var(--spacing-md);
}
</style>
