import { faker } from "@faker-js/faker";

faker.seed(12345);

export const informations = Array.from({ length: 50 }, () => {
    // const statuses = ["draft"s, "scheduled", "published"] as const;
    const statuses = ["draft", "published"] as const;

    return {
        id: `ID-${faker.number.int({ min: 1000, max: 9999 })}`,
        title: faker.lorem.sentence(),
        description: faker.lorem.paragraphs(3),
        publishDate: faker.date.past().toISOString(),
        status: faker.helpers.arrayElement(statuses),
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
    };
});
