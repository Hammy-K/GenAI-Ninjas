import { PaginatedResult } from "server/types/common.types";
import {
  LovableSubmissionsModel,
  LovableSubmission,
  NewLovableSubmission,
  LovableSubmissionFindOptions,
} from "./lovable-submissions.model";

export const LovableSubmissionsController = {
  async create(payload: NewLovableSubmission): Promise<LovableSubmission> {
    return await LovableSubmissionsModel.create(payload);
  },

  async update(
    id: number,
    payload: Partial<NewLovableSubmission>,
  ): Promise<LovableSubmission | null> {
    return await LovableSubmissionsModel.update(id, payload);
  },

  async delete(
    id: number,
    opts?: { hard?: boolean },
  ): Promise<{ success: boolean }> {
    return await LovableSubmissionsModel.delete(id, opts);
  },

  async findById(
    id: number,
    opts?: { withDeleted?: boolean },
  ): Promise<LovableSubmission | null> {
    return await LovableSubmissionsModel.findById(id, opts);
  },

  async find(
    opts?: LovableSubmissionFindOptions,
  ): Promise<PaginatedResult<LovableSubmission>> {
    return await LovableSubmissionsModel.find(opts);
  },
};
