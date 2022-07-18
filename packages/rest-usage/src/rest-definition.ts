export type Post = {
    userId: number;
    id: number;
    title: string;
    body: string;
};

export type Comment = {
    postId: number;
    id: number;
    name: string;
    email: string;
    body: string;
};

export type Album = {
    userId: number;
    id: number;
    title: string;
};

export type Photo = {
    albumId: number;
    id: number;
    title: string;
    url: string;
    thumbnailUrl: string;
};

export type Geo = {
    lat: string;
    lng: string;
};

export type Address = {
    street: string;
    suite: string;
    city: string;
    zipCode: string;
    geo: Geo;
};

export type Company = {
    name: string;
    catchPhrase: string;
    bs: string;
};

export type User = {
    id: number;
    name: string;
    username: string;
    email: string;
    address: Address;
    phone: string;
    website: string;
    company: Company;
};

export type Todo = {
    userId: number;
    id: number;
    title: string;
    completed: boolean;
};

export type RestApiExample = {
    "/posts": {
        GET: {
            response: Post[];
        };
    },
    "/posts/:id": {
        GET: {
            params: {
                id: number;
            };
            response: Post[];
        };
    };
    "/posts/:id/comments": {
        GET: {
            params: {
                id: number;
            };
            response: Comment[];
        };
    };
    "/comments": {
        GET: {
            query: {
                postId: number;
            };
            response: Comment[];
        };
    };
    "/comment/:id": {
        GET: {
            params: {
                id: number;
            };
            response: Comment;
        };
    };
};
