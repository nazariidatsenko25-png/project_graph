import { z } from 'zod';

export const MappingSchema = z.object({
  source: z.string().min(1, 'Source column is required'),
  target: z.string().min(1, 'Target column is required'),
  edge_weight: z.string().optional(),
  source_weight: z.string().optional(),
  target_weight: z.string().optional(),
});

export type MappingConfig = z.infer<typeof MappingSchema>;

export function validateMapping(mapping: Record<string, string>): {
  success: boolean;
  errors?: string[];
} {
  const result = MappingSchema.safeParse(mapping);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map((e) => e.message),
    };
  }
  return { success: true };
}
