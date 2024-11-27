import { z } from 'zod';

export const JobRequestScalarFieldEnumSchema = z.enum(['id','description','location','startDate','endDate','costEstimate','actualCost','jobType','images','rejectionCount','priority','requestId','status','assignedTo','createdAt','updatedAt']);

export default JobRequestScalarFieldEnumSchema;
