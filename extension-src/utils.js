import { existsSync } from "fs";
import { join } from "path";

export const validatePath = (resolvedPath) => {
    if (!existsSync(resolvedPath)) throw new Error({ id: 410, message: `The path ${resolvedPath} was not found` });
    if (!existsSync(join(resolvedPath, ".git"))) throw new Error({ id: 410, message: `The directory ${resolvedPath} does not appear to be the root of a git repository.` });
};
