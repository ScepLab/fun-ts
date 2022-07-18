import { Comment, RestApiExample } from "./rest-definition";

import { createTypedRouter } from "@fun-ts/rest/src/express";
import express from "express";
import { faker } from "@faker-js/faker";

export const userRouter = express.Router();

const router = createTypedRouter<RestApiExample>(userRouter);

// eslint-disable-next-line no-unused-vars
router.get("/comments", async (_req, _res) => {
    return [...Array(faker.datatype.number({
        min: 50,
        max: 1000
    }))].map((_, i) => ({
        id: i,
        postId: i,
        body: faker.lorem.words(),
        name: faker.lorem.words(),
        email: faker.internet.email(),
    } as Comment));
});

// eslint-disable-next-line no-unused-vars
router.get("/comment/:id", async (_req, _res) => {
    return [...Array(faker.datatype.number({
        min: 50,
        max: 1000
    }))].map((_, i) => ({
        id: i,
        // postId: req.params.id,
        body: faker.lorem.words(),
        name: faker.lorem.words(),
        email: faker.internet.email(),
    } as Comment));
});
