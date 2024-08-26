import { z } from 'zod';

export const VenueRequestScalarFieldEnumSchema = z.enum(['id','notes','purpose','setupRequirements','startTime','endTime','requestId','venueId']);

export default VenueRequestScalarFieldEnumSchema;
