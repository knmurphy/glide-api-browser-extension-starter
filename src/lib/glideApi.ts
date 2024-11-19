import * as glide from "@glideapps/tables"

interface GlideColumn {
  type: string;
  name: string;
}

interface GlideTableConfig {
  apiToken: string;
  appId: string;
  tableId: string;
  columns: Record<string, GlideColumn>;
}

class GlideApiClient {
  private table: any;

  constructor(config: GlideTableConfig) {
    // Create the Glide table instance using their SDK
    this.table = glide.table({
      token: config.apiToken,
      app: config.appId,
      table: config.tableId,
      columns: JSON.parse(typeof config.columns === 'string' ? config.columns : JSON.stringify(config.columns))
    });
  }

  async getRows(options: { limit?: number; offset?: number } = {}) {
    try {
      return await this.table.fetch();
    } catch (error) {
      console.error('Failed to get rows:', error);
      throw error;
    }
  }

  async addRow(data: Record<string, any>) {
    try {
      console.log('API Client - Adding row with data:', data);
      
      // Use the Glide SDK to add the row
      const result = await this.table.add(data);
      console.log('API Client - Row added successfully:', result);
      return result;
    } catch (error) {
      console.error('API Client - Failed to add row:', error);
      throw error;
    }
  }
}

export { GlideApiClient, type GlideTableConfig, type GlideColumn };
