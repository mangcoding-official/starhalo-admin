import { faker } from "@faker-js/faker";

faker.seed(12345);

export const informations = Array.from({ length: 50 }, () => {
    const statuses = ["draft", "published", "scheduled", "archived"] as const;

    return {
        id: `ID-${faker.number.int({ min: 1000, max: 9999 })}`,
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(2, '\n\n'),
        status: faker.helpers.arrayElement(statuses),
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
    };
});
