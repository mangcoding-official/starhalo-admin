import { faker } from "@faker-js/faker";

faker.seed(12345);

export const notifications = Array.from({ length: 50 }, () => {
    const statuses = ['draft','scheduled'] as const;
    const targets = ['all','platform','user','segment','role'] as const;
    const priorities = ['normal','high'] as const;

    return {
        id: `ID-${faker.number.int({ min: 1000, max: 9999 })}`,
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(2),
        imageUrl: faker.helpers.maybe(() => faker.image.urlPicsumPhotos({ width: 400, height: 200 })),
        target: faker.helpers.arrayElement(targets),
        criteria: null,
        priority: faker.helpers.arrayElement(priorities),
        // scheduleDate: faker.helpers.maybe(() => faker.date.future().toISOString()),
        scheduleDate: faker.date.past().toISOString(),
        status: faker.helpers.arrayElement(statuses),
        sentAt: null,
        createdBy: `User-${faker.number.int({ min: 1, max: 10 })}`,
        createdAt: faker.date.past().toISOString(),
        updatedAt: faker.date.recent().toISOString(),
        resultSummary: null,
    };
});