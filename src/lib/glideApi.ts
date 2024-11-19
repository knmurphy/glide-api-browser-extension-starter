import * as glide from "@glideapps/tables"

interface GlideColumn {
  type: 'string' | 'number' | 'boolean' | 'date';
  name: string;
}

interface GlideTableConfig {
  apiToken: string;
  appId: string;
  tableId: string;
  columns: Record<string, GlideColumn>;
}

class GlideApiClient {
  private apiKey: string;
  private appId: string;
  private tableId: string;
  private baseUrl: string = 'https://api.glideapp.io/api/v1/tables';

  constructor(config: GlideTableConfig) {
    this.apiKey = config.apiToken;
    this.appId = config.appId;
    this.tableId = config.tableId;
  }

  private getTableUrl(): string {
    return `${this.baseUrl}/${this.appId}/${this.tableId}`;
  }

  async getRows(options: { limit?: number; offset?: number } = {}) {
    try {
      const response = await fetch(this.getTableUrl(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to get rows')
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get rows:', error);
      throw error;
    }
  }

  async addRow(data: Record<string, any>) {
    try {
      console.log('Adding row with data:', data);
      const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
        acc[key] = value === '' ? null : value;
        return acc;
      }, {} as Record<string, any>);
      const response = await fetch(this.getTableUrl(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to add row')
      }
      console.log('Row added successfully');
    } catch (error) {
      console.error('Failed to add row:', error);
      throw error;
    }
  }
}

export { GlideApiClient, type GlideTableConfig, type GlideColumn };
