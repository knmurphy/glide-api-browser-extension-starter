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
  private table: ReturnType<typeof glide.table>;

  constructor(config: GlideTableConfig) {
    try {
      this.table = glide.table({
        token: config.apiToken,
        app: config.appId,
        table: config.tableId,
        columns: config.columns
      });
      console.log('Glide table initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Glide table:', error);
      throw error;
    }
  }

  async getRows(options: { limit?: number; offset?: number } = {}) {
    try {
      return await this.table.get();
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
      const result = await this.table.add(cleanData);
      console.log('Row added successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to add row:', error);
      throw error;
    }
  }
}

export { GlideApiClient, type GlideTableConfig, type GlideColumn };
