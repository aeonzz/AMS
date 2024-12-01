import { z } from 'zod';

export const VenueRequestScalarFieldEnumSchema = z.enum(['id','departmentId','notes','purpose','setupRequirements','startTime','endTime','actualStart','inProgress','requestId','venueId','approvedByHead','createdAt','updatedAt']);

export default VenueRequestScalarFieldEnumSchema;
