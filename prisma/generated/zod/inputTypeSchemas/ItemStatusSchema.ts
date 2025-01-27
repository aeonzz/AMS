import { z } from 'zod';

export const ItemStatusSchema = z.enum(['AVAILABLE','IN_USE','MAINTENANCE','LOST']);

export type ItemStatusType = `${z.infer<typeof ItemStatusSchema>}`

export default ItemStatusSchema;
