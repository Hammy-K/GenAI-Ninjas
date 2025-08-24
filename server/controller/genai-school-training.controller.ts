import {
  GenaiSchoolTraining,
  GenaiSchoolTrainingFindOptions,
  GenaiSchoolTrainingModel,
  NewGenaiSchoolTraining,
} from "server/models/genai-school-training.model";
import { PaginatedResult } from "server/types/common.types";

export const GenaiSchoolTrainingController = {
  async create(payload: NewGenaiSchoolTraining): Promise<GenaiSchoolTraining> {
    return await GenaiSchoolTrainingModel.create(payload);
  },

  async update(
    id: number,
    payload: Partial<NewGenaiSchoolTraining>,
  ): Promise<GenaiSchoolTraining | null> {
    return await GenaiSchoolTrainingModel.update(id, payload);
  },

  async delete(
    id: number,
    opts?: { hard?: boolean },
  ): Promise<{ success: boolean }> {
    return await GenaiSchoolTrainingModel.delete(id, opts);
  },

  async findById(
    id: number,
    opts?: { withDeleted?: boolean },
  ): Promise<GenaiSchoolTraining | null> {
    return await GenaiSchoolTrainingModel.findById(id, opts);
  },

  async find(
    opts?: GenaiSchoolTrainingFindOptions,
  ): Promise<PaginatedResult<GenaiSchoolTraining>> {
    return await GenaiSchoolTrainingModel.find(opts);
  },
};
