import { Model, ObjectId } from "mongoose";
import { IResponseHandler } from "./IResponseHandler";

export interface IService {
  readonly model: Model<any>
  readonly name?: string
  getAll(query: any): Promise<IResponseHandler>
  insert(data: any): Promise<IResponseHandler>
  update(id: string, data: any): Promise<IResponseHandler>
  delete(id: string): Promise<IResponseHandler>
}