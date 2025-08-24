import { PaginatedResult } from "server/types/common.types";
import type {
  School,
  NewSchool,
  SchoolFindOptions,
} from "../models/schools.model";
import { SchoolsModel } from "../models/schools.model";

export const SchoolsController = {
  async create(payload: NewSchool): Promise<School> {
    return await SchoolsModel.create(payload);
  },

  async update(
    id: number,
    payload: Partial<NewSchool>,
  ): Promise<School | null> {
    return await SchoolsModel.update(id, payload);
  },

  async delete(
    id: number,
    opts?: { hard?: boolean },
  ): Promise<{ success: boolean }> {
    return await SchoolsModel.delete(id, opts);
  },

  async findById(
    id: number,
    opts?: { withDeleted?: boolean },
  ): Promise<School | null> {
    return await SchoolsModel.findById(id, opts);
  },

  async find(opts?: SchoolFindOptions): Promise<PaginatedResult<School>> {
    return await SchoolsModel.find(opts);
  },
};
