import { learningRepository } from '../repositories/learning.repository.js';
import { AppError } from '../middleware/error.middleware.js';
import { LearningModule, ModuleProgress } from '../models/index.js';
import { generateCaregivingModules } from './gemini.service.js';
import { logger } from '../utils/logger.js';

export const learningService = {
  // -- Modules (admin) --
  async createModule(input: {
    title: string;
    description?: string;
    video_url?: string;
    category?: string;
    duration_minutes?: number;
  }): Promise<LearningModule> {
    return learningRepository.createModule(input);
  },

  async updateModule(id: string, input: Partial<{
    title: string;
    description: string;
    video_url: string;
    category: string;
    duration_minutes: number;
    is_active: boolean;
  }>): Promise<LearningModule> {
    const updated = await learningRepository.updateModule(id, input);
    if (!updated) {
      throw new AppError(404, 'Module not found', 'NOT_FOUND');
    }
    return updated;
  },

  async deleteModule(id: string): Promise<void> {
    const deleted = await learningRepository.deleteModule(id);
    if (!deleted) {
      throw new AppError(404, 'Module not found', 'NOT_FOUND');
    }
  },

  async listModules(includeInactive = false): Promise<LearningModule[]> {
    const existing = await learningRepository.listModules(!includeInactive);
    if (existing.length > 0) return existing;

    // No modules yet — seed from Gemini
    logger.info('No learning modules found — seeding from Gemini AI...');
    try {
      const generated = await generateCaregivingModules();
      const created = await Promise.all(
        generated.map(m => learningRepository.createModule({
          title: m.title,
          description: m.description,
          category: m.category,
          difficulty: m.difficulty,
          duration_minutes: m.duration_minutes,
          content_sections: m.content_sections,
          key_takeaways: m.key_takeaways,
          quiz: m.quiz,
        }))
      );
      logger.info(`Seeded ${created.length} learning modules`);
      return created;
    } catch (err) {
      logger.error('Failed to seed learning modules from Gemini', { err });
      return [];
    }
  },

  async getModule(id: string): Promise<LearningModule> {
    const module = await learningRepository.findModuleById(id);
    if (!module) {
      throw new AppError(404, 'Module not found', 'NOT_FOUND');
    }
    return module;
  },

  // -- Progress (user) --
  async updateProgress(userId: string, input: {
    module_id: string;
    completed: boolean;
    quiz_score?: number;
  }): Promise<ModuleProgress> {
    // Verify module exists
    const module = await learningRepository.findModuleById(input.module_id);
    if (!module) {
      throw new AppError(404, 'Module not found', 'NOT_FOUND');
    }

    return learningRepository.upsertProgress({
      user_id: userId,
      module_id: input.module_id,
      completed: input.completed,
      quiz_score: input.quiz_score,
    });
  },

  async getUserProgress(userId: string): Promise<ModuleProgress[]> {
    return learningRepository.listUserProgress(userId);
  },
};
