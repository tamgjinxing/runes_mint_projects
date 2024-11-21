// src/utils/responseHelper.ts
import { RESPONSE } from './constant';

export function createSuccessResponse<T>(data: T, msg = RESPONSE.SUCCESS_MSG) {
    return {
        code: RESPONSE.SUCCESS_CODE,
        msg,
        data,
    };
}

export function createErrorResponse(msg = "error", code = 500) {
    return {
        code,
        msg,
        data: null,
    };
}
