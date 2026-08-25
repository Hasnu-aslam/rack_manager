export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    if (response.status === 204) {
      return null as any;
    }
    return response.json();
  }

  // Products
  async getProducts(params?: {
    skip?: number;
    limit?: number;
    category?: string;
    brand?: string;
    low_stock?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return this.request<any[]>(`/api/v1/products${query ? `?${query}` : ""}`);
  }

  async getProduct(id: number) {
    return this.request<any>(`/api/v1/products/${id}`);
  }

  async createProduct(data: any) {
    return this.request<any>("/api/v1/products", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateProduct(id: number, data: any) {
    return this.request<any>(`/api/v1/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: number) {
    return this.request<void>(`/api/v1/products/${id}`, {
      method: "DELETE",
    });
  }

  async updateStock(id: number, quantity: number, reason?: string) {
    return this.request<any>(`/api/v1/products/${id}/stock`, {
      method: "POST",
      body: JSON.stringify({ quantity, reason }),
    });
  }

  // Customers
  async getCustomers(params?: {
    skip?: number;
    limit?: number;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return this.request<any[]>(`/api/v1/customers${query ? `?${query}` : ""}`);
  }

  async getCustomer(id: number) {
    return this.request<any>(`/api/v1/customers/${id}`);
  }

  async createCustomer(data: any) {
    return this.request<any>("/api/v1/customers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCustomer(id: number, data: any) {
    return this.request<any>(`/api/v1/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteCustomer(id: number) {
    return this.request<void>(`/api/v1/customers/${id}`, {
      method: "DELETE",
    });
  }

  // Sales
  async getSales(params?: {
    skip?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return this.request<any[]>(`/api/v1/sales${query ? `?${query}` : ""}`);
  }

  async getSale(id: number) {
    return this.request<any>(`/api/v1/sales/${id}`);
  }

  async createSale(data: any) {
    return this.request<any>("/api/v1/sales", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Dashboard
  async getDashboardStats(period: string = "daily", startDate?: string, endDate?: string) {
    const params = new URLSearchParams({ period });
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    return this.request<any>(`/api/v1/dashboard/stats?${params}`);
  }

  async getSalesOverview(period: string = "daily", startDate?: string, endDate?: string) {
    const params = new URLSearchParams({ period });
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    return this.request<any>(`/api/v1/dashboard/sales-overview?${params}`);
  }

  async getSalesTrends(period: string = "daily", days: number = 30) {
    return this.request<any[]>(`/api/v1/dashboard/sales-trends?period=${period}&days=${days}`);
  }

  async getBestSellers(limit: number = 10, startDate?: string, endDate?: string) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    return this.request<any[]>(`/api/v1/dashboard/best-sellers?${params}`);
  }

  async getCategoryPerformance(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    return this.request<any[]>(`/api/v1/dashboard/category-performance?${params}`);
  }

  async getLowStockProducts(threshold: number = 10) {
    return this.request<any[]>(`/api/v1/dashboard/low-stock?threshold=${threshold}`);
  }

  // Auth
  async getCurrentUser() {
    return this.request<any>("/api/v1/auth/me");
  }

  // Tenants
  async getTenants() {
    return this.request<any[]>("/api/v1/tenants/");
  }

  async createTenant(data: { name: string; admin_username: string; admin_email: string }) {
    return this.request<any>("/api/v1/tenants/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async setInitialPassword(data: any) {
    return this.request<any>("/api/v1/auth/set-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteTenant(tenantId: number) {
    return this.request<any>(`/api/v1/tenants/${tenantId}`, {
      method: "DELETE",
    });
  }

  async revertSale(saleId: number) {
    return this.request<any>(`/api/v1/sales/${saleId}/revert`, {
      method: "POST",
    });
  }
}

export const apiClient = new ApiClient();
