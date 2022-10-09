import * as core from "express-serve-static-core";

import { HttpMethod, RestBase, TypedRequest } from "./rest";

const route = <
    TRestDc extends RestBase,
    TPath extends keyof TRestDc,
    TMethod extends HttpMethod
>(
    app:
        | core.Express
        | core.Router
    ,
    path: TPath,
    method: TMethod,
    handler: (
        // eslint-disable-next-line no-unused-vars
        req: TypedRequest<TRestDc[TPath][TMethod]>,
        // eslint-disable-next-line no-unused-vars
        res: core.Response,
    ) => Promise<TRestDc[TPath][TMethod]["response"]>
) => {
    (app[method.toLowerCase()] as core.IRouterMatcher<void>)(
        // FIXME use only string type
        String(path), (req, res, next) =>
        handler(req, res)
            .then(result => {
                if (!res.headersSent) {
                    res.send(result);
                }
            })
            .catch(next)
    );
};

const createMethod = <TRestDc extends RestBase>(
    method: HttpMethod,
    app:
        | core.Express
        | core.Router
) => <TPath extends keyof TRestDc>(
    path: TPath,
    handler: (
        // eslint-disable-next-line no-unused-vars
        req: TypedRequest<TRestDc[TPath][typeof method]>,
        // eslint-disable-next-line no-unused-vars
        res: core.Response
    ) => Promise<TRestDc[TPath][typeof method]["response"]>
) => route(app, path, method, handler);

export const createTypedRouter = <TRestDc extends RestBase>(
    app: core.Express | core.Router
) => ({
    delete: createMethod<TRestDc>("DELETE", app),
    get: createMethod<TRestDc>("GET", app),
    head: createMethod<TRestDc>("HEAD", app),
    options: createMethod<TRestDc>("OPTIONS", app),
    patch: createMethod<TRestDc>("PATCH", app),
    post: createMethod<TRestDc>("POST", app),
    put: createMethod<TRestDc>("PUT", app),
});
