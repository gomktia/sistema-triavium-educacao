export type ActionOk<T> = { success: true; data: T };
export type ActionFail = { success: false; error: string; fieldErrors?: Record<string, string> };
export type ActionResult<T> = ActionOk<T> | ActionFail;

export function ok<T>(data: T): ActionOk<T> {
    return { success: true, data };
}

export function fail(error: string, fieldErrors?: Record<string, string>): ActionFail {
    return { success: false, error, fieldErrors };
}

export function isOk<T>(result: ActionResult<T>): result is ActionOk<T> {
    return result.success === true;
}

export function isFail<T>(result: ActionResult<T>): result is ActionFail {
    return result.success === false;
}
