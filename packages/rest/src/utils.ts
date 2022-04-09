
// * search for literal ":" and match until "/", the end of the string or a
// * space is encountered remembering all characters in between
// * Example: /post/:postId/comment/:commentId matches "postId" and "commentId"
const PATH_PARAM_REGEX = /:(.+?)(?=\/|$|\s)/g;
export const interpolatePath = <T>(path: string) => (params: T) =>
    path.replace(
        PATH_PARAM_REGEX, (_, name) =>
        encodeURIComponent(params[name] || "")
    );
