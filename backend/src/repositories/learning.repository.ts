import type { Query, DocumentData } from 'firebase-admin/firestore';
import { getDb } from '../config/firestore.js';
import { LearningModule, ModuleProgress, QuizQuestion, ContentSection } from '../models/index.js';
import { docToModel, newId, now } from './_helpers.js';

const MODULES_COL = 'learning_modules';
const PROGRESS_COL = 'module_progress';

export const learningRepository = {
  // ── Modules ──────────────────────────────────────────────────────────────

  async findModuleById(id: string): Promise<LearningModule | null> {
    const snap = await getDb().collection(MODULES_COL).doc(id).get();
    if (!snap.exists) return null;
    return docToModel<LearningModule>(snap.id, snap.data()!);
  },

  async createModule(data: {
    title: string;
    description?: string;
    video_url?: string;
    category?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    duration_minutes?: number;
    content_sections?: ContentSection[];
    key_takeaways?: string[];
    quiz?: QuizQuestion[];
  }): Promise<LearningModule> {
    const id = newId();
    const ts = now();
    const doc = {
      title: data.title,
      description: data.description ?? null,
      video_url: data.video_url ?? null,
      category: data.category ?? null,
      difficulty: data.difficulty ?? null,
      duration_minutes: data.duration_minutes ?? null,
      content_sections: data.content_sections ?? [],
      key_takeaways: data.key_takeaways ?? [],
      quiz: data.quiz ?? [],
      is_active: true,
      created_at: ts,
      updated_at: ts,
    };
    await getDb().collection(MODULES_COL).doc(id).set(doc);
    return docToModel<LearningModule>(id, doc);
  },

  async updateModule(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      video_url: string;
      category: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      duration_minutes: number;
      content_sections: ContentSection[];
      key_takeaways: string[];
      quiz: QuizQuestion[];
      is_active: boolean;
    }>
  ): Promise<LearningModule | null> {
    const updates: Record<string, unknown> = { updated_at: now() };
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) updates[key] = val;
    }
    await getDb().collection(MODULES_COL).doc(id).update(updates);
    return this.findModuleById(id);
  },

  async listModules(activeOnly = true): Promise<LearningModule[]> {
    let q: Query<DocumentData> = getDb().collection(MODULES_COL);
    if (activeOnly) q = q.where('is_active', '==', true);
    const snap = await q.orderBy('created_at', 'asc').get();
    return snap.docs.map((d: any) => docToModel<LearningModule>(d.id, d.data()));
  },

  async deleteModule(id: string): Promise<boolean> {
    await getDb().collection(MODULES_COL).doc(id).delete();
    return true;
  },

  // ── Progress ─────────────────────────────────────────────────────────────

  /**
   * Document ID is the composite key `${user_id}_${module_id}` for upsert support.
   */
  async getProgress(userId: string, moduleId: string): Promise<ModuleProgress | null> {
    const id = `${userId}_${moduleId}`;
    const snap = await getDb().collection(PROGRESS_COL).doc(id).get();
    if (!snap.exists) return null;
    return docToModel<ModuleProgress>(snap.id, snap.data()!);
  },

  async upsertProgress(data: {
    user_id: string;
    module_id: string;
    completed: boolean;
    quiz_score?: number;
  }): Promise<ModuleProgress> {
    const id = `${data.user_id}_${data.module_id}`;
    const ref = getDb().collection(PROGRESS_COL).doc(id);
    const existing = await ref.get();
    const ts = now();

    if (!existing.exists) {
      const doc = {
        user_id: data.user_id,
        module_id: data.module_id,
        completed: data.completed,
        quiz_score: data.quiz_score ?? null,
        completed_at: data.completed ? ts : null,
        created_at: ts,
      };
      await ref.set(doc);
      return docToModel<ModuleProgress>(id, doc);
    }

    const current = existing.data()!;
    const updates: Record<string, unknown> = {
      completed: data.completed,
    };
    if (data.quiz_score !== undefined) updates['quiz_score'] = data.quiz_score;
    if (data.completed && !current['completed_at']) updates['completed_at'] = ts;

    await ref.update(updates);
    return docToModel<ModuleProgress>(id, { ...current, ...updates });
  },

  async listUserProgress(userId: string): Promise<ModuleProgress[]> {
    const snap = await getDb().collection(PROGRESS_COL).where('user_id', '==', userId).get();
    return snap.docs.map((d: any) => docToModel<ModuleProgress>(d.id, d.data()));
  },
};
