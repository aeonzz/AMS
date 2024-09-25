import { z } from 'zod';

export const DepartmentScalarFieldEnumSchema = z.enum(['id','description','name','acceptsJobs','acceptsTransport','createdAt','updatedAt','responsibilities','departmentType','isArchived']);

export default DepartmentScalarFieldEnumSchema;
