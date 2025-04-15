import axios, { AxiosInstance } from "axios";
import { CollectionField } from "./schema.js";

export interface Client {
  setToken(token: string | null): void;
  collection<T = Record<string, unknown>>(name: string, data: Array<CollectionField>): Promise<Collection<T>>;
}

export interface Collection<T = Record<string, unknown>> {
  getById(id: string): Promise<T | null>;
  findOne(params: Record<string, unknown>): Promise<T | null>;
  create(data: T): Promise<T>;
  insertOne(data: T): Promise<T>;
  updateById(id: string, data: Partial<T>): Promise<T>;
  findOneAndUpdate(params: Record<string, unknown>, data: Partial<T>): Promise<T | null>;
  deleteOne(params: Record<string, unknown>): Promise<void>;
  deleteMany(params: Record<string, unknown>): Promise<void>;
  findOneAndDelete(params: Record<string, unknown>): Promise<T | null>;
}

/* Default Universal Request one can implement to use the UniversalClient directly without any changes... */
interface FindRequest {
  query: Record<string, unknown>;
  findOne: boolean;
}

interface CreateRequest<T = Record<string, unknown>> {
  query: T;
  insertOne: boolean;
}

interface FindAndUpdateRequest<T = Record<string, unknown>> {
  query: Record<string, unknown>;
  update: Partial<T>;
  findOne: boolean;
}

interface DeleteRequest {
  query: Record<string, unknown>;
  deleteMany: boolean;
  findOne: boolean;
};

class UniversalCollection<T = Record<string, unknown>> implements Collection<T> {
  private client: UniversalClient;
  private name: string;

  constructor(client: UniversalClient, name: string) {
    this.client = client;
    this.name = name;
  }

  async getById(id: string): Promise<T | null> {
    const reqData: FindRequest = {
      query: { id: id },
      findOne: true,
    }
    return this.client.get(`${this.name}`, JSON.stringify(reqData));
  }

  async findOne(params: Record<string, unknown>): Promise<T | null> {
    const reqData: FindRequest = {
      query: params,
      findOne: true,
    }
    return await this.client.get(`${this.name}`, JSON.stringify(reqData));
  }

  private async createOne(params: T, insert: boolean = false): Promise<T> {
    const reqData: CreateRequest<T> = {
      query: params,
      insertOne: insert,
    }
    return this.client.post(`${this.name}`, JSON.stringify(reqData));
  }

  async create(data: T): Promise<T> {
    return this.createOne(data);
  }

  async insertOne(data: T): Promise<T> {
    return this.createOne(data, true);
  }

  async updateById(id: string, data: Partial<T>): Promise<T> {
    return this.client.put(`${this.name}/${id}`, JSON.stringify(data));
  }

  async findOneAndUpdate(params: Record<string, unknown>, data: Partial<T>): Promise<T | null> {
    const reqData: FindAndUpdateRequest = {
      query: params,
      update: data,
      findOne: true,
    }
    return this.client.put(`${this.name}`, JSON.stringify(reqData));
  }

  async deleteOne(params: Record<string, unknown>): Promise<void> {
    const reqData: DeleteRequest = {
      query: params,
      deleteMany: false,
      findOne: false,
    }
    return this.client.delete(`${this.name}`, JSON.stringify(reqData));
  }

  async deleteMany(params: Record<string, unknown>): Promise<void> {
    const reqData: DeleteRequest = {
      query: params,
      deleteMany: true,
      findOne: false,
    }
    return this.client.delete(`${this.name}`, JSON.stringify(reqData));
  }

  async findOneAndDelete(params: Record<string, unknown>): Promise<T | null> {
    const reqData: DeleteRequest = {
      query: params,
      deleteMany: false,
      findOne: true,
    }
    return this.client.delete(`${this.name}`, JSON.stringify(reqData));
  }
}

class UniversalClient implements Client {
  private client: AxiosInstance;
  private url: string;
  private databaseName: string;
  private confrimedCollections: Set<string> = new Set();

  constructor(url: string, databaseName: string, token: string | null = null) {
    this.url = url;
    this.databaseName = databaseName;

    this.client = axios.create({
      baseURL: this.url,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 404) {
          return Promise.resolve({ data: null });
        }
        return Promise.reject(error);
      }
    );

    if (token) {
      this.client.defaults.headers["Authorization"] = `Bearer ${token}`;
    }
  }

  setToken(token: string | null) {
    if (token) {
      this.client.defaults.headers["Authorization"] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers["Authorization"];
    }
  }

  async get(path: string, params?: string) {
    const response = await this.client.get(`${this.databaseName}/${path}`, { data: params });
    return response.data;
  }

  async post(path: string, data?: string) {
    const response = await this.client.post(`${this.databaseName}/${path}`, data);
    return response.data;
  }

  async put(path: string, data?: string) {
    const response = await this.client.put(`${this.databaseName}/${path}`, data);
    return response.data;
  }

  async delete(path: string, data?: string) {
    if (data !== null) {
      const response = await this.client.delete(`${this.databaseName}/${path}`, { data: data });
      return response.data;
    }
    const response = await this.client.delete(`${this.databaseName}/${path}`);
    return response.data;
  }

  private async confirmCollection(name: string, data: Array<CollectionField>): Promise<boolean> {
    // Data format: [{ name: string, typeName: string, mainKey?: bool }, { name: string, typeName: string, mainKey?: bool }]
    const response = await this.client.post(`${this.databaseName}/collection/${name}`, JSON.stringify(data));
    return response.status === 200 || response.status === 201;
  }

  async collection<T = Record<string, unknown>>(name: string, data: Array<CollectionField>): Promise<Collection<T>> {
    if (this.confrimedCollections.has(name)) {
      return new UniversalCollection<T>(this, name);
    }

    if (!await this.confirmCollection(name, data)) {
      throw new Error(`Failed to confirm collection ${name}`);
    }
    this.confrimedCollections.add(name);
    return new UniversalCollection<T>(this, name);
  }
}

export function createUniversalClient(url: string, databaseName: string, token: string | null = null): Client {
  return new UniversalClient(url, databaseName, token);
}