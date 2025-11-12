import { faker } from "@faker-js/faker";

faker.seed(12345);

const statusOptions = ['draft', 'published'] as const

export const informations = Array.from({ length: 50 }, (_, index) => {
  return {
    id: `INFO-${String(index + 1).padStart(3, '0')}`,
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(2, '\n\n'),
    status: faker.helpers.arrayElement(statusOptions),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
  }
})
