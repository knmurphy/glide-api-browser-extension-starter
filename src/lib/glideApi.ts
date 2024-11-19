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
  private config: GlideTableConfig;
  private baseUrl = 'https://api.glideapp.io/api/data/v0';

  constructor(config: GlideTableConfig) {
    this.config = config;
  }

  private async request(method: string, endpoint: string, data?: any) {
    const url = `${this.baseUrl}/${this.config.appId}/tables/${this.config.tableId}${endpoint}`;
    console.log('Making request to:', url);
    
    const requestOptions = {
      method,
      headers: {
        'api-key': this.config.apiToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    };
    
    try {
      const response = await fetch(url, requestOptions);
      const responseText = await response.text();
      
      console.log('Response status:', response.status);
      console.log('Response text:', responseText);

      if (!response.ok) {
        let errorMessage = 'Unknown error';
        try {
          // Try to parse as JSON first
          const error = JSON.parse(responseText);
          errorMessage = error.message || error.error || JSON.stringify(error);
        } catch {
          // If not JSON, try to parse XML error
          if (responseText.includes('<Error>')) {
            const message = responseText.match(/<Message>(.*?)<\/Message>/)?.[1];
            if (message) {
              errorMessage = message;
            }
          } else {
            errorMessage = responseText || 'No error details available';
          }
        }
        throw new Error(`Glide API error: ${errorMessage}`);
      }

      // For successful responses, try to parse as JSON
      try {
        return responseText ? JSON.parse(responseText) : null;
      } catch (e) {
        console.error('Failed to parse response as JSON:', responseText);
        return responseText; // Return raw text if not JSON
      }
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  async getRows(options: { limit?: number; offset?: number } = {}) {
    const { limit = 10, offset = 0 } = options;
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    return this.request('GET', `/rows?${queryParams.toString()}`);
  }

  async addRow(data: Record<string, any>) {
    // Validate row data against column definitions
    for (const [key, value] of Object.entries(data)) {
      const column = this.config.columns[key];
      if (!column) {
        throw new Error(`Unknown column: ${key}`);
      }

      // Basic type validation
      switch (column.type.toLowerCase()) {
        case 'number':
          if (value && isNaN(Number(value))) {
            throw new Error(`Invalid number value for column ${key}: ${value}`);
          }
          break;
        case 'boolean':
          if (value && typeof value !== 'boolean') {
            throw new Error(`Invalid boolean value for column ${key}: ${value}`);
          }
          break;
      }
    }

    // Convert empty strings to null
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      acc[key] = value === '' ? null : value;
      return acc;
    }, {} as Record<string, any>);

    // Format request body according to Glide API specs
    return this.request('POST', '/rows', {
      rows: [cleanData]
    });
  }

  async updateRow(rowId: string, data: Record<string, any>) {
    return this.request('PATCH', `/rows/${rowId}`, { values: data });
  }

  async deleteRow(rowId: string) {
    return this.request('DELETE', `/rows/${rowId}`);
  }
}

export { GlideApiClient, type GlideTableConfig, type GlideColumn };
