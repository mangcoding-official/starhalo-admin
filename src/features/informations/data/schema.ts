import { z } from "zod"

export const InformationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),       
  publishDate: z.string(),       
  // status: z.enum(['draft', 'scheduled', 'published']),          
  status: z.enum(['draft', 'published']),          
})

export type Information = z.infer<typeof InformationSchema>
