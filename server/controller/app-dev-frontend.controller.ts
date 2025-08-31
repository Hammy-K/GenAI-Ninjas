import { AppDevFrontendModel } from "server/models/app-dev-frontend.model";

const model = new AppDevFrontendModel();

export const AppDevFrontendController = {
  async find(params: Parameters<typeof model.find>[0]) {
    return await model.find(params);
  },

  async findById(id: number) {
    return await model.findById(id);
  },

  async findByProjectId(projectId: string) {
    return await model.findByProjectId(projectId);
  },

  async create(payload: any) {
    return await model.create(payload);
  },

  async update(id: number, payload: any) {
    return await model.update(id, payload);
  },

  async delete(id: number) {
    return await model.delete(id);
  },
};
